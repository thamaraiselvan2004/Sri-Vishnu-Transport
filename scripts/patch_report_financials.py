from pathlib import Path
import re

# 1) Extend report types.
p = Path('src/types.ts')
s = p.read_text()
s = s.replace('  overallTripRevenue: number;\n}', '  overallTripRevenue: number;\n  overallOtherExpenses: number;\n}')
s = s.replace('  tollCostPerKm: number;\n}', '  tollCostPerKm: number;\n  totalHaltingDays: number;\n  totalHaltingAmount: number;\n  haltingTripCount: number;\n}')
p.write_text(s)

# 2) Extend calculations. Driver beta is existing beta + halting amount.
p = Path('src/lib/calculations.ts')
s = p.read_text()

# Vehicle stats declarations.
if '  let totalHaltingDays = 0;' not in s:
    s = s.replace('  let totalTripNetProfit = 0;\n', '  let totalTripNetProfit = 0;\n  let totalHaltingDays = 0;\n  let totalHaltingAmount = 0;\n  let haltingTripCount = 0;\n', 1)

# Vehicle stats loop: derive split halting and amount, then aggregate.
needle = '    totalOtherExpenses += Number(t.other_expenses) || 0;\n    overallRunningKms += Number(t.trip_running_kms) || 0;'
repl = '''    totalOtherExpenses += Number(t.other_expenses) || 0;
    const splitDays = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
    const haltingDays = splitDays > 0 ? splitDays : (Number(t.halting_days) || 0);
    const splitAmount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0);
    const haltingAmount = splitAmount > 0 ? splitAmount : (Number(t.halting_fare) || 0);
    totalHaltingDays += haltingDays;
    totalHaltingAmount += haltingAmount;
    if (haltingDays > 0 || haltingAmount > 0) haltingTripCount += 1;
    overallRunningKms += Number(t.trip_running_kms) || 0;'''
if needle in s:
    s = s.replace(needle, repl, 1)

# Return new vehicle fields.
s = s.replace('    tollCostPerKm,\n  };', '    tollCostPerKm,\n    totalHaltingDays,\n    totalHaltingAmount,\n    haltingTripCount,\n  };', 1)

# Driver stats: add other expenses and include halting amount in beta.
if '  let overallOtherExpenses = 0;' not in s:
    s = s.replace('  let overallTripRevenue = 0;\n\n  for (const t of filteredTrips) {', '  let overallTripRevenue = 0;\n  let overallOtherExpenses = 0;\n\n  for (const t of filteredTrips) {', 1)

s = s.replace('    const beta = Number(t.driver_beta) || 0;\n    const splitHalting', '    const beta = Number(t.driver_beta) || 0;\n    const haltingAmount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0) || (Number(t.halting_fare) || 0);\n    const splitHalting', 1)
s = s.replace('    overallDriverBeta += beta;\n', '    overallDriverBeta += beta + haltingAmount;\n', 1)
s = s.replace('    overallTripRevenue += Number(t.trip_fare) || 0;\n', '    overallTripRevenue += Number(t.trip_fare) || 0;\n    overallOtherExpenses += Number(t.other_expenses) || 0;\n', 1)
s = s.replace('    overallTripRevenue,\n  };', '    overallTripRevenue,\n    overallOtherExpenses,\n  };', 1)
p.write_text(s)

# 3) Vehicle report: show total halting days/trips/amount and a report-level net-profit breakdown.
p = Path('src/components/VehicleReportPage.tsx')
s = p.read_text()

marker = '  const insights = useMemo(() => {'
if 'const reportTotalHaltingAmount' not in s:
    inject = '''  const reportTotalHaltingDays = useMemo(() => {
    return vehicleTrips.reduce((sum, t) => {
      const split = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
      return sum + (split > 0 ? split : Number(t.halting_days) || 0);
    }, 0);
  }, [vehicleTrips]);

  const reportTotalHaltingAmount = useMemo(() => {
    return vehicleTrips.reduce((sum, t) => {
      const split = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0);
      return sum + (split > 0 ? split : Number(t.halting_fare) || 0);
    }, 0);
  }, [vehicleTrips]);

  const reportHaltingTripCount = useMemo(() => {
    return vehicleTrips.filter((t) => {
      const days = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
      const amount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0);
      return days > 0 || amount > 0 || Number(t.halting_days) > 0 || Number(t.halting_fare) > 0;
    }).length;
  }, [vehicleTrips]);

  const reportNetProfitIncludingHalting = stats.finalVehicleProfit + reportTotalHaltingAmount;
  const reportDriverBetaIncludingHalting = stats.overallDriverBeta + reportTotalHaltingAmount;

'''
    s = s.replace(marker, inject + marker, 1)

# Inject a compact financial/halting summary before the root VehicleReportPage closing div.
if 'id="vehicle-halting-financial-summary"' not in s:
    idx = s.rfind('\n    </div>\n  );\n};')
    assert idx >= 0, 'VehicleReportPage root closing anchor missing'
    block = '''

      <div id="vehicle-halting-financial-summary" className="bg-white rounded-3xl border border-purple-200 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-purple-900">Halting &amp; Profit Summary</h3>
            <p className="text-xs text-slate-500 mt-1">Halting is shown separately so the report clearly shows the contribution to profit and driver beta.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4"><div className="text-[11px] font-bold text-purple-700 uppercase">Halting Trips</div><div className="text-xl font-black font-mono text-purple-950 mt-1">{reportHaltingTripCount}</div></div>
          <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4"><div className="text-[11px] font-bold text-purple-700 uppercase">Halting Days</div><div className="text-xl font-black font-mono text-purple-950 mt-1">{reportTotalHaltingDays}</div></div>
          <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4"><div className="text-[11px] font-bold text-purple-700 uppercase">Total Halting</div><div className="text-xl font-black font-mono text-purple-950 mt-1">{formatINR(reportTotalHaltingAmount)}</div></div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4"><div className="text-[11px] font-bold text-emerald-700 uppercase">Net Profit + Halting</div><div className="text-xl font-black font-mono text-emerald-800 mt-1">{formatINR(reportNetProfitIncludingHalting)}</div></div>
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4"><div className="text-[11px] font-bold text-indigo-700 uppercase">Driver Beta + Halting</div><div className="text-xl font-black font-mono text-indigo-800 mt-1">{formatINR(reportDriverBetaIncludingHalting)}</div></div>
        </div>
      </div>'''
    s = s[:idx] + block + s[idx:]
p.write_text(s)

# 4) Driver report: clickable paid-to-driver card and other-expenses card, with detail overlays.
p = Path('src/components/DriverReportPage.tsx')
s = p.read_text()

if 'showDriverPaymentDetails' not in s:
    s = s.replace('  const [showHaltingDetails, setShowHaltingDetails] = useState(false);', '  const [showHaltingDetails, setShowHaltingDetails] = useState(false);\n  const [showDriverPaymentDetails, setShowDriverPaymentDetails] = useState(false);\n  const [showOtherExpenseDetails, setShowOtherExpenseDetails] = useState(false);', 1)

# Make the existing paid label clickable without disturbing the card layout.
s = s.replace('''<span className="text-xs font-bold uppercase tracking-wide">\n                Overall Amount Paid to Driver\n              </span>''', '''<button type="button" onClick={() => setShowDriverPaymentDetails(true)} className="text-xs font-bold uppercase tracking-wide text-left hover:text-indigo-700">\n                Overall Amount Paid to Driver\n              </button>''', 1)

# Insert an Other Expenses card immediately after the paid card's card block using a stable next-card comment.
if 'id="driver-overall-other-expenses-card"' not in s:
    anchor = '          {/* 6. Overall Remaining Amount to Driver */}'
    assert anchor in s, 'Driver remaining amount card anchor missing'
    card = '''          <button id="driver-overall-other-expenses-card" type="button" onClick={() => setShowOtherExpenseDetails(true)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition text-left">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide">Overall Other Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><IndianRupee className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-700 mt-2">{formatINR(stats.overallOtherExpenses)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Click to view trip-wise details</div>
          </button>

'''
    s = s.replace(anchor, card + anchor, 1)

# Insert detail overlays before the component's final closing.
if 'id="driver-payment-details-modal"' not in s:
    idx = s.rfind('\n    </div>\n  );\n};')
    assert idx >= 0, 'DriverReportPage root closing anchor missing'
    overlays = '''

      {showDriverPaymentDetails && (
        <div id="driver-payment-details-modal" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDriverPaymentDetails(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-black text-slate-900">Driver Payment Details</h3><p className="text-xs text-slate-500">Every payment recorded for {selectedDriverName}</p></div><button type="button" onClick={() => setShowDriverPaymentDetails(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Close</button></div>
            <div className="space-y-2">
              {driverTrips.filter((t) => Number(t.amount_paid_to_driver) > 0).length === 0 ? <div className="text-sm text-slate-500 p-4 text-center">No driver payments recorded in this date range.</div> : driverTrips.filter((t) => Number(t.amount_paid_to_driver) > 0).map((t) => <div key={`pay-${t.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"><div><div className="font-bold text-slate-800">{formatIndianDate(t.driver_payment_date || t.trip_date)}</div><div className="text-xs text-slate-500">Trip: {formatIndianDate(t.trip_date)} · {t.vehicle_number || "Vehicle"}</div></div><div className="font-mono font-black text-indigo-700">{formatINR(Number(t.amount_paid_to_driver) || 0)}</div></div>)}
            </div>
          </div>
        </div>
      )}

      {showOtherExpenseDetails && (
        <div id="driver-other-expense-details-modal" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowOtherExpenseDetails(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-black text-slate-900">Other Expense Details</h3><p className="text-xs text-slate-500">Trip-wise other expenses for {selectedDriverName}</p></div><button type="button" onClick={() => setShowOtherExpenseDetails(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Close</button></div>
            <div className="space-y-2">
              {driverTrips.filter((t) => Number(t.other_expenses) > 0).length === 0 ? <div className="text-sm text-slate-500 p-4 text-center">No other expenses recorded in this date range.</div> : driverTrips.filter((t) => Number(t.other_expenses) > 0).map((t) => <div key={`other-${t.id}`} className="p-3 rounded-xl border border-slate-200"><div className="flex items-center justify-between gap-3"><div className="font-bold text-slate-800">{formatIndianDate(t.trip_date)} · {t.vehicle_number || "Vehicle"}</div><div className="font-mono font-black text-rose-700">{formatINR(Number(t.other_expenses) || 0)}</div></div><div className="text-xs text-slate-500 mt-1">{t.from_city} → {t.to_city}</div></div>)}
            </div>
          </div>
        </div>
      )}'''
    s = s[:idx] + overlays + s[idx:]
p.write_text(s)

print('REPORT_FINANCIALS_PATCH_OK')
