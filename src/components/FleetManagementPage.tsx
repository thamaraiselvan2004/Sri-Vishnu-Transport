import React, { useState } from "react";
import {
  Truck,
  Users,
  Plus,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Power,
} from "lucide-react";
import { Vehicle, Driver, Trip } from "../types";
import {
  addVehicle,
  updateVehicleStatus,
  addDriver,
  updateDriverStatus,
} from "../lib/database";

interface FleetManagementPageProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  onRefreshData: () => Promise<void>;
}

export const FleetManagementPage: React.FC<FleetManagementPageProps> = ({
  vehicles,
  drivers,
  trips,
  onRefreshData,
}) => {
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newDriverName, setNewDriverName] = useState("");

  const [vehicleError, setVehicleError] = useState("");
  const [driverError, setDriverError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError("");
    setSuccessMsg("");

    const clean = newVehicleNumber.trim().toUpperCase();
    if (!clean) {
      setVehicleError("Please enter a vehicle registration number.");
      return;
    }

    if (vehicles.some((v) => v.vehicle_number.toUpperCase() === clean)) {
      setVehicleError("A vehicle with this registration number already exists.");
      return;
    }

    try {
      await addVehicle(clean);
      setNewVehicleNumber("");
      await onRefreshData();
      setSuccessMsg(`Vehicle ${clean} added successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setVehicleError("Failed to add vehicle.");
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError("");
    setSuccessMsg("");

    const clean = newDriverName.trim();
    if (!clean) {
      setDriverError("Please enter driver name.");
      return;
    }

    if (drivers.some((d) => d.driver_name.toLowerCase() === clean.toLowerCase())) {
      setDriverError("A driver with this name already exists.");
      return;
    }

    try {
      await addDriver(clean);
      setNewDriverName("");
      await onRefreshData();
      setSuccessMsg(`Driver ${clean} added successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setDriverError("Failed to add driver.");
    }
  };

  const handleToggleVehicle = async (id: string, currentStatus: boolean) => {
    try {
      await updateVehicleStatus(id, !currentStatus);
      await onRefreshData();
    } catch (err) {
      console.error("Failed to update vehicle status:", err);
    }
  };

  const handleToggleDriver = async (id: string, currentStatus: boolean) => {
    try {
      await updateDriverStatus(id, !currentStatus);
      await onRefreshData();
    } catch (err) {
      console.error("Failed to update driver status:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Users className="w-6 h-6" />
          </div>
          <span>Fleet &amp; Driver Master Records</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage Sri Vishnu Logistics trucks and company drivers. Inactive entries
          remain preserved in historical reports without altering old trips.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ============================================================ */}
        {/* VEHICLES SECTION */}
        {/* ============================================================ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Fleet Vehicles ({vehicles.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Truck registration numbers
                </p>
              </div>
            </div>
          </div>

          {/* Add Vehicle Form */}
          <form onSubmit={handleAddVehicle} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Add New Vehicle
            </label>
            <div className="flex gap-2">
              <input
                id="new-vehicle-input-master"
                type="text"
                placeholder="e.g. TN 25 AK 4061"
                value={newVehicleNumber}
                onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-blue-500"
              />
              <button
                id="submit-new-vehicle-master-btn"
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Truck</span>
              </button>
            </div>
            {vehicleError && (
              <p className="text-xs text-red-600">{vehicleError}</p>
            )}
          </form>

          {/* Vehicles List */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {vehicles.map((veh) => {
              const tripCount = trips.filter((t) => t.vehicle_id === veh.id).length;
              return (
                <div
                  key={veh.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {veh.vehicle_number}
                      </span>
                      {veh.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tripCount} trips recorded
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVehicle(veh.id, veh.active)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      veh.active
                        ? "text-amber-700 border-amber-300 hover:bg-amber-50"
                        : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{veh.active ? "Deactivate" : "Activate"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* DRIVERS SECTION */}
        {/* ============================================================ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Drivers ({drivers.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Permanent &amp; contract drivers
                </p>
              </div>
            </div>
          </div>

          {/* Add Driver Form */}
          <form onSubmit={handleAddDriver} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Add New Driver
            </label>
            <div className="flex gap-2">
              <input
                id="new-driver-input-master"
                type="text"
                placeholder="e.g. Manikandan"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <button
                id="submit-new-driver-master-btn"
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Driver</span>
              </button>
            </div>
            {driverError && (
              <p className="text-xs text-red-600">{driverError}</p>
            )}
          </form>

          {/* Drivers List */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {drivers.map((drv) => {
              const tripCount = trips.filter((t) => t.driver_id === drv.id).length;
              return (
                <div
                  key={drv.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {drv.driver_name}
                      </span>
                      {drv.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tripCount} trips logged
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDriver(drv.id, drv.active)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      drv.active
                        ? "text-amber-700 border-amber-300 hover:bg-amber-50"
                        : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{drv.active ? "Deactivate" : "Activate"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
