import React, { useState } from "react";
import {
  Truck,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  MapPin,
  Calendar,
  Fuel,
  Gauge,
  ChevronRight,
  User,
  IndianRupee,
} from "lucide-react";
import { Vehicle, Trip, MaintenanceRecord, Driver } from "../types";
import {
  calculateFleetStats,
  calculateVehicleStats,
  formatINR,
} from "../lib/calculations";
import { VehicleReportPage } from "./VehicleReportPage";
import { DriverReportPage } from "./DriverReportPage";

interface ReportAnalysisContainerProps {
  vehicles: Vehicle[];
  drivers?: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  initialVehicleId?: string;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onUpdateTrip?: (tripId: string, tripData: Partial<Trip>) => Promise<void>;
}

export const ReportAnalysisContainer: React.FC<ReportAnalysisContainerProps> = ({
  vehicles,
  drivers = [],
  trips,
  maintenance,
  initialVehicleId,
  onDeleteTrip,
  onUpdateTrip,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    initialVehicleId || null
  );
  const [viewMode, setViewMode] = useState<"fleet" | "vehicles" | "drivers">(
    initialVehicleId ? "vehicles" : "vehicles"
  );

  const activeVehicles = vehicles.filter((v) => v.active);

  // Calculate fleet stats
  const fleetStats = calculateFleetStats(vehicles, trips, maintenance);

  // If a vehicle is selected, show VehicleReportPage
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  if (selectedVehicleId && currentVehicle) {
    return (
      <VehicleReportPage
        vehicle={currentVehicle}
        allVehicles={activeVehicles}
        allTrips={trips}
        allMaintenance={maintenance}
        drivers={drivers}
        onSelectVehicle={(vehId) => setSelectedVehicleId(vehId)}
        onDeleteTrip={onDeleteTrip}
        onUpdateTrip={onUpdateTrip}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span>Report Analysis &amp; Fleet Intelligence</span>
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Choose an individual vehicle to view its date-filtered statement, or view total company fleet performance.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-200/80 p-1 border border-slate-300/80 gap-1">
          <button
            id="view-mode-vehicles-btn"
            type="button"
            onClick={() => {
              setViewMode("vehicles");
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "vehicles"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Vehicles ({activeVehicles.length})</span>
          </button>
          <button
            id="view-mode-drivers-btn"
            type="button"
            onClick={() => {
              setViewMode("drivers");
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "drivers"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>Driver Reports ({drivers.length})</span>
          </button>
          <button
            id="view-mode-fleet-btn"
            type="button"
            onClick={() => {
              setViewMode("fleet");
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "fleet"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Overall Fleet Dashboard</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: VEHICLE CARDS (SECTION 17) */}
      {/* ============================================================ */}
      {viewMode === "vehicles" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
              Select a Vehicle to Inspect Performance &amp; Date-Range Reports
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeVehicles.map((veh) => {
                const vehTrips = trips.filter((t) => t.vehicle_id === veh.id);
                const vehMaint = maintenance.filter((m) => m.vehicle_id === veh.id);
                const stats = calculateVehicleStats(
                  veh.id,
                  veh.vehicle_number,
                  vehTrips,
                  vehMaint
                );

                return (
                  <div
                    key={veh.id}
                    id={`vehicle-card-${veh.id}`}
                    onClick={() => setSelectedVehicleId(veh.id)}
                    className="bg-white hover:bg-blue-50/40 rounded-3xl p-6 border-2 border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors">
                          <Truck className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-100 text-blue-800">
                          {stats.totalTrips} Trips
                        </span>
                      </div>

                      <h3 className="text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-blue-700">
                        {veh.vehicle_number}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total Distance: <span className="font-mono font-semibold">{stats.overallTripRunningKms} KM</span>
                      </p>

                      <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Revenue:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatINR(stats.totalTripRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Final Net Profit:</span>
                          <span
                            className={`font-mono font-black ${
                              stats.finalVehicleProfit >= 0
                                ? "text-emerald-700"
                                : "text-red-600"
                            }`}
                          >
                            {formatINR(stats.finalVehicleProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Total Toll Charges:</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {formatINR(stats.overallTollExpense)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Total Diesel:</span>
                          <span className="font-mono font-bold text-orange-700">
                            {stats.overallDieselLitres} L
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Fuel Mileage:</span>
                          <span className="font-mono font-bold text-amber-700">
                            {stats.overallMileage} km/L
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                      <span>Open Full Analysis</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: OVERALL FLEET DASHBOARD (SECTION 26) */}
      {/* ============================================================ */}
      {viewMode === "fleet" && (
        <div className="space-y-8">
          {/* Top 6 KPI Cards (including Toll Charges and Total Diesel in Litres) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fleet Gross Revenue
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 mt-1">
                {formatINR(fleetStats.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {fleetStats.totalTrips} completed trips
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Total Fleet Expenses
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-red-600 mt-1">
                {formatINR(fleetStats.totalExpenses)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Fuel, Beta, Tolls, Service
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs bg-emerald-50/20">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Net Company Profit
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
                {formatINR(fleetStats.totalProfit)}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                Margin: {fleetStats.profitMargin}%
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Running Distance
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
                {fleetStats.totalDistance} KM
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Avg: {fleetStats.averageMileage} km/L
              </div>
            </div>

            {/* Total Toll Charges */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total Toll Charges</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700 mt-1">
                {formatINR(fleetStats.totalToll)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                FASTag &amp; plaza charges
              </div>
            </div>

            {/* Overall Total Diesel in Litres */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-orange-600" />
                <span>Total Diesel (L)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-orange-700 mt-1">
                {fleetStats.totalDiesel} L
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Cost: {formatINR(fleetStats.totalDieselExpense)}
              </div>
            </div>
          </div>

          {/* Highlights & Best/Lowest Performers (Section 26) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Best Performing Vehicle */}
            <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Best Performing Vehicle</span>
              </div>
              <div className="text-xl font-mono font-black text-slate-900">
                {fleetStats.bestPerformingVehicle?.vehicleNumber || "N/A"}
              </div>
              <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                {formatINR(fleetStats.bestPerformingVehicle?.profit || 0)} Net Profit
              </div>
            </div>

            {/* Lowest Performing Vehicle */}
            <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Lowest Performer</span>
              </div>
              <div className="text-xl font-mono font-black text-slate-900">
                {fleetStats.lowestPerformingVehicle?.vehicleNumber || "N/A"}
              </div>
              <div className="text-sm font-mono font-bold text-amber-800 mt-1">
                {formatINR(fleetStats.lowestPerformingVehicle?.profit || 0)} Net Profit
              </div>
            </div>

            {/* Best Route */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-200 shadow-xs">
              <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Most Profitable Route</span>
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {fleetStats.bestRoute?.route || "N/A"}
              </div>
              <div className="text-sm font-mono font-bold text-blue-700 mt-1">
                {formatINR(fleetStats.bestRoute?.profit || 0)} across {fleetStats.bestRoute?.trips || 0} trips
              </div>
            </div>

            {/* Highest Expense Category */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-2xl border border-purple-200 shadow-xs">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Fuel className="w-4 h-4 text-purple-600" />
                <span>Highest Cost Category</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {fleetStats.highestExpenseCategory?.category || "Diesel Fuel"}
              </div>
              <div className="text-sm font-mono font-bold text-purple-700 mt-1">
                {formatINR(fleetStats.highestExpenseCategory?.amount || 0)}
              </div>
            </div>
          </div>

          {/* Vehicle Comparison Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Fleet Vehicle Comparison Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Vehicle Number</th>
                    <th className="py-3 px-4 text-center">Trips</th>
                    <th className="py-3 px-4 text-right">Distance</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Tolls</th>
                    <th className="py-3 px-4 text-right">Diesel (L)</th>
                    <th className="py-3 px-4 text-right">Trip Costs</th>
                    <th className="py-3 px-4 text-right">Maintenance</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeVehicles.map((v) => {
                    const vTrips = trips.filter((t) => t.vehicle_id === v.id);
                    const vMaint = maintenance.filter((m) => m.vehicle_id === v.id);
                    const stats = calculateVehicleStats(
                      v.id,
                      v.vehicle_number,
                      vTrips,
                      vMaint
                    );

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {v.vehicle_number}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {stats.totalTrips}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {stats.overallTripRunningKms} KM
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-blue-700">
                          {formatINR(stats.totalTripRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-700">
                          {formatINR(stats.overallTollExpense)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-orange-700">
                          {stats.overallDieselLitres} L
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatINR(stats.totalTripExpenses)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700">
                          {formatINR(stats.overallMaintenanceAmount)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            stats.finalVehicleProfit >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {formatINR(stats.finalVehicleProfit)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedVehicleId(v.id)}
                            className="px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          >
                            View Report &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* VIEW 3: DRIVER REPORTS */}
      {/* ============================================================ */}
      {viewMode === "drivers" && (
        <DriverReportPage
          drivers={drivers}
          allTrips={trips}
          vehicles={vehicles}
          onUpdateTrip={onUpdateTrip}
          onDeleteTrip={onDeleteTrip}
        />
      )}
    </div>
  );
};
