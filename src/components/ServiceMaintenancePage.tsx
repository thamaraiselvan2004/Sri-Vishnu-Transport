import React, { useState } from "react";
import {
  Wrench,
  Calendar,
  Truck,
  Gauge,
  IndianRupee,
  FileText,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Vehicle, MaintenanceRecord } from "../types";
import { formatINR, formatIndianDate } from "../lib/calculations";
import { addMaintenanceRecord, deleteMaintenanceRecord } from "../lib/database";

interface ServiceMaintenancePageProps {
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  onMaintenanceUpdated: () => Promise<void>;
}

const SERVICE_TYPES = [
  "General Service",
  "Engine",
  "Tyres",
  "Brake",
  "Oil Change",
  "Electrical",
  "Repair",
  "Other",
];

export const ServiceMaintenancePage: React.FC<ServiceMaintenancePageProps> = ({
  vehicles,
  maintenanceRecords,
  onMaintenanceUpdated,
}) => {
  const activeVehicles = vehicles.filter((v) => v.active);

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    return activeVehicles[0]?.id || "";
  });
  const [maintenanceDate, setMaintenanceDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [odometerReading, setOdometerReading] = useState("");
  const [serviceType, setServiceType] = useState("General Service");
  const [customServiceType, setCustomServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [filterVehicleId, setFilterVehicleId] = useState<string>("ALL");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedVehicleId) {
      setErrorMsg("Please select a vehicle.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setErrorMsg("Please enter a valid maintenance expense amount.");
      return;
    }

    const finalServiceType =
      serviceType === "Other" && customServiceType.trim()
        ? customServiceType.trim()
        : serviceType;

    const v = vehicles.find((item) => item.id === selectedVehicleId);
    const vehicleNumber = v ? v.vehicle_number : "";

    setIsSubmitting(true);

    try {
      await addMaintenanceRecord({
        vehicle_id: selectedVehicleId,
        maintenance_date: maintenanceDate,
        odometer_reading: parseFloat(odometerReading) || 0,
        service_type: finalServiceType,
        description: description.trim(),
        amount: numAmount,
        notes: notes.trim(),
        vehicle_number: vehicleNumber,
      });

      await onMaintenanceUpdated();

      setSuccessMsg("Maintenance record saved successfully!");
      // Reset some fields
      setDescription("");
      setAmount("");
      setNotes("");
      setOdometerReading("");
      setCustomServiceType("");

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to save maintenance record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaintenanceRecord(id);
      await onMaintenanceUpdated();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete maintenance record:", err);
    }
  };

  // Filtered maintenance list for the bottom section
  const displayedRecords = maintenanceRecords.filter((rec) => {
    if (filterVehicleId === "ALL") return true;
    return rec.vehicle_id === filterVehicleId;
  });

  const totalSpentOnDisplayed = displayedRecords.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
            <Wrench className="w-6 h-6" />
          </div>
          <span>Vehicle Service &amp; Maintenance</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Record vehicle repairs, tyre replacements, and scheduled maintenance.
          These costs are automatically factored into vehicle profit reports.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form: Add New Maintenance */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">
          Log New Service / Repair
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Select Vehicle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="maintenance-vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="" disabled>
                    -- Choose Vehicle --
                  </option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Service Date <span className="text-red-500">*</span>
              </label>
              <input
                id="maintenance-date-input"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Odometer */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Odometer Reading (KM)
              </label>
              <input
                id="maintenance-odometer-input"
                type="number"
                step="any"
                placeholder="e.g. 142500"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="maintenance-service-type-select"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
              >
                {SERVICE_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {serviceType === "Other" && (
                <input
                  type="text"
                  placeholder="Specify custom service type"
                  value={customServiceType}
                  onChange={(e) => setCustomServiceType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Maintenance Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                  ₹
                </span>
                <input
                  id="maintenance-amount-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 8500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Work Description
              </label>
              <input
                id="maintenance-desc-input"
                type="text"
                placeholder="e.g. Brake pad change, diesel filter, alignment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Workshop / Invoice Notes
              </label>
              <input
                id="maintenance-notes-input"
                type="text"
                placeholder="e.g. Authorized garage, Bill #8492"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="submit-maintenance-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Saving..." : "Save Maintenance Record"}
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Service Maintenance Records</span>
            </h2>
            <p className="text-xs text-slate-500">
              Newest maintenance records listed first
            </p>
          </div>

          {/* Vehicle Filter */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Filter Vehicle:
            </label>
            <select
              id="maintenance-filter-vehicle"
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
          <span>Total Maintenance Spent:</span>
          <span className="font-mono font-bold">
            {formatINR(totalSpentOnDisplayed)}
          </span>
          <span className="text-amber-700 font-normal">
            ({displayedRecords.length} records)
          </span>
        </div>

        {/* Records Listing */}
        {displayedRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No maintenance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatIndianDate(rec.maintenance_date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                      {rec.vehicle_number}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {rec.odometer_reading ? `${rec.odometer_reading} KM` : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        {rec.service_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {rec.description || rec.notes || "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      {formatINR(rec.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {deleteConfirmId === rec.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-md"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
