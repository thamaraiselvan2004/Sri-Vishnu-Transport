import React, { useEffect, useMemo, useState } from "react";
import { Gauge, Plus, Trash2, Calculator, CalendarDays } from "lucide-react";
import { ManualMileageRecord, Vehicle } from "../types";
import {
  addManualMileageRecord,
  deleteManualMileageRecord,
  getManualMileageRecords,
} from "../lib/database";

interface ManualMileageSectionProps {
  vehicle: Vehicle;
  allVehicles?: Vehicle[];
  onVehicleChange?: (vehicleId: string) => void;
}

export const ManualMileageSection: React.FC<ManualMileageSectionProps> = ({
  vehicle,
  allVehicles = [],
  onVehicleChange,
}) => {
  const [records, setRecords] = useState<ManualMileageRecord[]>([]);
  const [startingOdometer, setStartingOdometer] = useState("");
  const [endingOdometer, setEndingOdometer] = useState("");
  const [dieselLitres, setDieselLitres] = useState("");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = Number(startingOdometer) || 0;
  const end = Number(endingOdometer) || 0;
  const diesel = Number(dieselLitres) || 0;
  const previewMileage = diesel > 0 && end >= start ? (end - start) / diesel : 0;

  const loadRecords = async () => {
    try {
      setError("");
      setRecords(await getManualMileageRecords(vehicle.id));
    } catch (err) {
      console.error(err);
      setError("Unable to load manual mileage records.");
    }
  };

  useEffect(() => {
    loadRecords();
  }, [vehicle.id]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.trip_number - b.trip_number),
    [records]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (start < 0 || end < 0 || diesel <= 0 || end <= start) {
      setError("Enter valid odometer readings and diesel litres. Ending odometer must be greater than starting odometer.");
      return;
    }

    try {
      setSaving(true);
      await addManualMileageRecord({
        vehicle_id: vehicle.id,
        record_date: recordDate,
        starting_odometer: start,
        ending_odometer: end,
        diesel_litres: diesel,
        mileage: previewMileage,
      });
      setStartingOdometer("");
      setEndingOdometer("");
      setDieselLitres("");
      await loadRecords();
    } catch (err) {
      console.error(err);
      setError("Could not save this manual mileage record. Make sure the manual_mileage table has been created in Supabase.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manual mileage record?")) return;
    try {
      await deleteManualMileageRecord(id);
      await loadRecords();
    } catch (err) {
      console.error(err);
      setError("Could not delete the manual mileage record.");
    }
  };

  return (
    <section className="bg-white rounded-3xl border-2 border-violet-200 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Manual Mileage</h2>
            <p className="text-xs text-slate-500">Additional odometer-based mileage records — existing trip mileage is unchanged.</p>
          </div>
        </div>
        {allVehicles.length > 1 && onVehicleChange && (
          <select
            value={vehicle.id}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm"
          >
            {allVehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
          </select>
        )}
      </div>

      <form onSubmit={handleAdd} className="rounded-2xl bg-violet-50/60 border border-violet-100 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Starting Odometer</label>
            <input type="number" min="0" step="0.01" value={startingOdometer} onChange={(e) => setStartingOdometer(e.target.value)} placeholder="e.g. 50000" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ending Odometer</label>
            <input type="number" min="0" step="0.01" value={endingOdometer} onChange={(e) => setEndingOdometer(e.target.value)} placeholder="e.g. 50450" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Diesel in Litres</label>
            <input type="number" min="0" step="0.01" value={dieselLitres} onChange={(e) => setDieselLitres(e.target.value)} placeholder="e.g. 100" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Record Date</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-800">
            <Calculator className="w-4 h-4" />
            Mileage = ({end || 0} − {start || 0}) ÷ {diesel || 0} = {previewMileage.toFixed(2)} km/L
          </div>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold">
            <Plus className="w-4 h-4" />
            {saving ? "Saving..." : "Save Manual Mileage"}
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Manual Mileage History — {vehicle.vehicle_number}</h3>
        {sortedRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No manual mileage records yet. Add Trip 1 above.</div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="font-black text-slate-900">Trip {r.trip_number}</div>
                  <div className="text-xs font-semibold text-slate-500">{r.record_date}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><div className="text-[11px] font-bold uppercase text-slate-500">Starting Odometer</div><div className="font-mono font-bold mt-1">{r.starting_odometer}</div></div>
                  <div><div className="text-[11px] font-bold uppercase text-slate-500">Ending Odometer</div><div className="font-mono font-bold mt-1">{r.ending_odometer}</div></div>
                  <div><div className="text-[11px] font-bold uppercase text-slate-500">Diesel</div><div className="font-mono font-bold mt-1">{r.diesel_litres} L</div></div>
                  <div><div className="text-[11px] font-bold uppercase text-violet-700">Mileage</div><div className="font-mono font-black text-violet-700 mt-1">{r.mileage.toFixed(2)} km/L</div></div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => handleDelete(r.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
