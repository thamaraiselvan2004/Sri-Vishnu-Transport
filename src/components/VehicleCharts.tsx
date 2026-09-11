import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Trip, MaintenanceRecord, VehicleReportStats } from "../types";
import { formatINR } from "../lib/calculations";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface VehicleChartsProps {
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  stats: VehicleReportStats;
}

export const VehicleCharts: React.FC<VehicleChartsProps> = ({
  trips,
  maintenance,
  stats,
}) => {
  if (trips.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        Not enough data available to generate charts for this date range.
      </div>
    );
  }

  // 1. Group trips and maintenance by Month
  const monthlyData: Record<
    string,
    {
      revenue: number;
      profit: number;
      distance: number;
      dieselLitres: number;
      trips: number;
    }
  > = {};

  // Sort trips chronologically for trend charts
  const chronologicalTrips = [...trips].sort((a, b) =>
    a.trip_date.localeCompare(b.trip_date)
  );

  for (const t of chronologicalTrips) {
    const monthKey = t.trip_date.slice(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        revenue: 0,
        profit: 0,
        distance: 0,
        dieselLitres: 0,
        trips: 0,
      };
    }
    monthlyData[monthKey].revenue += t.trip_fare || 0;
    monthlyData[monthKey].profit += t.net_profit || 0;
    monthlyData[monthKey].distance += t.trip_running_kms || 0;
    monthlyData[monthKey].dieselLitres += t.diesel_litres || 0;
    monthlyData[monthKey].trips += 1;
  }

  const monthLabels = Object.keys(monthlyData).map((key) => {
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  });

  // -------------------------------------------------------------
  // Chart 1: Revenue vs Expenses vs Profit
  // -------------------------------------------------------------
  const revExpProfitData: ChartData<"bar"> = {
    labels: ["Revenue", "Total Expenses", "Final Profit"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [
          stats.totalTripRevenue,
          stats.totalAllExpenses,
          stats.finalVehicleProfit,
        ],
        backgroundColor: ["#2563eb", "#ef4444", "#10b981"],
        borderRadius: 8,
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 2: Expense Breakdown (Doughnut)
  // -------------------------------------------------------------
  const expenseBreakdownData: ChartData<"doughnut"> = {
    labels: [
      "Diesel",
      "Driver Beta",
      "Toll",
      "Loading",
      "Unloading",
      "Other",
      "Maintenance",
    ],
    datasets: [
      {
        data: [
          stats.overallDieselExpense,
          stats.overallDriverBeta,
          stats.overallTollExpense,
          stats.totalLoadingExpense,
          stats.totalUnloadingExpense,
          stats.totalOtherExpenses,
          stats.overallMaintenanceAmount,
        ],
        backgroundColor: [
          "#f97316", // Diesel (orange)
          "#3b82f6", // Beta (blue)
          "#8b5cf6", // Toll (purple)
          "#06b6d4", // Loading (cyan)
          "#14b8a6", // Unloading (teal)
          "#64748b", // Other (slate)
          "#eab308", // Maintenance (yellow)
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 3: Monthly Revenue Trend (Line)
  // -------------------------------------------------------------
  const monthlyRevenueData: ChartData<"line"> = {
    labels: monthLabels,
    datasets: [
      {
        label: "Monthly Revenue (₹)",
        data: Object.values(monthlyData).map((d) => d.revenue),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 4: Monthly Profit Trend (Bar/Line)
  // -------------------------------------------------------------
  const monthlyProfitData: ChartData<"bar"> = {
    labels: monthLabels,
    datasets: [
      {
        label: "Monthly Profit (₹)",
        data: Object.values(monthlyData).map((d) => d.profit),
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 5: Monthly Distance (KM) & Diesel (Litres)
  // -------------------------------------------------------------
  const monthlyDistanceData: ChartData<"bar"> = {
    labels: monthLabels,
    datasets: [
      {
        label: "Running Distance (KM)",
        data: Object.values(monthlyData).map((d) => d.distance),
        backgroundColor: "#0284c7",
        borderRadius: 6,
      },
    ],
  };

  const monthlyDieselData: ChartData<"bar"> = {
    labels: monthLabels,
    datasets: [
      {
        label: "Diesel Consumption (Litres)",
        data: Object.values(monthlyData).map((d) => d.dieselLitres),
        backgroundColor: "#ea580c",
        borderRadius: 6,
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 6: Mileage Trend (KM/L per Trip)
  // -------------------------------------------------------------
  const mileageTrendData: ChartData<"line"> = {
    labels: chronologicalTrips.map((t, idx) => `T${idx + 1}`),
    datasets: [
      {
        label: "Trip Mileage (km/L)",
        data: chronologicalTrips.map((t) => t.mileage || 0),
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
        tension: 0.2,
        pointRadius: 4,
      },
    ],
  };

  // -------------------------------------------------------------
  // Chart 7: Trip-wise Profit
  // -------------------------------------------------------------
  const tripWiseProfitData: ChartData<"bar"> = {
    labels: chronologicalTrips.map((t, idx) => `Trip ${idx + 1}`),
    datasets: [
      {
        label: "Trip Net Profit (₹)",
        data: chronologicalTrips.map((t) => t.net_profit || 0),
        backgroundColor: chronologicalTrips.map((t) =>
          t.net_profit >= 0 ? "#10b981" : "#ef4444"
        ),
        borderRadius: 6,
      },
    ],
  };

  const currencyOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label || ""}: ${formatINR(Number(ctx.raw))}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatINR(Number(value)),
        },
      },
    },
  };

  const standardOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Expenses vs Profit */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Revenue vs. Expenses vs. Profit
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comparison of overall turnover, all operating expenses, and vehicle profit
          </p>
          <div className="h-64">
            <Bar data={revExpProfitData} options={currencyOptions} />
          </div>
        </div>

        {/* Chart 2: Expense Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Expense Breakdown (Share of Costs)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Distribution across diesel, driver beta, tolls, and maintenance
          </p>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={expenseBreakdownData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "right" },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${formatINR(Number(ctx.raw))}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Monthly Revenue Trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Monthly Revenue Trend
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Gross freight billing progression over months
          </p>
          <div className="h-64">
            <Line data={monthlyRevenueData} options={standardOptions} />
          </div>
        </div>

        {/* Chart 4: Monthly Profit Trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Monthly Profit Trend
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Monthly retained net profits
          </p>
          <div className="h-64">
            <Bar data={monthlyProfitData} options={currencyOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 5A: Monthly Distance */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Monthly Distance Covered (KM)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total running distance per month
          </p>
          <div className="h-64">
            <Bar data={monthlyDistanceData} options={standardOptions} />
          </div>
        </div>

        {/* Chart 5B: Monthly Diesel Consumption */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Monthly Diesel Consumption (Litres)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total litres of diesel filled per month
          </p>
          <div className="h-64">
            <Bar data={monthlyDieselData} options={standardOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 6: Mileage Trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Mileage Trend (KM per Litre per Trip)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Trip-by-trip fuel economy tracking
          </p>
          <div className="h-64">
            <Line
              data={mileageTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    ticks: {
                      callback: (v) => `${v} km/L`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 7: Trip-wise Profit */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Trip-wise Net Profit
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Profit generated per individual freight run
          </p>
          <div className="h-64">
            <Bar data={tripWiseProfitData} options={currencyOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
