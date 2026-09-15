from pathlib import Path
import re

# AddTripPage: replace only the visible halting UI; preserve the new split state/calculations already present.
p = Path('src/components/AddTripPage.tsx')
s = p.read_text()
start = s.find('          {/* ============================================================ */}\n          {/* HALTING DETAILS (DAYS, CHARGE/DAY & HALTING FARE) */}')
end = s.find('          {/* ============================================================ */}\n          {/* ADVANCE & BALANCE COLLECTION (PARTY / TRANSPORTER) */}', start)
assert start >= 0 and end >= 0, 'AddTripPage halting UI anchors missing'
block = '''          {/* ============================================================ */}
          {/* HALTING DETAILS — SEPARATE LOADING & UNLOADING */}
          {/* ============================================================ */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-md">Halting / Detention Details</span>
              <span className="text-[11px] text-slate-500">Loading and unloading halting are stored separately.</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-extrabold text-purple-900">Loading Halting</h3><span className="text-[10px] font-bold uppercase tracking-wide text-purple-600">Loading point</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Days</span><input type="number" min="0" step="any" value={loadingHaltingDays} onChange={(e) => setLoadingHaltingDays(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></label>
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Charge / Day (₹)</span><input type="number" min="0" step="any" value={loadingHaltingChargePerDay} onChange={(e) => setLoadingHaltingChargePerDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></label>
                  <div className="rounded-xl bg-white border border-purple-200 px-3 py-2"><div className="text-[10px] text-purple-700 font-semibold">Loading Halting Fare</div><div className="font-mono font-black text-sm text-purple-950">{formatINR(loadingHaltingFare)}</div></div>
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-extrabold text-indigo-900">Unloading Halting</h3><span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Unloading point</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Days</span><input type="number" min="0" step="any" value={unloadingHaltingDays} onChange={(e) => setUnloadingHaltingDays(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Charge / Day (₹)</span><input type="number" min="0" step="any" value={unloadingHaltingChargePerDay} onChange={(e) => setUnloadingHaltingChargePerDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                  <div className="rounded-xl bg-white border border-indigo-200 px-3 py-2"><div className="text-[10px] text-indigo-700 font-semibold">Unloading Halting Fare</div><div className="font-mono font-black text-sm text-indigo-950">{formatINR(unloadingHaltingFare)}</div></div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-purple-100 border border-purple-200 px-4 py-3 flex items-center justify-between"><div><div className="text-xs font-bold text-purple-900">Total Halting</div><div className="text-[11px] text-purple-700">{numHaltingDays} days · Loading + Unloading</div></div><div className="font-mono font-black text-lg text-purple-950">{formatINR(haltingFare)}</div></div>
          </div>

'''
s = s[:start] + block + s[end:]
p.write_text(s)

# EditTripModal: remove the stale legacy duplicate properties left beside the new split properties.
p = Path('src/components/EditTripModal.tsx')
s = p.read_text()
s = s.replace('''        halting_days: numberValue(haltingDays),\n        halting_charge_per_day: numberValue(haltingChargePerDay),\n        halting_fare: haltingFare,\n        halting_days: totalHaltingDays,''', '''        halting_days: totalHaltingDays,''', 1)
p.write_text(s)

# DriverReportPage: make Halting Days clickable and show per-trip loading/unloading details.
p = Path('src/components/DriverReportPage.tsx')
s = p.read_text()
old = '''          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">\n            <div className="flex items-center justify-between text-slate-500">\n              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">\n                Halting Days\n              </span>'''
new = '''          <button type="button" onClick={() => setShowHaltingDetails(true)} className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-purple-300 cursor-pointer">\n            <div className="flex items-center justify-between text-slate-500">\n              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">\n                Halting Days\n              </span>'''
assert old in s, 'DriverReport halting card start missing'
s = s.replace(old, new, 1)
old = '''          </div>\n        </div>\n      </div>\n\n      {/* Driver Settlement Progress Bar */}'''
new = '''          </button>\n        </div>\n      </div>\n\n      <HaltingDetailsModal isOpen={showHaltingDetails} onClose={() => setShowHaltingDetails(false)} driverName={selectedDriverName} trips={driverTrips} />\n\n      {/* Driver Settlement Progress Bar */}'''
assert old in s, 'DriverReport halting card end missing'
s = s.replace(old, new, 1)
old = '''                  const remaining =\n                    trip.remaining_amount_to_driver !== undefined &&\n                    trip.remaining_amount_to_driver !== null\n                      ? Number(trip.remaining_amount_to_driver)\n                      : Number(trip.driver_beta) - paid;\n\n                  return ('''
new = '''                  const remaining =\n                    trip.remaining_amount_to_driver !== undefined &&\n                    trip.remaining_amount_to_driver !== null\n                      ? Number(trip.remaining_amount_to_driver)\n                      : Number(trip.driver_beta) - paid;\n                  const loadingDays = Number(trip.loading_halting_days) || 0;\n                  const unloadingDays = Number(trip.unloading_halting_days) || 0;\n                  const displayHaltingDays = loadingDays + unloadingDays > 0 ? loadingDays + unloadingDays : Number(trip.halting_days) || 0;\n\n                  return ('''
assert old in s, 'DriverReport row calc anchor missing'
s = s.replace(old, new, 1)
old = '''                          {trip.halting_days ?? 0} d\n                        </span>'''
new = '''                          {displayHaltingDays} d\n                        </span>\n                        {(loadingDays > 0 || unloadingDays > 0) && <div className="mt-1 text-[10px] text-slate-500">L {loadingDays} · U {unloadingDays}</div>}'''
assert old in s, 'DriverReport row halting cell missing'
s = s.replace(old, new, 1)
p.write_text(s)

# calculations.ts: only patch if the old legacy-only line is still present.
p = Path('src/lib/calculations.ts')
s = p.read_text()
old = '    const halting = Number(t.halting_days) || 0;'
new = '    const splitHalting = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);\n    const halting = splitHalting > 0 ? splitHalting : (Number(t.halting_days) || 0);'
if old in s:
    s = s.replace(old, new, 1)
p.write_text(s)

print('PATCH_OK')
