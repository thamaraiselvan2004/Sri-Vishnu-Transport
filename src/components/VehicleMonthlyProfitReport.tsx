import React, { useMemo, useState } from "react";
import { CalendarDays, TrendingUp, Truck } from "lucide-react";
import { MaintenanceRecord, Trip, Vehicle } from "../types";
import { calculateVehicleStats, formatINR } from "../lib/calculations";

interface VehicleMonthlyProfitReportProps { vehicle: Vehicle; trips: Trip[]; maintenance: MaintenanceRecord[]; }
interface MonthlyRow { key: string; month: string; trips: number; revenue: number; expenses: number; haltingCharges: number; profit: number; }

const monthLabel = (key: string) => { const [year, month] = key.split("-").map(Number); return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); };
const monthKey = (date: string) => date?.slice(0, 7) || "";

export const VehicleMonthlyProfitReport: React.FC<VehicleMonthlyProfitReportProps> = ({ vehicle, trips, maintenance }) => {
  const [showAllMonths, setShowAllMonths] = useState(false);
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
      {rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No monthly business records are available for this vehicle yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Month</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Trips</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Revenue</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Expenses</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Halting Charges</th><th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Net Profit</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.map((row) => <tr key={row.key} className="hover:bg-slate-50/80 transition-colors"><td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600" />{row.month}</td><td className="px-5 py-4 text-right font-mono font-bold text-slate-700">{row.trips}</td><td className="px-5 py-4 text-right font-mono font-bold text-blue-700">{formatINR(row.revenue)}</td><td className="px-5 py-4 text-right font-mono font-bold text-red-600">{formatINR(row.expenses)}</td><td className="px-5 py-4 text-right font-mono font-bold text-indigo-700">{formatINR(row.haltingCharges)}</td><td className={`px-5 py-4 text-right font-mono font-black ${row.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}><span className="inline-flex items-center gap-1"><TrendingUp className="w-4 h-4" />{formatINR(row.profit)}</span></td></tr>)}</tbody></table></div>}
    </section>
  );
};
