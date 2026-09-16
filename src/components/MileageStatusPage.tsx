import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gauge, Save, Trash2, Truck } from "lucide-react";
import { Vehicle, MileageStatusRecord } from "../types";
import {
  addMileageStatusRecord,
  deleteMileageStatusRecord,
  getMileageStatusRecords,
} from "../lib/database";

interface MileageStatusPageProps {
  vehicles: Vehicle[];
  onNavigateHome: () => void;
  initialVehicleId?: string;
}

export const MileageStatusPage: React.FC<MileageStatusPageProps> = ({ vehicles, onNavigateHome, initialVehicleId }) => {
  const activeVehicles = vehicles.filter((v) => v.active);
  const [vehicleId, setVehicleId] = useState(initialVehicleId || activeVehicles[0]?.id || "");
  const [startingDateTime, setStartingDateTime] = useState("");
  const [endingDateTime, setEndingDateTime] = useState("");
  const [startingOdometer, setStartingOdometer] = useState("");
  const [endingOdometer, setEndingOdometer] = useState("");
  const [dieselLitres, setDieselLitres] = useState("");
  const [records, setRecords] = useState<MileageStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialVehicleId) {
      setVehicleId(initialVehicleId);
    } else if (!vehicleId && activeVehicles[0]) {
      setVehicleId(activeVehicles[0].id);
    }
  }, [initialVehicleId, activeVehicles, vehicleId]);

  const loadRecords = async () => {
    if (!vehicleId) return;
    try {
      setLoading(true);
      setError(null);
      setRecords(await getMileageStatusRecords(vehicleId));
    } catch (err: any) {
      setError(err?.message || "Unable to load mileage records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [vehicleId]);

  const calculatedMileage = useMemo(() => {
    const start = Number(startingOdometer);
    const end = Number(endingOdometer);
    const diesel = Number(dieselLitres);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(diesel) || diesel <= 0 || end < start) return 0;
    return (end - start) / diesel;
  }, [startingOdometer, endingOdometer, dieselLitres]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const start = Number(startingOdometer);
    const end = Number(endingOdometer);
    const diesel = Number(dieselLitres);

    if (!vehicleId || !startingDateTime || !endingDateTime) {
      setError("Please select the vehicle and enter both date & time values.");
      return;
    }
    if (new Date(endingDateTime).getTime() < new Date(startingDateTime).getTime()) {
      setError("Ending date & time cannot be before starting date & time.");
      return;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      setError("Ending odometer must be greater than or equal to starting odometer.");
      return;
    }
    if (!Number.isFinite(diesel) || diesel <= 0) {
      setError("Diesel litres must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      await addMileageStatusRecord({
        vehicle_id: vehicleId,
        starting_datetime: new Date(startingDateTime).toISOString(),
        ending_datetime: new Date(endingDateTime).toISOString(),
        starting_odometer: start,
        ending_odometer: end,
        diesel_litres: diesel,
        mileage: calculatedMileage,
      });
      setStartingDateTime("");
      setEndingDateTime("");
      setStartingOdometer("");
      setEndingOdometer("");
      setDieselLitres("");
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || "Unable to save mileage record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMileageStatusRecord(id);
      await loadRecords();
    } catch (err: any) {
      setError(err?.message || "Unable to delete mileage record.");
    }
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const selectedVehicleNumber = activeVehicles.find((v) => v.id === vehicleId)?.vehicle_number;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-sm"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Gauge className="w-7 h-7 text-violet-600" /> Mileage Status
          </h1>
          <p className="text-sm text-slate-500 mt-1">Record vehicle mileage using odometer readings and diesel consumption.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Vehicle</label>
            {initialVehicleId ? (
              <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-sm font-bold text-violet-900">
                <Truck className="w-4 h-4 text-violet-600" />
                <span>{selectedVehicleNumber || "Selected vehicle"}</span>
              </div>
            ) : (
              <div className="relative">
                <Truck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold" required>
                  <option value="">Select vehicle</option>
                  {activeVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Starting Date & Time</label>
              <input type="datetime-local" value={startingDateTime} onChange={(e) => setStartingDateTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Ending Date & Time</label>
              <input type="datetime-local" value={endingDateTime} onChange={(e) => setEndingDateTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Starting Odometer</label>
              <input type="number" min="0" step="0.01" value={startingOdometer} onChange={(e) => setStartingOdometer(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" placeholder="0" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Ending Odometer</label>
              <input type="number" min="0" step="0.01" value={endingOdometer} onChange={(e) => setEndingOdometer(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" placeholder="0" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Diesel Litres</label>
            <input type="number" min="0.01" step="0.01" value={dieselLitres} onChange={(e) => setDieselLitres(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" placeholder="0.00" required />
          </div>

          <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-600">Calculated Mileage</div>
            <div className="text-3xl font-extrabold text-violet-900 mt-1">{calculatedMileage > 0 ? calculatedMileage.toFixed(2) : "0.00"} <span className="text-base font-semibold">km/L</span></div>
            <div className="text-xs text-violet-700 mt-1">(Ending Odometer − Starting Odometer) ÷ Diesel Litres</div>
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

          <button type="submit" disabled={saving || !vehicleId} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Mileage Record"}
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Saved Mileage Records</h2>
              <p className="text-xs text-slate-500 mt-1">Each record is saved separately for the selected vehicle.</p>
            </div>
            {vehicleId && <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">{selectedVehicleNumber}</span>}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading mileage records...</div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">No mileage records saved for this vehicle yet.</div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <div key={record.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">Record {index + 1}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatDateTime(record.starting_datetime)} → {formatDateTime(record.ending_datetime)}</div>
                    </div>
                    <button type="button" onClick={() => handleDelete(record.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label="Delete mileage record"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                    <div><div className="text-[11px] text-slate-500">Starting Odo</div><div className="font-bold text-slate-800">{record.starting_odometer.toFixed(2)}</div></div>
                    <div><div className="text-[11px] text-slate-500">Ending Odo</div><div className="font-bold text-slate-800">{record.ending_odometer.toFixed(2)}</div></div>
                    <div><div className="text-[11px] text-slate-500">Distance</div><div className="font-bold text-slate-800">{Math.max(0, record.ending_odometer - record.starting_odometer).toFixed(2)} km</div></div>
                    <div><div className="text-[11px] text-slate-500">Diesel</div><div className="font-bold text-slate-800">{record.diesel_litres.toFixed(2)} L</div></div>
                    <div><div className="text-[11px] text-slate-500">Mileage</div><div className="font-bold text-violet-700">{record.mileage.toFixed(2)} km/L</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
