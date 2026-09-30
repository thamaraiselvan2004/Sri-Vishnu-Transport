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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteMileageStatusRecord(deleteTarget);
      setDeleteTarget(null);
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || "Unable to delete mileage record.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const visibleRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <section id="vehicle-saved-mileage-records" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[620px] flex flex-col">
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
      <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-hidden">
        {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading mileage records...</div> : records.length === 0 ? <div className="py-10 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">No mileage records saved for this vehicle yet.</div> : <div className="h-full overflow-y-auto pr-1 space-y-3">
          {visibleRecords.map((record, index) => <div key={record.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">Record {index + 1}</div><div className="text-xs text-slate-500 mt-1">{formatDateTime(record.starting_datetime)} → {formatDateTime(record.ending_datetime)}</div></div><button type="button" onClick={() => setDeleteTarget(record.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label="Delete mileage record"><Trash2 className="w-4 h-4" /></button></div>
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
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-mileage-title">
            <h3 id="delete-mileage-title" className="text-lg font-black text-slate-900">Delete Mileage Record?</h3>
            <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this mileage record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={deleting} onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
