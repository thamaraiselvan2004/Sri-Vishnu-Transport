import React, { useState } from "react";
import {
  PlusCircle,
  BarChart3,
  Wrench,
  Truck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Eye,
  Clock,
  Search,
  X,
} from "lucide-react";
import { Trip, Vehicle, MaintenanceRecord, Driver } from "../types";
import { formatINR, formatIndianDate } from "../lib/calculations";
import { EditTripModal } from "./EditTripModal";
import { TripDetailsModal } from "./TripDetailsModal";
import { MileageStatusHomeCard } from "./MileageStatusHomeCard";

interface HomePageProps {
  onNavigate: (tab: string, vehicleId?: string) => void;
  trips: Trip[];
  vehicles: Vehicle[];
  drivers?: Driver[];
  maintenance: MaintenanceRecord[];
  onUpdateTrip?: (tripId: string, tripData: Partial<Trip>) => Promise<void>;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  trips,
  vehicles,
  drivers = [],
  maintenance,
  onUpdateTrip,
}) => {
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [viewAllTrips, setViewAllTrips] = useState<boolean>(false);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>("all");
  const [tripSearch, setTripSearch] = useState<string>("");
  const [selectedKpi, setSelectedKpi] = useState<"trips" | "revenue" | "profit" | null>(null);

  const activeVehicles = vehicles.filter((v) => v.active);

  // Filtered trips based on vehicle filter and search
  const filteredTrips = trips.filter((t) => {
    if (selectedVehicleFilter !== "all" && t.vehicle_id !== selectedVehicleFilter) {
      return false;
    }
    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase().trim();
      return (
        t.from_city.toLowerCase().includes(q) ||
        t.to_city.toLowerCase().includes(q) ||
        (t.vehicle_number || "").toLowerCase().includes(q) ||
        (t.driver_name || "").toLowerCase().includes(q) ||
        t.transporter_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Display all or recent 3 trips
  const displayedTrips = viewAllTrips ? filteredTrips : filteredTrips.slice(0, 3);

  // Home Page business KPIs are calculated for the current month only.
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthLabel = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const getMonthKey = (value: string | null | undefined) => {
    if (!value) return "";
    const match = String(value).match(/^(\\d{4})-(\\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? ""
      : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  };

  const currentMonthTrips = trips.filter(
    (t) => getMonthKey(t.trip_date) === currentMonthKey
  );
  const currentMonthMaintenance = maintenance.filter(
    (m) => getMonthKey(m.maintenance_date) === currentMonthKey
  );
  const totalRevenue = currentMonthTrips.reduce(
    (sum, t) => sum + (Number(t.trip_fare) || 0),
    0
  );
  const totalTripProfit = currentMonthTrips.reduce(
    (sum, t) => sum + (Number(t.net_profit) || 0),
    0
  );
  const totalMaintenanceExpense = currentMonthMaintenance.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );
  const totalHalting = currentMonthTrips.reduce(
    (sum, t) =>
      sum +
      (Number(t.loading_halting_fare) || 0) +
      (Number(t.unloading_halting_fare) || 0),
    0
  );
  const finalProfit = totalTripProfit - totalMaintenanceExpense + totalHalting;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Private Business Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome to Sri Vishnu Logistics
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Digital trip recording, automated 15% driver beta calculations,
            vehicle-wise analytics, and maintenance tracking for our fleet.
          </p>
        </div>

        {/* Subtle Decorative Icon */}
        <Truck className="absolute -right-6 -bottom-6 w-44 h-44 text-blue-500/10 pointer-events-none" />
      </div>

      {/* SECTION 3: THREE LARGE MAIN BUTTONS/CARDS */}
      <div className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-1">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Add Trip */}
          <button
            id="home-action-add-trip-btn"
            onClick={() => onNavigate("add-trip")}
            className="group text-left bg-white hover:bg-blue-50/60 active:bg-blue-100/80 rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md shadow-blue-600/25">
                <PlusCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. Add Trip
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-normal">
                Enter a new transportation trip, route, running KMs, diesel fuel, and expenses.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <span>Start Trip Entry</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: Report Analysis */}
          <button
            id="home-action-reports-btn"
            onClick={() => onNavigate("reports")}
            className="group text-left bg-white hover:bg-emerald-50/60 active:bg-emerald-100/80 rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md shadow-emerald-600/25">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                2. Report Analysis
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-normal">
                View vehicle-wise date-range reports, profit margins, diesel
                mileage trends, and charts.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span>Explore Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 3: Service Maintenance */}
          <button
            id="home-action-service-btn"
            onClick={() => onNavigate("service")}
            className="group text-left bg-white hover:bg-amber-50/60 active:bg-amber-100/80 rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-amber-600 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md shadow-amber-600/25">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                3. Service Maintenance
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-normal">
                Record and view vehicle repairs, tyre changes, oil service, and
                mechanical expenses.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <span>Log Maintenance</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="md:col-start-3 mt-5">
          <MileageStatusHomeCard
            onNavigate={() => onNavigate("mileage-status")}
          />
        </div>
      </div>

      {/* Quick Business KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Fleet Vehicles
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {activeVehicles.length}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {activeVehicles.length} active on road
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedKpi("trips")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition shadow-xs"
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Trips</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{currentMonthTrips.length}</div>
          <div className="text-xs text-slate-500 mt-1">{currentMonthLabel} • Click for vehicle details</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedKpi("revenue")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition shadow-xs"
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Revenue</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1">{formatINR(totalRevenue)}</div>
          <div className="text-xs text-slate-500 mt-1">{currentMonthLabel} • Click for vehicle details</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedKpi("profit")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition shadow-xs"
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Business Profit</div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">{formatINR(finalProfit)}</div>
          <div className="text-xs text-slate-500 mt-1">{currentMonthLabel} • Click for vehicle details</div>
        </button>
      </div>

      {/* Vehicle Quick Selector & Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles Quick Access */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Our Fleet Vehicles</span>
            </h3>
            <button
              onClick={() => onNavigate("drivers-vehicles")}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Show All Vehicles button */}
            <button
              type="button"
              onClick={() => {
                setSelectedVehicleFilter("all");
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left text-xs font-semibold ${
                selectedVehicleFilter === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-blue-50/50 border-slate-200"
              }`}
            >
              <span>All Vehicles ({trips.length} Trips)</span>
              <span className="text-[11px] font-mono opacity-90">Show All</span>
            </button>

            {activeVehicles.map((veh) => {
              const vehTrips = trips.filter((t) => t.vehicle_id === veh.id);
              const vehProfit = vehTrips.reduce((s, t) => s + (t.net_profit || 0), 0);
              const isSelected = selectedVehicleFilter === veh.id;

              return (
                <button
                  key={veh.id}
                  id={`home-vehicle-select-${veh.id}`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedVehicleFilter("all");
                    } else {
                      setSelectedVehicleFilter(veh.id);
                      setViewAllTrips(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left group ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-100 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-800 font-mono group-hover:text-blue-700">
                      {veh.vehicle_number}
                    </div>
                    <div className="text-xs text-slate-500">
                      {vehTrips.length} trips recorded
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-700 font-mono">
                      {formatINR(vehProfit)}
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium underline">
                      {isSelected ? "Active" : "View"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trips Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>
                  {viewAllTrips ? "All Completed Trips" : "Recent Completed Trips"}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  ({displayedTrips.length} of {filteredTrips.length})
                </span>
              </h3>
              {selectedVehicleFilter !== "all" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Filtered by vehicle:{" "}
                    <strong className="font-mono">
                      {vehicles.find((v) => v.id === selectedVehicleFilter)?.vehicle_number || selectedVehicleFilter}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleFilter("all")}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* View All toggle button - directly shows each trip instead of redirecting */}
            <button
              id="home-view-all-trips-btn"
              type="button"
              onClick={() => setViewAllTrips(!viewAllTrips)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition shadow-xs"
            >
              <span>
                {viewAllTrips
                  ? "Show Recent (3)"
                  : `View All (${filteredTrips.length} Trips)`}
              </span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  viewAllTrips ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          {/* Quick search input when viewing all trips */}
          {viewAllTrips && (
            <div className="mb-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by route, driver, vehicle, transporter..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tripSearch && (
                <button
                  type="button"
                  onClick={() => setTripSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {displayedTrips.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {trips.length === 0
                ? "No trips recorded yet. Click 'Add Trip' to log the first trip."
                : "No trips found matching the selected filter."}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {displayedTrips.map((trip) => {
                const balanceAmt =
                  trip.balance_amount !== undefined && trip.balance_amount !== null
                    ? Number(trip.balance_amount)
                    : (Number(trip.trip_fare) || 0) -
                      (Number(trip.broker_fare) || 0) -
                      (Number(trip.advance_received) || 0) +
                      (Number(trip.halting_fare) || 0);

                return (
                  <div
                    key={trip.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:shadow-xs transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {trip.vehicle_number}
                          </span>
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatIndianDate(trip.trip_date)}
                          </span>
                          {trip.halting_days ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Halting: {trip.halting_days}d ({formatINR(trip.halting_fare || 0)})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            {trip.from_city} &rarr; {trip.to_city}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Driver: <span className="font-medium text-slate-700">{trip.driver_name}</span> &bull; Transporter: {trip.transporter_name}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 gap-2">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            Fare: <span className="font-semibold text-slate-800 font-mono">{formatINR(trip.trip_fare)}</span>
                          </div>
                          <div className="text-sm font-bold text-emerald-700 font-mono">
                            Profit: {formatINR(trip.net_profit)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingTrip(trip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>

                          <button
                            id={`home-edit-trip-${trip.id}`}
                            type="button"
                            onClick={() => setEditingTrip(trip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Advance Received & Balance Amount Information */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                        <span className="text-slate-500">Advance Received:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatINR(trip.advance_received ?? 0)}
                        </span>
                        {trip.advance_received_date && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({formatIndianDate(trip.advance_received_date)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                        <span className="text-slate-500">Balance Amount:</span>
                        <span
                          className={`font-mono font-black px-2 py-0.5 rounded-md ${
                            balanceAmt > 0
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          {formatINR(balanceAmt)}
                        </span>
                        {trip.balance_received_date && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({formatIndianDate(trip.balance_received_date)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedKpi && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedKpi(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedKpi === "trips" ? "Total Trips" : selectedKpi === "revenue" ? "Total Revenue" : "Net Business Profit"} — Vehicle-wise Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentMonthLabel} only</p>
              </div>
              <button type="button" onClick={() => setSelectedKpi(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">×</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-90px)]">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-slate-600">Vehicle Number</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600">Total Trips</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600">Total Revenue</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600">Net Business Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVehicles.map((vehicle) => {
                      const vehicleTrips = currentMonthTrips.filter((trip) => trip.vehicle_id === vehicle.id);
                      const vehicleMaintenance = currentMonthMaintenance
                        .filter((record) => record.vehicle_id === vehicle.id)
                        .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
                      const vehicleRevenue = vehicleTrips.reduce((sum, trip) => sum + (Number(trip.trip_fare) || 0), 0);
                      const vehicleTripProfit = vehicleTrips.reduce((sum, trip) => sum + (Number(trip.net_profit) || 0), 0);
                      const vehicleHalting = vehicleTrips.reduce(
                        (sum, trip) => sum + (Number(trip.loading_halting_fare) || 0) + (Number(trip.unloading_halting_fare) || 0),
                        0
                      );
                      const vehicleProfit = vehicleTripProfit - vehicleMaintenance + vehicleHalting;
                      return (
                        <tr key={vehicle.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{vehicle.vehicle_number}</td>
                          <td className="px-4 py-3 text-right font-semibold">{vehicleTrips.length}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold">{formatINR(vehicleRevenue)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">{formatINR(vehicleProfit)}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right">{currentMonthTrips.length}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatINR(totalRevenue)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">{formatINR(finalProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-3">Showing all active vehicles for {currentMonthLabel}. The selected KPI is highlighted by the corresponding column.</p>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      <TripDetailsModal
        trip={inspectingTrip}
        isOpen={!!inspectingTrip}
        onClose={() => setInspectingTrip(null)}
        onEdit={() => {
          if (inspectingTrip) {
            setEditingTrip(inspectingTrip);
            setInspectingTrip(null);
          }
        }}
      />

      {/* Edit Saved Trip Modal */}
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
        vehicles={vehicles}
        drivers={drivers}
      />
    </div>
  );
};
