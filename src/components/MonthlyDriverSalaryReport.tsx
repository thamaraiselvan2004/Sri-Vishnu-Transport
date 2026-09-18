import React, { useMemo, useState } from "react";
import { CalendarDays, User, IndianRupee, Wallet, Eye } from "lucide-react";
import { Trip } from "../types";
import { formatINR, formatIndianDate } from "../lib/calculations";

interface MonthlyDriverSalaryReportProps {
  driver: { id: string; driver_name: string };
  trips: Trip[];
}

interface MonthlySalaryRow {
  key: string;
  month: string;
  trips: number;
  beta: number;
  paid: number;
  remaining: number;
}

const monthKey = (date: string) => date?.slice(0, 7) || "";

const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

export const MonthlyDriverSalaryReport: React.FC<MonthlyDriverSalaryReportProps> = ({
  driver,
  trips,
}) => {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  const rows = useMemo<MonthlySalaryRow[]>(() => {
    const driverTrips = trips.filter(
      (trip) =>
        trip.driver_id === driver.id ||
        (trip.driver_name || "").trim().toLowerCase() ===
          driver.driver_name.trim().toLowerCase()
    );

    const months = new Set<string>();
    driverTrips.forEach((trip) => {
      const key = monthKey(trip.trip_date);
      if (key) months.add(key);
    });

    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const monthTrips = driverTrips.filter(
          (trip) => monthKey(trip.trip_date) === key
        );

        const beta = monthTrips.reduce(
          (sum, trip) => sum + (Number(trip.driver_beta) || 0),
          0
        );

        const paid = monthTrips.reduce(
          (sum, trip) => sum + (Number(trip.amount_paid_to_driver) || 0),
          0
        );

        const remaining = monthTrips.reduce((sum, trip) => {
          const tripRemaining =
            trip.remaining_amount_to_driver !== undefined &&
            trip.remaining_amount_to_driver !== null
              ? Number(trip.remaining_amount_to_driver)
              : (Number(trip.driver_beta) || 0) -
                (Number(trip.amount_paid_to_driver) || 0);
          return sum + (Number(tripRemaining) || 0);
        }, 0);

        return {
          key,
          month: monthLabel(key),
          trips: monthTrips.length,
          beta,
          paid,
          remaining,
        };
      });
  }, [driver.id, driver.driver_name, trips]);

  const visibleRows = showAllMonths ? rows : rows.slice(0, 1);
  const selectedMonth = selectedMonthKey
    ? rows.find((row) => row.key === selectedMonthKey) || null
    : null;

  const selectedMonthTrips = useMemo(() => {
    if (!selectedMonthKey) return [];
    return trips
      .filter(
        (trip) =>
          monthKey(trip.trip_date) === selectedMonthKey &&
          (trip.driver_id === driver.id ||
            (trip.driver_name || "").trim().toLowerCase() ===
              driver.driver_name.trim().toLowerCase())
      )
      .sort((a, b) => String(b.trip_date || "").localeCompare(String(a.trip_date || "")));
  }, [selectedMonthKey, driver.id, driver.driver_name, trips]);

  return (
    <section
      id="monthly-driver-salary-report"
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <CalendarDays className="w-4 h-4" />
              <span>Monthly Driver Salary</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {driver.driver_name} — Monthly Salary History
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Each month's driver salary and settlement records are kept separately.
            </p>
          </div>

          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllMonths((expanded) => !expanded)}
              className="shrink-0 px-3 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-bold transition-colors"
            >
              {showAllMonths ? "View Less" : "View All"}
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No monthly salary records are available for this driver yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Month
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trips
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Driver Beta
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Amount Paid
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr
                  key={row.key}
                  onClick={() => setSelectedMonthKey(row.key)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  title={"Click to view " + row.month + " salary records"}
                >
                  <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {row.month}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-slate-700">
                    {row.trips}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">
                    {formatINR(row.beta)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-indigo-700">
                    {formatINR(row.paid)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-black text-rose-700">
                    {formatINR(row.remaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMonth && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedMonthKey(null)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="monthly-driver-salary-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-blue-50 via-white to-emerald-50">
              <div>
                <h3
                  id="monthly-driver-salary-title"
                  className="text-xl font-black text-slate-900"
                >
                  {selectedMonth.month} — Driver Salary
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-1">
                  {driver.driver_name} • Month-specific salary settlement
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonthKey(null)}
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 text-lg"
                aria-label="Close monthly driver salary"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Trips
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {selectedMonth.trips}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Driver Beta
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                    {formatINR(selectedMonth.beta)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Amount Paid
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
                    {formatINR(selectedMonth.paid)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border-2 border-rose-400/80 bg-rose-50/20 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                    Remaining
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-700 mt-1">
                    {formatINR(selectedMonth.remaining)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Trip Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Route</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Driver Beta</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Amount Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Payment Date</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMonthTrips.map((trip) => {
                      const beta = Number(trip.driver_beta) || 0;
                      const paid = Number(trip.amount_paid_to_driver) || 0;
                      const remaining =
                        trip.remaining_amount_to_driver !== undefined &&
                        trip.remaining_amount_to_driver !== null
                          ? Number(trip.remaining_amount_to_driver)
                          : beta - paid;

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                            {formatIndianDate(trip.trip_date)}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            {trip.vehicle_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {trip.from_city} → {trip.to_city}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {formatINR(beta)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                            {formatINR(paid)}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                            {trip.driver_payment_date
                              ? formatIndianDate(trip.driver_payment_date)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            {formatINR(remaining)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedMonthKey(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
