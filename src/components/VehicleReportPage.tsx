import React, { useState, useMemo } from "react";
import {
  Truck,
  Calendar,
  IndianRupee,
  Gauge,
  Fuel,
  Percent,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  User,
  Wallet,
} from "lucide-react";
import { Vehicle, Trip, MaintenanceRecord, VehicleReportStats, Driver } from "../types";
import {
  calculateVehicleStats,
  calculateDriverStats,
  generateVehicleInsights,
  formatINR,
  formatIndianDate,
} from "../lib/calculations";
import { exportVehicleReportToCSV } from "../lib/exportCsv";
import { VehicleCharts } from "./VehicleCharts";
import { TripDetailsModal } from "./TripDetailsModal";
import { EditTripModal } from "./EditTripModal";

interface VehicleReportPageProps {
  vehicle: Vehicle;
  allVehicles: Vehicle[];
  allTrips: Trip[];
  allMaintenance: MaintenanceRecord[];
  drivers?: Driver[];
  onSelectVehicle: (vehicleId: string) => void;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onUpdateTrip?: (tripId: string, tripData: Partial<Trip>) => Promise<void>;
}

export const VehicleReportPage: React.FC<VehicleReportPageProps> = ({
  vehicle,
  allVehicles,
  allTrips,
  allMaintenance,
  drivers = [],
  onSelectVehicle,
  onDeleteTrip,
  onUpdateTrip,
}) => {
  // Date filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Applied filter state (when user clicks "Generate Report")
  const [appliedFromDate, setAppliedFromDate] = useState<string>("");
  const [appliedToDate, setAppliedToDate] = useState<string>("");

  // Driver filter state
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [appliedDriverId, setAppliedDriverId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"summary" | "charts" | "trips" | "insights">("summary");
  const [selectedTripForModal, setSelectedTripForModal] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Quick preset handler
  const handleQuickPreset = (preset: "all" | "thisMonth" | "last30" | "thisYear") => {
    const now = new Date();
    if (preset === "all") {
      setFromDate("");
      setToDate("");
      setSelectedDriverId("");
      setAppliedFromDate("");
      setAppliedToDate("");
      setAppliedDriverId("");
    } else if (preset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(today);
      setAppliedFromDate(firstDay);
      setAppliedToDate(today);
    } else if (preset === "last30") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      setFromDate(past30);
      setToDate(today);
      setAppliedFromDate(past30);
      setAppliedToDate(today);
    } else if (preset === "thisYear") {
      const firstJan = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      setFromDate(firstJan);
      setToDate(today);
      setAppliedFromDate(firstJan);
      setAppliedToDate(today);
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedDriverId(selectedDriverId);
  };

  // Selected driver details & stats (when driver filter is active)
  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === appliedDriverId);
  }, [drivers, appliedDriverId]);

  const selectedDriverName = selectedDriver?.driver_name || "";

  const driverStats = useMemo(() => {
    if (!appliedDriverId && !selectedDriverName) return null;
    return calculateDriverStats(
      appliedDriverId,
      selectedDriverName,
      allTrips,
      { from: appliedFromDate || undefined, to: appliedToDate || undefined }
    );
  }, [appliedDriverId, selectedDriverName, allTrips, appliedFromDate, appliedToDate]);

  // -------------------------------------------------------------
  // Filter Data strictly for this vehicle and applied date range
  // -------------------------------------------------------------
  const vehicleTrips = useMemo(() => {
    return allTrips
      .filter((t) => t.vehicle_id === vehicle.id)
      .filter((t) => {
        if (appliedFromDate && t.trip_date < appliedFromDate) return false;
        if (appliedToDate && t.trip_date > appliedToDate) return false;
        return true;
      })
      .sort((a, b) => b.trip_date.localeCompare(a.trip_date)); // Newest first
  }, [allTrips, vehicle.id, appliedFromDate, appliedToDate]);

  const vehicleMaintenance = useMemo(() => {
    return allMaintenance
      .filter((m) => m.vehicle_id === vehicle.id)
      .filter((m) => {
        if (appliedFromDate && m.maintenance_date < appliedFromDate) return false;
        if (appliedToDate && m.maintenance_date > appliedToDate) return false;
        return true;
      })
      .sort((a, b) => b.maintenance_date.localeCompare(a.maintenance_date));
  }, [allMaintenance, vehicle.id, appliedFromDate, appliedToDate]);

  // Comprehensive business stats
  const stats: VehicleReportStats = useMemo(() => {
    return calculateVehicleStats(
      vehicle.id,
      vehicle.vehicle_number,
      vehicleTrips,
      vehicleMaintenance
    );
  }, [vehicle.id, vehicle.vehicle_number, vehicleTrips, vehicleMaintenance]);

  const reportTotalHaltingDays = useMemo(() => {
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

  const insights = useMemo(() => {
    return generateVehicleInsights(stats, vehicleTrips, vehicleMaintenance);
  }, [stats, vehicleTrips, vehicleMaintenance]);

  const handleExportCSV = () => {
    exportVehicleReportToCSV(
      vehicle.vehicle_number,
      vehicleTrips,
      vehicleMaintenance,
      stats
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Vehicle Header & Vehicle Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                {vehicle.vehicle_number}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Active Fleet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Dedicated Vehicle Report &amp; Performance Analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Change Vehicle Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Switch Vehicle:
            </label>
            <select
              id="report-switch-vehicle-select"
              value={vehicle.id}
              onChange={(e) => onSelectVehicle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number}
                </option>
              ))}
            </select>
          </div>

          {/* Export to CSV Button */}
          <button
            id="export-vehicle-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Presets Card */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Select Date Range</span>
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset("all")}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("thisMonth")}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("last30")}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("thisYear")}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                This Year
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                From Date
              </label>
              <input
                id="report-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                To Date
              </label>
              <input
                id="report-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="report-driver-filter-select"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Filter by Driver
              </label>
              <select
                id="report-driver-filter-select"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Drivers (Fleet Combined)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.driver_name} {d.active ? "" : "(Inactive)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                id="generate-report-btn"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Generate Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {(appliedFromDate || appliedToDate) ? (
              <div className="text-blue-400 font-medium">
                Viewing date range: {appliedFromDate ? formatIndianDate(appliedFromDate) : "Start"} &rarr; {appliedToDate ? formatIndianDate(appliedToDate) : "Present"}
              </div>
            ) : (
              <div className="text-slate-400">Viewing lifetime records</div>
            )}
            {selectedDriverName && (
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Driver Filter Active: {selectedDriverName}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/* DRIVER-BASED REPORT (Shown when driver is selected) */}
      {/* ============================================================ */}
      {driverStats && selectedDriverName && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border-2 border-blue-500/50 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Driver Performance Report
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {selectedDriverName}
                </h3>
              </div>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Only showing metrics where Driver = <strong>{selectedDriverName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Overall KMs */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                Overall KMs
              </div>
              <div className="text-xl font-black font-mono text-white mt-1">
                {driverStats.overallRunningKms.toLocaleString("en-IN")} KM
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {driverStats.totalTrips} trips
              </div>
            </div>

            {/* 2. Overall Driver Beta */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">
                Overall Driver Beta
              </div>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                {formatINR(driverStats.overallDriverBeta)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Beta allowance
              </div>
            </div>

            {/* 3. Overall Total Diesel in Litres */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-[11px] font-bold text-orange-300 uppercase tracking-wide">
                Overall Total Diesel
              </div>
              <div className="text-xl font-black font-mono text-orange-400 mt-1">
                {driverStats.overallTotalDieselLitres} L
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {formatINR(driverStats.overallDieselExpense)}
              </div>
            </div>

            {/* 4. Overall Mileage */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                Overall Mileage
              </div>
              <div className="text-xl font-black font-mono text-amber-400 mt-1">
                {driverStats.overallMileage} km/L
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                kms / diesel litres
              </div>
            </div>

            {/* 5. Overall Amount Paid to Driver */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">
                Overall Paid to Driver
              </div>
              <div className="text-xl font-black font-mono text-indigo-300 mt-1">
                {formatINR(driverStats.overallAmountPaidToDriver)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Wage disbursement
              </div>
            </div>

            {/* 6. Overall Remaining Amount to Driver */}
            <div
              className={`p-3.5 rounded-xl border ${
                driverStats.overallRemainingAmountToDriver > 0
                  ? "bg-rose-500/20 border-rose-400/50 text-rose-200"
                  : "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wide">
                Overall Remaining Beta
              </div>
              <div className="text-xl font-black font-mono mt-1">
                {formatINR(driverStats.overallRemainingAmountToDriver)}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                beta - amount paid
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 21: EASY-TO-UNDERSTAND 10TH-GRADE DASHBOARD */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Vehicle Performance Snapshot
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Trips */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Total Trips
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats.totalTrips}
            </div>
            <div className="text-xs text-slate-500 mt-1">Completed runs</div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Total Revenue
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 mt-1">
              {formatINR(stats.totalTripRevenue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Gross freight fare</div>
          </div>

          {/* Card 3: Total Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Total Expenses
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-red-600 mt-1">
              {formatINR(stats.totalAllExpenses)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Trip costs + Service</div>
          </div>

          {/* Card 4: Final Net Profit */}
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs bg-emerald-50/20">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Final Net Profit
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">
              {formatINR(stats.finalVehicleProfit)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              Margin: {stats.profitMargin}%
            </div>
          </div>

          {/* Card 5: Distance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span>Distance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
              {stats.overallTripRunningKms} KM
            </div>
            <div className="text-xs text-slate-500 mt-1">Total running distance</div>
          </div>

          {/* Card 6: Total Toll Charges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Toll Charges</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 mt-1">
              {formatINR(stats.overallTollExpense)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Highway &amp; FASTag tolls
            </div>
          </div>

          {/* Card 7: Overall Total Diesel in Litres */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-orange-600" />
              <span>Overall Total Diesel</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-orange-700 mt-1">
              {stats.overallDieselLitres} Litres
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Total fuel cost: {formatINR(stats.overallDieselExpense)}
            </div>
          </div>

          {/* Card 8: Overall Mileage */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Average Mileage
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 mt-1">
              {stats.overallMileage} km/L
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Running KMs / Diesel Litres
            </div>
          </div>

          {/* Card 9: Service Maintenance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Service Maintenance
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 mt-1">
              {formatINR(stats.overallMaintenanceAmount)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {vehicleMaintenance.length} service records
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Report Sections */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4">
        <button
          onClick={() => setActiveTab("summary")}
          className={`py-3 px-3 sm:px-5 font-bold text-sm border-b-2 transition ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Detailed Financial Statement
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`py-3 px-3 sm:px-5 font-bold text-sm border-b-2 transition ${
            activeTab === "charts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Visual Charts &amp; Trends
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`py-3 px-3 sm:px-5 font-bold text-sm border-b-2 transition ${
            activeTab === "insights"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Business Insights ({insights.length})
        </button>
        <button
          onClick={() => setActiveTab("trips")}
          className={`py-3 px-3 sm:px-5 font-bold text-sm border-b-2 transition ${
            activeTab === "trips"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Trip History ({vehicleTrips.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DETAILED FINANCIAL STATEMENT (SECTION 20) */}
      {/* ============================================================ */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Full Income &amp; Expense Statement for {vehicle.vehicle_number}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Freight Inflow */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Freight Inflow
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Freight Trip Fare</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatINR(stats.totalTripRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Number of Trips</span>
                    <span className="font-mono font-medium">{stats.totalTrips}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total Running Distance</span>
                    <span className="font-mono font-medium">{stats.overallTripRunningKms} KM</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Trip Expenses */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trip Operating Costs
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Diesel Expense</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.overallDieselExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Driver Beta (15% / Fixed)</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.overallDriverBeta)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Broker Fare</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalBrokerFare)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Toll Charges</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.overallTollExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Loading Expense</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalLoadingExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Unloading Expense</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalUnloadingExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Other Trip Expenses</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalOtherExpenses)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Total Trip Expenses</span>
                    <span className="font-mono text-red-600">
                      {formatINR(stats.totalTripExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Total Net Calculation */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2.5">
                <span className="text-slate-300">Total Trip Net Profit (Fare &minus; Trip Expenses)</span>
                <span className="font-mono font-bold text-base text-blue-400">
                  {formatINR(stats.totalTripNetProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2.5">
                <span className="text-slate-300">
                  Vehicle Service &amp; Maintenance Expense ({stats.maintenanceRecordCount} records)
                </span>
                <span className="font-mono font-bold text-base text-amber-400">
                  &minus; {formatINR(stats.overallMaintenanceAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <div>
                  <div className="text-lg font-extrabold uppercase tracking-wide text-white">
                    Final Vehicle Profit
                  </div>
                  <div className="text-xs text-slate-400">
                    Includes all trip operations and vehicle service expenses
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      stats.finalVehicleProfit >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatINR(stats.finalVehicleProfit)}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">
                    Net Margin: {stats.profitMargin}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: VISUAL CHARTS & TRENDS (SECTION 22) */}
      {/* ============================================================ */}
      {activeTab === "charts" && (
        <VehicleCharts
          trips={vehicleTrips}
          maintenance={vehicleMaintenance}
          stats={stats}
        />
      )}

      {/* ============================================================ */}
      {/* TAB 3: BUSINESS INSIGHTS & PROFIT IMPROVEMENT (SECTION 27 & 28) */}
      {/* ============================================================ */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          {/* Metrics per KM / per Trip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold">Revenue per KM</div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                ₹{stats.overallTripRunningKms > 0 ? (stats.totalTripRevenue / stats.overallTripRunningKms).toFixed(2) : "0.00"}/km
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold">Profit per KM</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                ₹{stats.overallTripRunningKms > 0 ? (stats.finalVehicleProfit / stats.overallTripRunningKms).toFixed(2) : "0.00"}/km
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold">Avg Profit per Trip</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {stats.totalTrips > 0 ? formatINR(stats.finalVehicleProfit / stats.totalTrips) : "₹0"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold">Fuel Cost per KM</div>
              <div className="text-xl font-bold font-mono text-orange-700 mt-1">
                ₹{stats.overallTripRunningKms > 0 ? (stats.overallDieselExpense / stats.overallTripRunningKms).toFixed(2) : "0.00"}/km
              </div>
            </div>
          </div>

          {/* Rule-based AI/Algorithm Insights Cards */}
          <div className="space-y-4">
            {insights.map((item, idx) => {
              const isGood = item.type === "good";
              const isWarning = item.type === "warning";
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex items-start gap-3.5 transition ${
                    isGood
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                      : isWarning
                      ? "bg-amber-50/70 border-amber-300 text-amber-950"
                      : "bg-blue-50/70 border-blue-300 text-blue-950"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isGood
                        ? "bg-emerald-600 text-white"
                        : isWarning
                        ? "bg-amber-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isGood ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>{item.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isGood
                            ? "bg-emerald-200 text-emerald-900"
                            : isWarning
                            ? "bg-amber-200 text-amber-900"
                            : "bg-blue-200 text-blue-900"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-slate-700 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: TRIP HISTORY (SECTION 23) */}
      {/* ============================================================ */}
      {activeTab === "trips" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Trip History for {vehicle.vehicle_number} (Most Recent First)
            </h3>
            <span className="text-xs text-slate-500">
              Click any trip to inspect full details
            </span>
          </div>

          {vehicleTrips.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
              No trip records found for this vehicle in the selected date range.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {vehicleTrips.map((trip) => (
                <div
                  key={trip.id}
                  id={`trip-card-${trip.id}`}
                  onClick={() => setSelectedTripForModal(trip)}
                  className="bg-white hover:bg-blue-50/40 active:bg-blue-100/50 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {trip.vehicle_number}
                      </span>
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatIndianDate(trip.trip_date)}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {trip.from_city} &rarr; {trip.to_city}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Driver: <span className="font-semibold text-slate-700">{trip.driver_name}</span> &bull; Transporter: {trip.transporter_name} &bull; Distance: {trip.trip_running_kms} KM &bull; Mileage: {trip.mileage} km/L
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">
                        Fare: <span className="font-semibold text-slate-800 font-mono">{formatINR(trip.trip_fare)}</span>
                      </div>
                      <div
                        className={`text-base font-bold font-mono mt-0.5 ${
                          trip.net_profit >= 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        Profit: {formatINR(trip.net_profit)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                      <button
                        id={`edit-trip-card-${trip.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTrip(trip);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trip Details Modal (Section 24) */}
      <TripDetailsModal
        trip={selectedTripForModal}
        onClose={() => setSelectedTripForModal(null)}
        onDeleteTrip={onDeleteTrip}
        onEditTrip={(tripToEdit) => {
          setSelectedTripForModal(null);
          setEditingTrip(tripToEdit);
        }}
      />

      {/* Dedicated Edit Saved Trip Modal */}
      <EditTripModal
        trip={editingTrip}
        isOpen={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        onTripUpdated={async (updated) => {
          if (onUpdateTrip) {
            await onUpdateTrip(updated.id, updated);
          }
          setEditingTrip(null);
        }}
        vehicles={allVehicles}
        drivers={drivers}
      />

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
      </div>
    </div>
  );
};
