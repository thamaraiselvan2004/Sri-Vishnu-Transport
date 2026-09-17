import React, { useEffect, useState } from "react";
import { Gauge, Trash2, Truck } from "lucide-react";
import { MileageStatusRecord, Vehicle } from "../types";
import { deleteMileageStatusRecord, getMileageStatusRecords } from "../lib/database";

interface VehicleSavedMileageRecordsProps { vehicle: Vehicle; }

export const VehicleSavedMileageRecords: React.FC<VehicleSavedMileageRecordsProps> = ({ vehicle }) => {
  const [records, setRecords] = useState<MileageStatusRecord[]>([]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecords(await getMileageStatusRecords(vehicle.id));
      setShowAllRecords(false);
    } catch (err: any) {
      setError(err?.message || "Unable to load mileage records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [vehicle.id]);

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteMileageStatusRecord(id);
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || "Unable to delete mileage record.");
    }
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const visibleRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <section id="vehicle-saved-mileage-records" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-violet-700 text-xs font-bold uppercase tracking-wider"><Gauge className="w-4 h-4" /><span>Saved Mileage Records</span></div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{vehicle.vehicle_number} — Saved Mileage Records</h2>
            <p className="text-sm text-slate-600 mt-1">Mileage records saved separately for this vehicle.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700"><Truck className="w-3.5 h-3.5" />{vehicle.vehicle_number}</span>
            {records.length > 1 && <button type="button" onClick={() => setShowAllRecords((expanded) => !expanded)} className="shrink-0 px-3 py-2 rounded-xl border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 text-xs sm:text-sm font-bold transition-colors">{showAllRecords ? "View Less" : "View All"}</button>}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading mileage records...</div> : records.length === 0 ? <div className="py-10 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">No mileage records saved for this vehicle yet.</div> : <div className="space-y-3">
          {visibleRecords.map((record, index) => <div key={record.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">Record {index + 1}</div><div className="text-xs text-slate-500 mt-1">{formatDateTime(record.starting_datetime)} → {formatDateTime(record.ending_datetime)}</div></div><button type="button" onClick={() => handleDelete(record.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label="Delete mileage record"><Trash2 className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              <div><div className="text-[11px] text-slate-500">Starting Odo</div><div className="font-bold text-slate-800">{record.starting_odometer.toFixed(2)}</div></div>
              <div><div className="text-[11px] text-slate-500">Ending Odo</div><div className="font-bold text-slate-800">{record.ending_odometer.toFixed(2)}</div></div>
              <div><div className="text-[11px] text-slate-500">Distance</div><div className="font-bold text-slate-800">{Math.max(0, record.ending_odometer - record.starting_odometer).toFixed(2)} km</div></div>
              <div><div className="text-[11px] text-slate-500">Diesel</div><div className="font-bold text-slate-800">{record.diesel_litres.toFixed(2)} L</div></div>
              <div><div className="text-[11px] text-slate-500">Mileage</div><div className="font-bold text-violet-700">{record.mileage.toFixed(2)} km/L</div></div>
            </div>
          </div>)}
        </div>}
        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
      </div>
    </section>
  );
};
