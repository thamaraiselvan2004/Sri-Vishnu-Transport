import React, { useState, useMemo } from "react";
import {
  User,
  Calendar,
  Gauge,
  Fuel,
  IndianRupee,
  Wallet,
  TrendingUp,
  MapPin,
  Clock,
  Filter,
  Download,
  Edit3,
  Eye,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Trip, Driver, Vehicle } from "../types";
import {
  calculateDriverStats,
  formatINR,
  formatIndianDate,
} from "../lib/calculations";
import { EditTripModal } from "./EditTripModal";
import { TripDetailsModal } from "./TripDetailsModal";
import { HaltingDetailsModal } from "./HaltingDetailsModal";

interface DriverReportPageProps {
  drivers: Driver[];
  allTrips: Trip[];
  vehicles: Vehicle[];
  onUpdateTrip?: (tripId: string, tripData: Partial<Trip>) => Promise<void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onNavigateAddTrip?: () => void;
  initialDriverId?: string;
}

export const DriverReportPage: React.FC<DriverReportPageProps> = ({
  drivers,
  allTrips,
  vehicles,
  onUpdateTrip,
  onDeleteTrip,
  onNavigateAddTrip,
  initialDriverId,
}) => {
  // Active drivers first
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      if (a.active === b.active) {
        return a.driver_name.localeCompare(b.driver_name);
      }
      return a.active ? -1 : 1;
    });
  }, [drivers]);

  // Selected driver state
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    if (initialDriverId && drivers.some((d) => d.id === initialDriverId)) {
      return initialDriverId;
    }
    const firstActive = drivers.find((d) => d.active);
    return firstActive?.id || drivers[0]?.id || "";
  });

  // Date filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Search filter inside driver's trips
  const [tripSearch, setTripSearch] = useState<string>("");

  // Modals
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [showHaltingDetails, setShowHaltingDetails] = useState(false);
  const [showDriverPaymentDetails, setShowDriverPaymentDetails] = useState(false);
  const [showOtherExpenseDetails, setShowOtherExpenseDetails] = useState(false);

  // Quick preset helper
  const handleQuickPreset = (preset: "all" | "thisMonth" | "last30" | "thisYear") => {
    const now = new Date();
    if (preset === "all") {
      setFromDate("");
      setToDate("");
      return;
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setToDate(todayStr);

    if (preset === "thisMonth") {
      setFromDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
    } else if (preset === "last30") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(
        `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`
      );
    } else if (preset === "thisYear") {
      setFromDate(`${now.getFullYear()}-01-01`);
    }
  };

  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  const selectedDriverName = selectedDriver?.driver_name || "";

  // Calculate driver-specific metrics strictly matching the selected driver
  const dateRange = useMemo(() => {
    return {
      from: fromDate || undefined,
      to: toDate || undefined,
    };
  }, [fromDate, toDate]);

  const stats = useMemo(() => {
    if (!selectedDriverId && !selectedDriverName) {
      return {
        driverId: "",
        driverName: "",
        totalTrips: 0,
        overallRunningKms: 0,
        overallHaltingDays: 0,
        overallDriverBeta: 0,
        overallTotalDieselLitres: 0,
        overallMileage: 0,
        overallAmountPaidToDriver: 0,
        overallRemainingAmountToDriver: 0,
        overallDieselExpense: 0,
        overallTripRevenue: 0,
      };
    }
    return calculateDriverStats(
      selectedDriverId,
      selectedDriverName,
      allTrips,
      dateRange
    );
  }, [selectedDriverId, selectedDriverName, allTrips, dateRange]);

  // Filter trips for the selected driver and date range
  const driverTrips = useMemo(() => {
    const normSelectedName = selectedDriverName.toLowerCase().trim();
    return allTrips.filter((t) => {
      const tripDriverName = (t.driver_name || "").toLowerCase().trim();
      const isSelected =
        (selectedDriverId && t.driver_id === selectedDriverId) ||
        (normSelectedName && tripDriverName === normSelectedName);

      if (!isSelected) return false;

      if (fromDate && t.trip_date < fromDate) return false;
      if (toDate && t.trip_date > toDate) return false;

      if (tripSearch.trim()) {
        const query = tripSearch.toLowerCase().trim();
        const matchesRoute =
          t.from_city.toLowerCase().includes(query) ||
          t.to_city.toLowerCase().includes(query) ||
          t.from_state.toLowerCase().includes(query) ||
          t.to_state.toLowerCase().includes(query);
        const matchesVeh = (t.vehicle_number || "").toLowerCase().includes(query);
        const matchesTransporter = t.transporter_name.toLowerCase().includes(query);
        return matchesRoute || matchesVeh || matchesTransporter;
      }

      return true;
    });
  }, [allTrips, selectedDriverId, selectedDriverName, fromDate, toDate, tripSearch]);

  // Export Driver Report to CSV
  const handleExportCSV = () => {
    if (!selectedDriverName) return;

    const headers = [
      "Trip Date",
      "Vehicle Number",
      "Driver Name",
      "From City",
      "From State",
      "To City",
      "To State",
      "Transporter",
      "Trip Running KMs",
      "Halting Days",
      "Halting Fare (Rs)",
      "Trip Fare (Rs)",
      "Driver Beta (Rs)",
      "Amount Paid To Driver (Rs)",
      "Driver Payment Date",
      "Remaining Amount To Driver (Rs)",
      "Diesel Litres",
      "Diesel Expense (Rs)",
      "Mileage (km/L)",
      "Toll Charges (Rs)",
      "Advance Received (Rs)",
      "Balance Amount (Rs)",
    ];

    const rows = driverTrips.map((t) => [
      t.trip_date,
      `"${t.vehicle_number || ""}"`,
      `"${t.driver_name || ""}"`,
      `"${t.from_city}"`,
      `"${t.from_state}"`,
      `"${t.to_city}"`,
      `"${t.to_state}"`,
      `"${t.transporter_name}"`,
      t.trip_running_kms,
      t.halting_days ?? 0,
      t.halting_fare ?? 0,
      t.trip_fare,
      t.driver_beta,
      t.amount_paid_to_driver ?? 0,
      t.driver_payment_date || "",
      t.remaining_amount_to_driver ?? (t.driver_beta - (t.amount_paid_to_driver ?? 0)),
      t.diesel_litres,
      t.diesel_expense,
      t.mileage,
      t.toll_charges,
      t.advance_received ?? 0,
      t.balance_amount ?? (t.trip_fare - (t.broker_fare || 0) - (t.advance_received ?? 0) + (t.halting_fare ?? 0)),
    ]);

    // Add summary row
    const summaryRows = [
      [],
      ["DRIVER PERFORMANCE REPORT SUMMARY"],
      ["Driver Name", `"${selectedDriverName}"`],
      ["Date Range Filter", `"${fromDate || "All"} to ${toDate || "All"}"`],
      ["Overall KMs", stats.overallRunningKms],
      ["Overall Halting Days", stats.overallHaltingDays],
      ["Overall Driver Beta (Rs)", stats.overallDriverBeta],
      ["Overall Total Diesel in Litres", stats.overallTotalDieselLitres],
      ["Overall Mileage (km/L)", stats.overallMileage],
      ["Overall Amount Paid to Driver (Rs)", stats.overallAmountPaidToDriver],
      ["Overall Remaining Amount to Driver (Rs)", stats.overallRemainingAmountToDriver],
      ["Total Trips Driven", stats.totalTrips],
      ["Overall Freight Fare Generated (Rs)", stats.overallTripRevenue],
      [],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      summaryRows.map((r) => r.join(",")).join("\n") +
      "\n" +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const cleanDriverSlug = selectedDriverName.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Driver_Report_${cleanDriverSlug}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Driver Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Driver Performance &amp; Settlement Statement
                </span>
                {selectedDriver && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      selectedDriver.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedDriver.active ? "Active Driver" : "Inactive"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectedDriverName || "Select Driver"}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Comprehensive driver-based ledger showing running distance, driver beta allowances, diesel consumption, mileage, and wage settlements.
          </p>
        </div>

        {/* Driver Selection Dropdown & CSV Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto">
            <label
              htmlFor="driver-select-dropdown"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
            >
              Select Driver Name
            </label>
            <select
              id="driver-select-dropdown"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortedDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.driver_name} {d.active ? "" : "(Inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end">
            <button
              id="export-driver-csv-btn"
              type="button"
              onClick={handleExportCSV}
              disabled={!selectedDriverName || driverTrips.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Filter Driver Report by Date Range</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickPreset("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !fromDate && !toDate
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("thisMonth")}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("last30")}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("thisYear")}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              This Year
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="driver-from-date"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              From Date
            </label>
            <input
              id="driver-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="driver-to-date"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              To Date
            </label>
            <input
              id="driver-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Dates</span>
              </button>
            )}
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{driverTrips.length}</strong> trips for{" "}
              <strong className="text-white">{selectedDriverName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6 CORE DRIVER REPORT METRIC CARDS (Requested by User) */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Performance &amp; Settlement Summary ({selectedDriverName})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Calculated strictly when driver = {selectedDriverName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Overall KMs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide">
                Overall KMs
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-2">
              {stats.overallRunningKms.toLocaleString("en-IN")} KM
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total distance driven across {stats.totalTrips} trips
            </div>
          </div>

          {/* 2. Overall Driver Beta */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide">
                Overall Driver Beta
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-2">
              {formatINR(stats.overallDriverBeta)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total trip allowances earned (15% or manual)
            </div>
          </div>

          {/* 3. Overall Total Diesel in Litres */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide">
                Overall Total Diesel in Litres
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-orange-700 mt-2">
              {stats.overallTotalDieselLitres} Litres
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Diesel cost: {formatINR(stats.overallDieselExpense)}
            </div>
          </div>

          {/* 4. Overall Mileage (overall kms / overall Total Diesel in Litres) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-amber-400/80 bg-amber-50/20 p-5 rounded-2xl shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Overall Mileage
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-900 mt-2">
              {stats.overallMileage} km/L
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              (overall kms / overall Total Diesel in Litres)
            </div>
          </div>

          {/* 5. Overall Amount Paid to Driver */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between text-slate-500">
              <button type="button" onClick={() => setShowDriverPaymentDetails(true)} className="text-xs font-bold uppercase tracking-wide text-left hover:text-indigo-700">
                Overall Amount Paid to Driver
              </button>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 mt-2">
              {formatINR(stats.overallAmountPaidToDriver)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Disbursed advances and cash payments to driver
            </div>
          </div>

          <button id="driver-overall-other-expenses-card" type="button" onClick={() => setShowOtherExpenseDetails(true)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition text-left">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide">Overall Other Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><IndianRupee className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-700 mt-2">{formatINR(stats.overallOtherExpenses)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Click to view trip-wise details</div>
          </button>

          {/* 6. Overall Remaining Amount to Driver */}
          <div
            className={`p-5 rounded-2xl border-2 shadow-xs hover:shadow-sm transition ${
              stats.overallRemainingAmountToDriver > 0
                ? "bg-rose-50/40 border-rose-400 text-rose-950"
                : "bg-emerald-50/40 border-emerald-400 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide">
                Overall Remaining Amount to Driver
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                  stats.overallRemainingAmountToDriver > 0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {stats.overallRemainingAmountToDriver > 0
                  ? "Pending Settlement"
                  : "Fully Settled"}
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${
                stats.overallRemainingAmountToDriver > 0
                  ? "text-rose-700"
                  : "text-emerald-700"
              }`}
            >
              {formatINR(stats.overallRemainingAmountToDriver)}
            </div>
            <div className="text-xs opacity-75 mt-1">
              Formula: (overall driver beta - overall amount paid to driver)
            </div>
          </div>

          {/* 7. Overall Halting Days (Requested by User) */}
          <button type="button" onClick={() => setShowHaltingDetails(true)} className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition hover:border-purple-300 cursor-pointer">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">
                Halting Days
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-800 mt-2">
              {stats.overallHaltingDays} Days
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Overall halting / detention days of {selectedDriverName}
            </div>
          </button>
        </div>
      </div>

      <HaltingDetailsModal isOpen={showHaltingDetails} onClose={() => setShowHaltingDetails(false)} driverName={selectedDriverName} trips={driverTrips} />

      {/* Driver Settlement Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Driver Payment Settlement Progress
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {formatINR(stats.overallAmountPaidToDriver)} paid of{" "}
              {formatINR(stats.overallDriverBeta)} total beta
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black font-mono text-blue-700">
              {stats.overallDriverBeta > 0
                ? Math.min(
                    100,
                    Math.round(
                      (stats.overallAmountPaidToDriver / stats.overallDriverBeta) * 100
                    )
                  )
                : 100}
              %
            </span>
            <div className="text-xs text-slate-500">Settled to driver</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 ${
              stats.overallRemainingAmountToDriver <= 0
                ? "bg-emerald-500"
                : "bg-blue-600"
            }`}
            style={{
              width: `${
                stats.overallDriverBeta > 0
                  ? Math.min(
                      100,
                      (stats.overallAmountPaidToDriver / stats.overallDriverBeta) * 100
                    )
                  : 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* DRIVER TRIP LEDGER TABLE */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Trip History &amp; Payment Ledger ({selectedDriverName})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized trips driven by {selectedDriverName} with wage disbursement details
            </p>
          </div>

          {/* Quick search inside trips */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search route, vehicle, party..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {driverTrips.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">
              No trips recorded for {selectedDriverName} in this date range.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Select another driver or adjust the date filter above.
            </p>
            {onNavigateAddTrip && (
              <button
                type="button"
                onClick={onNavigateAddTrip}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Log a New Trip
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Transporter</th>
                  <th className="py-3 px-4 text-right">Distance</th>
                  <th className="py-3 px-4 text-center">Halting Days</th>
                  <th className="py-3 px-4 text-right">Driver Beta</th>
                  <th className="py-3 px-4 text-right">Paid to Driver</th>
                  <th className="py-3 px-4 text-right">Remaining Beta</th>
                  <th className="py-3 px-4 text-right">Diesel (L)</th>
                  <th className="py-3 px-4 text-right">Mileage</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {driverTrips.map((trip) => {
                  const paid = Number(trip.amount_paid_to_driver) || 0;
                  const remaining =
                    trip.remaining_amount_to_driver !== undefined &&
                    trip.remaining_amount_to_driver !== null
                      ? Number(trip.remaining_amount_to_driver)
                      : Number(trip.driver_beta) - paid;
                  const loadingDays = Number(trip.loading_halting_days) || 0;
                  const unloadingDays = Number(trip.unloading_halting_days) || 0;
                  const displayHaltingDays = loadingDays + unloadingDays > 0 ? loadingDays + unloadingDays : Number(trip.halting_days) || 0;

                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-blue-50/40 transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatIndianDate(trip.trip_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {trip.vehicle_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {trip.from_city} &rarr; {trip.to_city}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {trip.from_state} to {trip.to_state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[140px] truncate">
                        {trip.transporter_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {trip.trip_running_kms} KM
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          {displayHaltingDays} d
                        </span>
                        {(loadingDays > 0 || unloadingDays > 0) && <div className="mt-1 text-[10px] text-slate-500">L {loadingDays} · U {unloadingDays}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatINR(trip.driver_beta)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-indigo-700">
                          {formatINR(paid)}
                        </div>
                        {trip.driver_payment_date && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatIndianDate(trip.driver_payment_date)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            remaining > 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {formatINR(remaining)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 whitespace-nowrap">
                        {trip.diesel_litres || 0} L
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                        {trip.mileage} km/L
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            id={`driver-view-trip-${trip.id}`}
                            type="button"
                            onClick={() => setInspectingTrip(trip)}
                            title="View Trip Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onUpdateTrip && (
                            <button
                              id={`driver-edit-trip-${trip.id}`}
                              type="button"
                              onClick={() => setEditingTrip(trip)}
                              title="Edit Trip Details"
                              className="p-1.5 rounded-lg text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Trip Details Modal */}
      {inspectingTrip && (
        <TripDetailsModal
          trip={inspectingTrip}
          isOpen={!!inspectingTrip}
          onClose={() => setInspectingTrip(null)}
          onEdit={() => {
            const t = inspectingTrip;
            setInspectingTrip(null);
            setEditingTrip(t);
          }}
        />
      )}

      {/* Edit Trip Modal */}
      {editingTrip && onUpdateTrip && (
        <EditTripModal
          trip={editingTrip}
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          onTripUpdated={async (updated) => {
            await onUpdateTrip(updated.id, updated);
            setEditingTrip(null);
          }}
          vehicles={vehicles}
          drivers={drivers}
        />
      )}

      {showDriverPaymentDetails && (
        <div id="driver-payment-details-modal" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDriverPaymentDetails(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-black text-slate-900">Driver Payment Details</h3><p className="text-xs text-slate-500">Every payment recorded for {selectedDriverName}</p></div><button type="button" onClick={() => setShowDriverPaymentDetails(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Close</button></div>
            <div className="space-y-2">
              {driverTrips.filter((t) => Number(t.amount_paid_to_driver) > 0).length === 0 ? <div className="text-sm text-slate-500 p-4 text-center">No driver payments recorded in this date range.</div> : driverTrips.filter((t) => Number(t.amount_paid_to_driver) > 0).map((t) => <div key={`pay-${t.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"><div><div className="font-bold text-slate-800">{formatIndianDate(t.driver_payment_date || t.trip_date)}</div><div className="text-xs text-slate-500">Trip: {formatIndianDate(t.trip_date)} · {t.vehicle_number || "Vehicle"}</div></div><div className="font-mono font-black text-indigo-700">{formatINR(Number(t.amount_paid_to_driver) || 0)}</div></div>)}
            </div>
          </div>
        </div>
      )}

      {showOtherExpenseDetails && (
        <div id="driver-other-expense-details-modal" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowOtherExpenseDetails(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-black text-slate-900">Other Expense Details</h3><p className="text-xs text-slate-500">Trip-wise other expenses for {selectedDriverName}</p></div><button type="button" onClick={() => setShowOtherExpenseDetails(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Close</button></div>
            <div className="space-y-2">
              {driverTrips.filter((t) => Number(t.other_expenses) > 0).length === 0 ? <div className="text-sm text-slate-500 p-4 text-center">No other expenses recorded in this date range.</div> : driverTrips.filter((t) => Number(t.other_expenses) > 0).map((t) => <div key={`other-${t.id}`} className="p-3 rounded-xl border border-slate-200"><div className="flex items-center justify-between gap-3"><div className="font-bold text-slate-800">{formatIndianDate(t.trip_date)} · {t.vehicle_number || "Vehicle"}</div><div className="font-mono font-black text-rose-700">{formatINR(Number(t.other_expenses) || 0)}</div></div><div className="text-xs text-slate-500 mt-1">{t.from_city} → {t.to_city}</div></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
