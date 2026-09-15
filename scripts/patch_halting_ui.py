from pathlib import Path
import re

# AddTripPage
p = Path('src/components/AddTripPage.tsx')
s = p.read_text()
old = '''  const [haltingDays, setHaltingDays] = useState<string>("0");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState<string>("0");'''
new = '''  const [haltingDays, setHaltingDays] = useState<string>("0");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState<string>("0");
  const [loadingHaltingDays, setLoadingHaltingDays] = useState<string>("0");
  const [loadingHaltingChargePerDay, setLoadingHaltingChargePerDay] = useState<string>("0");
  const [unloadingHaltingDays, setUnloadingHaltingDays] = useState<string>("0");
  const [unloadingHaltingChargePerDay, setUnloadingHaltingChargePerDay] = useState<string>("0");'''
assert old in s, 'AddTripPage state anchor missing'
s = s.replace(old, new, 1)
old = '''  const numHaltingDays = parseFloat(haltingDays) || 0;
  const numHaltingChargePerDay = parseFloat(haltingChargePerDay) || 0;
  const haltingFare = numHaltingDays * numHaltingChargePerDay;'''
new = '''  const numLoadingHaltingDays = parseFloat(loadingHaltingDays) || 0;
  const numLoadingHaltingChargePerDay = parseFloat(loadingHaltingChargePerDay) || 0;
  const loadingHaltingFare = numLoadingHaltingDays * numLoadingHaltingChargePerDay;
  const numUnloadingHaltingDays = parseFloat(unloadingHaltingDays) || 0;
  const numUnloadingHaltingChargePerDay = parseFloat(unloadingHaltingChargePerDay) || 0;
  const unloadingHaltingFare = numUnloadingHaltingDays * numUnloadingHaltingChargePerDay;
  const numHaltingDays = numLoadingHaltingDays + numUnloadingHaltingDays;
  const haltingFare = loadingHaltingFare + unloadingHaltingFare;
  const numHaltingChargePerDay = numHaltingDays > 0 ? haltingFare / numHaltingDays : 0;'''
assert old in s, 'AddTripPage calculation anchor missing'
s = s.replace(old, new, 1)
old = '''        halting_days: numHaltingDays,
        halting_charge_per_day: numHaltingChargePerDay,
        halting_fare: haltingFare,
        from_state:'''
new = '''        halting_days: numHaltingDays,
        halting_charge_per_day: numHaltingChargePerDay,
        halting_fare: haltingFare,
        loading_halting_days: numLoadingHaltingDays,
        loading_halting_charge_per_day: numLoadingHaltingChargePerDay,
        loading_halting_fare: loadingHaltingFare,
        unloading_halting_days: numUnloadingHaltingDays,
        unloading_halting_charge_per_day: numUnloadingHaltingChargePerDay,
        unloading_halting_fare: unloadingHaltingFare,
        from_state:'''
assert old in s, 'AddTripPage payload anchor missing'
s = s.replace(old, new, 1)
start = s.find('          {/* HALTING DETAILS (DAYS, CHARGE/DAY & HALTING FARE) */}')
end = s.find('          {/* ADVANCE & BALANCE COLLECTION (PARTY / TRANSPORTER) */}', start)
assert start >= 0 and end >= 0, 'AddTripPage halting section anchors missing'
block = '''          {/* HALTING DETAILS — SEPARATE LOADING & UNLOADING */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
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

# EditTripModal
p = Path('src/components/EditTripModal.tsx')
s = p.read_text()
old = '''  const [haltingDays, setHaltingDays] = useState("");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState("");'''
new = '''  const [haltingDays, setHaltingDays] = useState("");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState("");
  const [loadingHaltingDays, setLoadingHaltingDays] = useState("0");
  const [loadingHaltingChargePerDay, setLoadingHaltingChargePerDay] = useState("0");
  const [unloadingHaltingDays, setUnloadingHaltingDays] = useState("0");
  const [unloadingHaltingChargePerDay, setUnloadingHaltingChargePerDay] = useState("0");'''
assert old in s, 'EditTripModal state anchor missing'
s=s.replace(old,new,1)
old='''    setHaltingDays(String(trip.halting_days ?? "0"));
    setHaltingChargePerDay(String(trip.halting_charge_per_day ?? "0"));'''
new='''    setHaltingDays(String(trip.halting_days ?? "0"));
    setHaltingChargePerDay(String(trip.halting_charge_per_day ?? "0"));
    setLoadingHaltingDays(String(trip.loading_halting_days ?? "0"));
    setLoadingHaltingChargePerDay(String(trip.loading_halting_charge_per_day ?? "0"));
    setUnloadingHaltingDays(String(trip.unloading_halting_days ?? "0"));
    setUnloadingHaltingChargePerDay(String(trip.unloading_halting_charge_per_day ?? "0"));'''
assert old in s, 'EditTripModal effect anchor missing'
s=s.replace(old,new,1)
old='''  const haltingFare = numberValue(haltingDays) * numberValue(haltingChargePerDay);'''
new='''  const loadingHaltingFare = numberValue(loadingHaltingDays) * numberValue(loadingHaltingChargePerDay);
  const unloadingHaltingFare = numberValue(unloadingHaltingDays) * numberValue(unloadingHaltingChargePerDay);
  const totalHaltingDays = numberValue(loadingHaltingDays) + numberValue(unloadingHaltingDays);
  const haltingFare = loadingHaltingFare + unloadingHaltingFare;'''
assert old in s, 'EditTripModal calc anchor missing'
s=s.replace(old,new,1)
old='''        halting_fare: haltingFare,
        advance_received:'''
new='''        halting_fare: haltingFare,
        halting_days: totalHaltingDays,
        halting_charge_per_day: totalHaltingDays > 0 ? haltingFare / totalHaltingDays : 0,
        loading_halting_days: numberValue(loadingHaltingDays),
        loading_halting_charge_per_day: numberValue(loadingHaltingChargePerDay),
        loading_halting_fare: loadingHaltingFare,
        unloading_halting_days: numberValue(unloadingHaltingDays),
        unloading_halting_charge_per_day: numberValue(unloadingHaltingChargePerDay),
        unloading_halting_fare: unloadingHaltingFare,
        advance_received:'''
assert old in s, 'EditTripModal payload anchor missing'
s=s.replace(old,new,1)
pattern=r'''          <section>\n            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Halting</h3>\n            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">.*?          </section>\n\n          <section>'''
replacement='''          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Halting / Detention</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4"><div className="mb-3 text-sm font-bold text-purple-900">Loading Halting</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label><span className={labelClass}>Days</span><input type="number" min="0" className={inputClass} value={loadingHaltingDays} onChange={e => setLoadingHaltingDays(e.target.value)} /></label><label><span className={labelClass}>Charge / Day</span><input type="number" min="0" className={inputClass} value={loadingHaltingChargePerDay} onChange={e => setLoadingHaltingChargePerDay(e.target.value)} /></label><div className="rounded-xl bg-white border border-purple-200 p-3 text-sm text-purple-800">Fare<br /><b>{formatINR(loadingHaltingFare)}</b></div></div></div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4"><div className="mb-3 text-sm font-bold text-indigo-900">Unloading Halting</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label><span className={labelClass}>Days</span><input type="number" min="0" className={inputClass} value={unloadingHaltingDays} onChange={e => setUnloadingHaltingDays(e.target.value)} /></label><label><span className={labelClass}>Charge / Day</span><input type="number" min="0" className={inputClass} value={unloadingHaltingChargePerDay} onChange={e => setUnloadingHaltingChargePerDay(e.target.value)} /></label><div className="rounded-xl bg-white border border-indigo-200 p-3 text-sm text-indigo-800">Fare<br /><b>{formatINR(unloadingHaltingFare)}</b></div></div></div>
            </div>
            <div className="mt-3 rounded-xl bg-purple-100 p-3 text-sm text-purple-900 flex items-center justify-between"><span><b>Total Halting:</b> {totalHaltingDays} days</span><b>{formatINR(haltingFare)}</b></div>
          </section>

          <section>'''
s,n=re.subn(pattern,replacement,s,flags=re.S)
assert n==1, f'EditTripModal JSX replacement count {n}'
p.write_text(s)

# calculations
p=Path('src/lib/calculations.ts')
s=p.read_text()
old='    const halting = Number(t.halting_days) || 0;'
new='    const splitHalting = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);\n    const halting = splitHalting > 0 ? splitHalting : (Number(t.halting_days) || 0);'
assert old in s, 'calculations halting anchor missing'
s=s.replace(old,new,1)
p.write_text(s)

# DriverReportPage
p=Path('src/components/DriverReportPage.tsx')
s=p.read_text()
old='import { TripDetailsModal } from "./TripDetailsModal";'
new='import { TripDetailsModal } from "./TripDetailsModal";\nimport { HaltingDetailsModal } from "./HaltingDetailsModal";'
assert old in s, 'DriverReport import anchor missing'
s=s.replace(old,new,1)
old='  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);'
new='  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);\n  const [showHaltingDetails, setShowHaltingDetails] = useState(false);'
assert old in s, 'DriverReport state anchor missing'
s=s.replace(old,new,1)
old='''          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">
                Halting Days
              </span>'''
new='''          <button type="button" onClick={() => setShowHaltingDetails(true)} className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-purple-300 cursor-pointer">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">
                Halting Days
              </span>'''
assert old in s, 'DriverReport halting card start missing'
s=s.replace(old,new,1)
old='''          </div>
        </div>
      </div>

      {/* Driver Settlement Progress Bar */}'''
new='''          </button>
        </div>
      </div>

      <HaltingDetailsModal isOpen={showHaltingDetails} onClose={() => setShowHaltingDetails(false)} driverName={selectedDriverName} trips={driverTrips} />

      {/* Driver Settlement Progress Bar */}'''
assert old in s, 'DriverReport halting card end missing'
s=s.replace(old,new,1)
old='''                  const remaining =
                    trip.remaining_amount_to_driver !== undefined &&
                    trip.remaining_amount_to_driver !== null
                      ? Number(trip.remaining_amount_to_driver)
                      : Number(trip.driver_beta) - paid;

                  return ('''
new='''                  const remaining =
                    trip.remaining_amount_to_driver !== undefined &&
                    trip.remaining_amount_to_driver !== null
                      ? Number(trip.remaining_amount_to_driver)
                      : Number(trip.driver_beta) - paid;
                  const loadingDays = Number(trip.loading_halting_days) || 0;
                  const unloadingDays = Number(trip.unloading_halting_days) || 0;
                  const displayHaltingDays = loadingDays + unloadingDays > 0 ? loadingDays + unloadingDays : Number(trip.halting_days) || 0;

                  return ('''
assert old in s, 'DriverReport row calc anchor missing'
s=s.replace(old,new,1)
old='''                          {trip.halting_days ?? 0} d
                        </span>'''
new='''                          {displayHaltingDays} d
                        </span>
                        {(loadingDays > 0 || unloadingDays > 0) && <div className="mt-1 text-[10px] text-slate-500">L {loadingDays} · U {unloadingDays}</div>}'''
assert old in s, 'DriverReport row halting cell missing'
s=s.replace(old,new,1)
p.write_text(s)

print('PATCH_OK')
