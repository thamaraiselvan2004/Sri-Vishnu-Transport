import React, { useMemo, useState } from "react";
import { CalendarDays, TrendingUp, Truck, IndianRupee, Gauge, Fuel, Clock } from "lucide-react";
import { MaintenanceRecord, Trip, Vehicle } from "../types";
import { calculateVehicleStats, formatINR } from "../lib/calculations";

interface VehicleMonthlyProfitReportProps { vehicle: Vehicle; trips: Trip[]; maintenance: MaintenanceRecord[]; }
interface MonthlyRow { key: string; month: string; trips: number; revenue: number; expenses: number; haltingCharges: number; profit: number; }

const monthLabel = (key: string) => { const [year, month] = key.split("-").map(Number); return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); };
const monthKey = (date: string) => date?.slice(0, 7) || "";

export const VehicleMonthlyProfitReport: React.FC<VehicleMonthlyProfitReportProps> = ({ vehicle, trips, maintenance }) => {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const rows = useMemo<MonthlyRow[]>(() => {
    const vehicleTrips = trips.filter((t) => t.vehicle_id === vehicle.id);
    const vehicleMaintenance = maintenance.filter((m) => m.vehicle_id === vehicle.id);
    const months = new Set<string>();
    vehicleTrips.forEach((t) => { const key = monthKey(t.trip_date); if (key) months.add(key); });
    vehicleMaintenance.forEach((m) => { const key = monthKey(m.maintenance_date); if (key) months.add(key); });
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map((key) => {
      const monthTrips = vehicleTrips.filter((t) => monthKey(t.trip_date) === key);
      const monthMaintenance = vehicleMaintenance.filter((m) => monthKey(m.maintenance_date) === key);
      const stats = calculateVehicleStats(vehicle.id, vehicle.vehicle_number, monthTrips, monthMaintenance);
      const haltingCharges = monthTrips.reduce((sum, trip) => {
        const separate = trip.loading_halting_fare !== undefined || trip.unloading_halting_fare !== undefined;
        return sum + (separate ? (Number(trip.loading_halting_fare) || 0) + (Number(trip.unloading_halting_fare) || 0) : Number(trip.halting_fare) || 0);
      }, 0);
      const maintenanceExpenses = monthMaintenance.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
      const revenue = monthTrips.reduce((sum, trip) => sum + (Number(trip.trip_fare) || 0), 0);
      const expenses = Math.max(0, revenue + haltingCharges - (stats.finalVehicleProfit + haltingCharges));
      return { key, month: monthLabel(key), trips: monthTrips.length, revenue, expenses: expenses + maintenanceExpenses, haltingCharges, profit: stats.finalVehicleProfit + haltingCharges };
    });
  }, [vehicle.id, vehicle.vehicle_number, trips, maintenance]);

  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const visibleRows = showAllMonths ? rows : rows.slice(0, 1);

  const selectedMonth = selectedMonthKey ? rows.find((row) => row.key === selectedMonthKey) || null : null;

  const selectedMonthSnapshot = useMemo(() => {
    if (!selectedMonthKey) return null;
    const monthTrips = trips.filter((trip) => trip.vehicle_id === vehicle.id && trip.trip_date?.slice(0, 7) === selectedMonthKey);
    const monthMaintenance = maintenance.filter((record) => record.vehicle_id === vehicle.id && record.maintenance_date?.slice(0, 7) === selectedMonthKey);
    const stats = calculateVehicleStats(vehicle.id, vehicle.vehicle_number, monthTrips, monthMaintenance);
    const totalHaltingDays = monthTrips.reduce((total, trip) => {
      const separate = trip.loading_halting_days !== undefined || trip.unloading_halting_days !== undefined;
      return total + (separate ? (Number(trip.loading_halting_days) || 0) + (Number(trip.unloading_halting_days) || 0) : (Number(trip.halting_days) || 0));
    }, 0);
    const totalHaltingCharges = monthTrips.reduce((total, trip) => {
      const separate = trip.loading_halting_fare !== undefined || trip.unloading_halting_fare !== undefined;
      return total + (separate ? (Number(trip.loading_halting_fare) || 0) + (Number(trip.unloading_halting_fare) || 0) : (Number(trip.halting_fare) || 0));
    }, 0);
    const totalReceivedBalance = monthTrips.reduce((total, trip) => total + (Number(trip.balance_amount) || 0), 0);
    return { stats, totalHaltingDays, totalHaltingCharges, totalReceivedBalance, overallProfit: stats.finalVehicleProfit + totalHaltingCharges };
  }, [selectedMonthKey, vehicle.id, vehicle.vehicle_number, trips, maintenance]);

  return (
    <section id="vehicle-monthly-profit-report" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider"><CalendarDays className="w-4 h-4" /><span>Monthly Profit History</span></div><h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{vehicle.vehicle_number} — Monthly Business Profit</h2><p className="text-sm text-slate-600 mt-1">Month-wise profit calculated only from trips and maintenance belonging to this vehicle.</p></div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-emerald-100 border border-emerald-200 px-4 py-3"><div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Total Historical Profit</div><div className="text-lg font-black font-mono text-emerald-800 mt-0.5">{formatINR(totalProfit)}</div></div>
            {rows.length > 1 && <button type="button" onClick={() => setShowAllMonths((expanded) => !expanded)} className="shrink-0 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold transition-colors">{showAllMonths ? "View Less" : "View All"}</button>}
          </div>
        </div>
      </div>
      {rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No monthly business records are available for this vehicle yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Month</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Trips</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Revenue</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Expenses</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Halting Charges</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Net Profit</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.map((row) => <tr key={row.key} onClick={() => setSelectedMonthKey(row.key)} className="hover:bg-slate-50/80 transition-colors cursor-pointer" title={"Click to view " + row.month + " vehicle snapshot"}><td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600" />{row.month}</td><td className="px-5 py-4 text-right font-mono font-bold text-slate-700">{row.trips}</td><td className="px-5 py-4 text-right font-mono font-bold text-blue-700">{formatINR(row.revenue)}</td><td className="px-5 py-4 text-right font-mono font-bold text-red-600">{formatINR(row.expenses)}</td><td className="px-5 py-4 text-right font-mono font-bold text-indigo-700">{formatINR(row.haltingCharges)}</td><td className={`px-5 py-4 text-right font-mono font-black ${row.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}><span className="inline-flex items-center gap-1"><TrendingUp className="w-4 h-4" />{formatINR(row.profit)}</span></td></tr>)}</tbody></table></div>}
      {selectedMonth && selectedMonthSnapshot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedMonthKey(null)}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="monthly-snapshot-title">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-emerald-50 via-white to-blue-50">
              <div>
                <h3 id="monthly-snapshot-title" className="text-xl font-black text-slate-900">{selectedMonth.month} — Vehicle Snapshot</h3>
                <p className="text-xs font-semibold text-blue-600 mt-1">{vehicle.vehicle_number} • Complete monthly performance</p>
              </div>
              <button type="button" onClick={() => setSelectedMonthKey(null)} className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 text-lg" aria-label="Close monthly vehicle snapshot">✕</button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">No.of.Trips</div><div className="text-2xl font-black text-slate-900 mt-1">{selectedMonthSnapshot.stats.totalTrips}</div><div className="text-xs text-slate-500 mt-1">{selectedMonth.month}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Freight Fare</div><div className="text-2xl font-black font-mono text-blue-700 mt-1">{formatINR(selectedMonthSnapshot.stats.totalTripRevenue)}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Expenses</div><div className="text-2xl font-black font-mono text-red-600 mt-1">{formatINR(selectedMonthSnapshot.stats.totalAllExpenses)}</div></div>
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/20"><div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Final Net Profit</div><div className="text-2xl font-black font-mono text-emerald-700 mt-1">{formatINR(selectedMonthSnapshot.stats.finalVehicleProfit)}</div><div className="text-xs text-emerald-600 font-semibold mt-1">Margin: {selectedMonthSnapshot.stats.profitMargin}%</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-600" />Distance</div><div className="text-2xl font-black font-mono text-slate-900 mt-1">{selectedMonthSnapshot.stats.overallTripRunningKms} KM</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-indigo-600" />Total Toll Charges</div><div className="text-2xl font-black font-mono text-indigo-700 mt-1">{formatINR(selectedMonthSnapshot.stats.overallTollExpense)}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-orange-600" />Overall Total Diesel</div><div className="text-2xl font-black font-mono text-orange-700 mt-1">{selectedMonthSnapshot.stats.overallDieselLitres} Litres</div><div className="text-xs text-slate-500 mt-1">Fuel cost: {formatINR(selectedMonthSnapshot.stats.overallDieselExpense)}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Average Mileage</div><div className="text-2xl font-black font-mono text-amber-700 mt-1">{selectedMonthSnapshot.stats.overallMileage} km/L</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-emerald-600" />Total Received Balance</div><div className="text-2xl font-black font-mono text-emerald-700 mt-1">{formatINR(selectedMonthSnapshot.totalReceivedBalance)}</div><div className="text-xs text-slate-500 mt-1">Received during {selectedMonth.month}</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Maintenance</div><div className="text-2xl font-black font-mono text-amber-600 mt-1">{formatINR(selectedMonthSnapshot.stats.overallMaintenanceAmount)}</div><div className="text-xs text-slate-500 mt-1">{selectedMonthSnapshot.stats.maintenanceRecordCount} service records</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-violet-600" />Total Halting Days</div><div className="text-2xl font-black font-mono text-violet-700 mt-1">{selectedMonthSnapshot.totalHaltingDays} Days</div></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-rose-600" />Total Halting Charges</div><div className="text-2xl font-black font-mono text-rose-700 mt-1">{formatINR(selectedMonthSnapshot.totalHaltingCharges)}</div></div>
                <div className="bg-white p-4 rounded-2xl border-2 border-violet-500/80 bg-violet-50/20"><div className="text-xs font-bold text-violet-800 uppercase tracking-wide">Overall Profit</div><div className={"text-2xl font-black font-mono mt-1 " + (selectedMonthSnapshot.overallProfit >= 0 ? "text-violet-700" : "text-red-700")}>{formatINR(selectedMonthSnapshot.overallProfit)}</div><div className="text-xs text-violet-700 font-semibold mt-1">Final Net Profit + Total Halting Charges</div></div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4"><button type="button" onClick={() => setSelectedMonthKey(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800">Close</button></div>
          </div>
        </div>
      )}
    </section>
  );
};
