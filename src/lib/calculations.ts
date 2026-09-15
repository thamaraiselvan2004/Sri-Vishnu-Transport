import {
  Trip,
  MaintenanceRecord,
  VehicleReportStats,
  FleetStats,
  DriverReportStats,
  BusinessInsight,
  Vehicle,
} from "../types";

/**
 * Format an amount in Indian Rupee format (e.g., ₹50,000 or ₹1,60,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));

  // Format using Indian numbering system
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(absAmount);

  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/**
 * Format a date string into Indian readable convention e.g., '11 Sep 2026'
 */
export function formatIndianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a datetime string (ISO or YYYY-MM-DDTHH:mm) into Indian readable format e.g. '14 Sep 2026, 06:30 AM'
 */
export function formatIndianDateTime(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return "-";
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTimeStr;
  }
}

/**
 * Calculate Driver Beta
 */
export function calculateDriverBeta(
  tripFare: number,
  betaType: "percentage" | "manual",
  manualBeta: number
): number {
  if (betaType === "percentage") {
    return Math.round((tripFare || 0) * 0.15);
  }
  return manualBeta || 0;
}

/**
 * Calculate Trip Running KMs
 * Formula: Ending Odometer - Starting Odometer
 */
export function calculateRunningKms(
  startingOdometer: number,
  endingOdometer: number
): number {
  if (endingOdometer >= startingOdometer) {
    return endingOdometer - startingOdometer;
  }
  return 0;
}

/**
 * Calculate Mileage (KM / Litre)
 * Prevents division by zero or NaN
 */
export function calculateMileage(
  runningKms: number,
  dieselLitres: number
): { mileage: number; formatted: string; isValid: boolean } {
  if (!dieselLitres || dieselLitres <= 0 || !runningKms || runningKms <= 0) {
    return {
      mileage: 0,
      formatted: "Enter diesel litres & KMs",
      isValid: false,
    };
  }
  const mileage = Number((runningKms / dieselLitres).toFixed(2));
  return {
    mileage,
    formatted: `${mileage} km/L`,
    isValid: true,
  };
}

/**
 * Calculate Halting Fare
 * Formula: Halting days * Halting charge/day
 */
export function calculateHaltingFare(
  haltingDays: number,
  haltingChargePerDay: number
): number {
  const days = Number(haltingDays) || 0;
  const charge = Number(haltingChargePerDay) || 0;
  return Math.max(0, days * charge);
}

/**
 * Calculate Balance Amount
 * Formula: trip fare - broker fare - advance received + halting fare
 */
export function calculateBalanceAmount(
  tripFare: number,
  brokerFare: number,
  advanceReceived: number,
  haltingFare: number
): number {
  const fare = Number(tripFare) || 0;
  const broker = Number(brokerFare) || 0;
  const adv = Number(advanceReceived) || 0;
  const halting = Number(haltingFare) || 0;
  return fare - broker - adv + halting;
}

/**
 * Calculate Net Profit for a single trip
 * Net Profit = (Trip Fare + Halting Fare) - (Broker Fare + Driver Beta + Loading Expense + Unloading Expense + Toll Charges + Diesel Expense + Other Expenses)
 */
export function calculateTripNetProfit(params: {
  tripFare: number;
  haltingFare?: number;
  brokerFare: number;
  driverBeta: number;
  loadingExpense: number;
  unloadingExpense: number;
  tollCharges: number;
  dieselExpense: number;
  otherExpenses: number;
}): number {
  const fare = Number(params.tripFare) || 0;
  const halting = Number(params.haltingFare) || 0;
  const broker = Number(params.brokerFare) || 0;
  const beta = Number(params.driverBeta) || 0;
  const loading = Number(params.loadingExpense) || 0;
  const unloading = Number(params.unloadingExpense) || 0;
  const toll = Number(params.tollCharges) || 0;
  const diesel = Number(params.dieselExpense) || 0;
  const other = Number(params.otherExpenses) || 0;

  return (fare + halting) - (broker + beta + loading + unloading + toll + diesel + other);
}

/**
 * Calculate detailed date-range statistics for a specific vehicle
 */
export function calculateVehicleStats(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any
): VehicleReportStats {
  let trips: Trip[] = [];
  let maintenanceRecords: MaintenanceRecord[] = [];
  let dateRange: { from?: string; to?: string } | undefined = undefined;

  if (Array.isArray(arg1)) {
    trips = arg1;
    maintenanceRecords = Array.isArray(arg2) ? arg2 : [];
    dateRange = arg3;
  } else {
    // Called with (vehicleId, vehicleNumber, trips, maintenance, dateRange)
    trips = Array.isArray(arg3) ? arg3 : [];
    maintenanceRecords = Array.isArray(arg4) ? arg4 : [];
  }
  // Filter trips by date range
  const filteredTrips = trips.filter((t) => {
    if (!dateRange?.from && !dateRange?.to) return true;
    if (dateRange?.from && t.trip_date < dateRange.from) return false;
    if (dateRange?.to && t.trip_date > dateRange.to) return false;
    return true;
  });

  // Filter maintenance records by date range
  const filteredMaintenance = maintenanceRecords.filter((m) => {
    if (!dateRange?.from && !dateRange?.to) return true;
    if (dateRange?.from && m.maintenance_date < dateRange.from) return false;
    if (dateRange?.to && m.maintenance_date > dateRange.to) return false;
    return true;
  });

  const totalTrips = filteredTrips.length;

  let totalTripRevenue = 0;
  let totalBrokerFare = 0;
  let overallDriverBeta = 0;
  let totalLoadingExpense = 0;
  let totalUnloadingExpense = 0;
  let overallTollExpense = 0;
  let overallDieselExpense = 0;
  let overallDieselLitres = 0;
  let totalOtherExpenses = 0;
  let overallRunningKms = 0;
  let totalTripNetProfit = 0;
  let totalHaltingDays = 0;
  let totalHaltingAmount = 0;
  let haltingTripCount = 0;

  for (const t of filteredTrips) {
    totalTripRevenue += Number(t.trip_fare) || 0;
    totalBrokerFare += Number(t.broker_fare) || 0;
    overallDriverBeta += Number(t.driver_beta) || 0;
    totalLoadingExpense += Number(t.loading_expense) || 0;
    totalUnloadingExpense += Number(t.unloading_expense) || 0;
    overallTollExpense += Number(t.toll_charges) || 0;
    overallDieselExpense += Number(t.diesel_expense) || 0;
    overallDieselLitres += Number(t.diesel_litres) || 0;
    totalOtherExpenses += Number(t.other_expenses) || 0;
    const splitDays = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
    const haltingDays = splitDays > 0 ? splitDays : (Number(t.halting_days) || 0);
    const splitAmount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0);
    const haltingAmount = splitAmount > 0 ? splitAmount : (Number(t.halting_fare) || 0);
    totalHaltingDays += haltingDays;
    totalHaltingAmount += haltingAmount;
    if (haltingDays > 0 || haltingAmount > 0) haltingTripCount += 1;
    overallRunningKms += Number(t.trip_running_kms) || 0;
    totalTripNetProfit += Number(t.net_profit) || 0;
  }

  const overallMaintenanceAmount = filteredMaintenance.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );

  const totalTripExpenses =
    totalBrokerFare +
    overallDriverBeta +
    totalLoadingExpense +
    totalUnloadingExpense +
    overallTollExpense +
    overallDieselExpense +
    totalOtherExpenses;

  const totalAllExpenses = totalTripExpenses + overallMaintenanceAmount;

  // Final Vehicle Profit = Total Trip Net Profit - Total Maintenance Expense
  const finalVehicleProfit = totalTripNetProfit - overallMaintenanceAmount;

  // Profit Margin = Final Vehicle Profit / Total Trip Revenue * 100
  const profitMargin =
    totalTripRevenue > 0
      ? Number(((finalVehicleProfit / totalTripRevenue) * 100).toFixed(1))
      : 0;

  // Overall Mileage
  const overallMileage =
    overallDieselLitres > 0
      ? Number((overallRunningKms / overallDieselLitres).toFixed(2))
      : 0;

  // Profit Improvement Metrics
  const revenuePerKm =
    overallRunningKms > 0
      ? Number((totalTripRevenue / overallRunningKms).toFixed(2))
      : 0;

  const profitPerKm =
    overallRunningKms > 0
      ? Number((finalVehicleProfit / overallRunningKms).toFixed(2))
      : 0;

  const averageProfitPerTrip =
    totalTrips > 0
      ? Math.round(finalVehicleProfit / totalTrips)
      : 0;

  const fuelCostPerKm =
    overallRunningKms > 0
      ? Number((overallDieselExpense / overallRunningKms).toFixed(2))
      : 0;

  const tollCostPerKm =
    overallRunningKms > 0
      ? Number((overallTollExpense / overallRunningKms).toFixed(2))
      : 0;

  return {
    totalTrips,
    overallRunningKms,
    overallTripRunningKms: overallRunningKms,
    overallDieselExpense,
    overallDieselLitres,
    overallDriverBeta,
    overallMaintenanceAmount,
    overallTollExpense,
    overallMileage,
    totalTripRevenue,
    totalBrokerFare,
    totalLoadingExpense,
    totalUnloadingExpense,
    totalOtherExpenses,
    totalTripExpenses,
    totalAllExpenses,
    totalTripNetProfit,
    finalVehicleProfit,
    profitMargin,
    maintenanceRecordCount: filteredMaintenance.length,
    revenuePerKm,
    profitPerKm,
    averageProfitPerTrip,
    fuelCostPerKm,
    tollCostPerKm,
    totalHaltingDays,
    totalHaltingAmount,
    haltingTripCount,
  };
}

/**
 * Calculate Fleet-wide stats across all vehicles
 */
export function calculateFleetStats(
  arg1: any,
  arg2: any,
  arg3: any,
  dateRange?: { from?: string; to?: string }
): FleetStats {
  let allTrips: Trip[] = [];
  let allMaintenance: MaintenanceRecord[] = [];
  let vehicles: Vehicle[] = [];

  // Check if first arg is vehicles
  if (Array.isArray(arg1) && arg1.length > 0 && "vehicle_number" in arg1[0] && !("trip_date" in arg1[0])) {
    vehicles = arg1;
    allTrips = Array.isArray(arg2) ? arg2 : [];
    allMaintenance = Array.isArray(arg3) ? arg3 : [];
  } else {
    allTrips = Array.isArray(arg1) ? arg1 : [];
    allMaintenance = Array.isArray(arg2) ? arg2 : [];
    vehicles = Array.isArray(arg3) ? arg3 : [];
  }

  const filteredTrips = allTrips.filter((t) => {
    if (!dateRange?.from && !dateRange?.to) return true;
    if (dateRange?.from && t.trip_date < dateRange.from) return false;
    if (dateRange?.to && t.trip_date > dateRange.to) return false;
    return true;
  });

  const filteredMaintenance = allMaintenance.filter((m) => {
    if (!dateRange?.from && !dateRange?.to) return true;
    if (dateRange?.from && m.maintenance_date < dateRange.from) return false;
    if (dateRange?.to && m.maintenance_date > dateRange.to) return false;
    return true;
  });

  let totalRevenue = 0;
  let totalKm = 0;
  let totalDiesel = 0;
  let totalDieselExpense = 0;
  let totalBeta = 0;
  let totalToll = 0;
  let totalBroker = 0;
  let totalLoading = 0;
  let totalUnloading = 0;
  let totalOther = 0;
  let totalTripProfit = 0;

  // Track per-vehicle stats
  const vehicleStatsMap: Record<
    string,
    { vehicleNumber: string; profit: number; trips: number }
  > = {};

  for (const v of vehicles) {
    vehicleStatsMap[v.id] = {
      vehicleNumber: v.vehicle_number,
      profit: 0,
      trips: 0,
    };
  }

  // Track routes
  const routeStatsMap: Record<
    string,
    { tripCount: number; totalProfit: number }
  > = {};

  for (const t of filteredTrips) {
    totalRevenue += Number(t.trip_fare) || 0;
    totalKm += Number(t.trip_running_kms) || 0;
    totalDiesel += Number(t.diesel_litres) || 0;
    totalDieselExpense += Number(t.diesel_expense) || 0;
    totalBeta += Number(t.driver_beta) || 0;
    totalToll += Number(t.toll_charges) || 0;
    totalBroker += Number(t.broker_fare) || 0;
    totalLoading += Number(t.loading_expense) || 0;
    totalUnloading += Number(t.unloading_expense) || 0;
    totalOther += Number(t.other_expenses) || 0;
    totalTripProfit += Number(t.net_profit) || 0;

    const vId = t.vehicle_id;
    if (!vehicleStatsMap[vId]) {
      vehicleStatsMap[vId] = {
        vehicleNumber: t.vehicle_number || "Unknown",
        profit: 0,
        trips: 0,
      };
    }
    vehicleStatsMap[vId].profit += Number(t.net_profit) || 0;
    vehicleStatsMap[vId].trips += 1;

    // Route tracking
    const routeKey = `${t.from_city} → ${t.to_city}`;
    if (!routeStatsMap[routeKey]) {
      routeStatsMap[routeKey] = { tripCount: 0, totalProfit: 0 };
    }
    routeStatsMap[routeKey].tripCount += 1;
    routeStatsMap[routeKey].totalProfit += Number(t.net_profit) || 0;
  }

  const totalMaintenance = filteredMaintenance.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );

  // Subtract maintenance from vehicle profits
  for (const m of filteredMaintenance) {
    if (vehicleStatsMap[m.vehicle_id]) {
      vehicleStatsMap[m.vehicle_id].profit -= Number(m.amount) || 0;
    }
  }

  const totalTripExpenses =
    totalBroker +
    totalBeta +
    totalLoading +
    totalUnloading +
    totalToll +
    totalDieselExpense +
    totalOther;

  const totalExpenses = totalTripExpenses + totalMaintenance;
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0
      ? Number(((totalProfit / totalRevenue) * 100).toFixed(1))
      : 0;

  const averageMileage =
    totalDiesel > 0 ? Number((totalKm / totalDiesel).toFixed(2)) : 0;

  // Find best and lowest performing vehicle
  const vehicleList = Object.values(vehicleStatsMap).filter(
    (v) => v.trips > 0
  );

  let bestVehicle = null;
  let lowestVehicle = null;
  if (vehicleList.length > 0) {
    vehicleList.sort((a, b) => b.profit - a.profit);
    bestVehicle = {
      vehicleNumber: vehicleList[0].vehicleNumber,
      profit: vehicleList[0].profit,
    };
    lowestVehicle = {
      vehicleNumber: vehicleList[vehicleList.length - 1].vehicleNumber,
      profit: vehicleList[vehicleList.length - 1].profit,
    };
  }

  // Best performing route
  let bestRoute = null;
  const routes = Object.entries(routeStatsMap);
  if (routes.length > 0) {
    routes.sort(
      (a, b) =>
        b[1].totalProfit / b[1].tripCount - a[1].totalProfit / a[1].tripCount
    );
    const [route, rData] = routes[0];
    bestRoute = {
      route,
      tripCount: rData.tripCount,
      avgProfit: Math.round(rData.totalProfit / rData.tripCount),
    };
  }

  // Highest expense category
  const expenseCategories = [
    { category: "Diesel", amount: totalDieselExpense },
    { category: "Driver Beta", amount: totalBeta },
    { category: "Toll Charges", amount: totalToll },
    { category: "Vehicle Maintenance", amount: totalMaintenance },
    { category: "Broker Fare", amount: totalBroker },
    { category: "Loading & Unloading", amount: totalLoading + totalUnloading },
    { category: "Other Expenses", amount: totalOther },
  ];
  expenseCategories.sort((a, b) => b.amount - a.amount);
  const highestExpenseCategory =
    expenseCategories[0]?.amount > 0 ? expenseCategories[0] : null;

  return {
    totalRevenue,
    totalExpenses,
    totalProfit,
    profitMargin,
    totalTrips: filteredTrips.length,
    totalKm,
    totalDistance: totalKm,
    totalDiesel,
    totalDieselExpense,
    totalToll,
    totalTollExpense: totalToll,
    averageMileage,
    totalMaintenance,
    bestVehicle,
    bestPerformingVehicle: bestVehicle,
    lowestVehicle,
    lowestPerformingVehicle: lowestVehicle,
    bestRoute: bestRoute
      ? {
          ...bestRoute,
          profit: bestRoute.avgProfit * bestRoute.tripCount,
          trips: bestRoute.tripCount,
        }
      : null,
    highestExpenseCategory,
  };
}

/**
 * Calculate Driver-based report statistics
 * Aggregates only when trip driver matches the selected driver
 */
export function calculateDriverStats(
  driverId: string,
  driverName: string,
  trips: Trip[],
  dateRange?: { from?: string; to?: string }
): DriverReportStats {
  const normSelectedName = driverName ? driverName.toLowerCase().trim() : "";

  const filteredTrips = trips.filter((t) => {
    const tripDriverName = (t.driver_name || "").toLowerCase().trim();
    const isSelected =
      (driverId && t.driver_id === driverId) ||
      (normSelectedName && tripDriverName === normSelectedName);

    if (!isSelected) return false;

    if (!dateRange?.from && !dateRange?.to) return true;
    if (dateRange?.from && t.trip_date < dateRange.from) return false;
    if (dateRange?.to && t.trip_date > dateRange.to) return false;
    return true;
  });

  let overallRunningKms = 0;
  let overallDriverBeta = 0;
  let overallHaltingDays = 0;
  let overallTotalDieselLitres = 0;
  let overallAmountPaidToDriver = 0;
  let overallRemainingAmountToDriver = 0;
  let overallDieselExpense = 0;
  let overallTripRevenue = 0;
  let overallOtherExpenses = 0;

  for (const t of filteredTrips) {
    const kms = Number(t.trip_running_kms) || 0;
    const beta = Number(t.driver_beta) || 0;
    const haltingAmount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0) || (Number(t.halting_fare) || 0);
    const splitHalting = (Number(t.loading_halting_days) || 0) + (Number(t.unloading_halting_days) || 0);
    const halting = splitHalting > 0 ? splitHalting : (Number(t.halting_days) || 0);
    const dieselL = Number(t.diesel_litres) || 0;
    const paid = Number(t.amount_paid_to_driver) || 0;

    // Remaining = driver beta - amount paid to driver
    const remaining =
      t.remaining_amount_to_driver !== undefined && t.remaining_amount_to_driver !== null
        ? Number(t.remaining_amount_to_driver)
        : beta - paid;

    overallRunningKms += kms;
    overallDriverBeta += beta + haltingAmount;
    overallHaltingDays += halting;
    overallTotalDieselLitres += dieselL;
    overallAmountPaidToDriver += paid;
    overallRemainingAmountToDriver += remaining;
    overallDieselExpense += Number(t.diesel_expense) || 0;
    overallTripRevenue += Number(t.trip_fare) || 0;
    overallOtherExpenses += Number(t.other_expenses) || 0;
    overallOtherExpenses += Number(t.other_expenses) || 0;
  }

  // overall mileage = (overall kms / overall Total Diesel in Litres)
  const overallMileage =
    overallTotalDieselLitres > 0
      ? Number((overallRunningKms / overallTotalDieselLitres).toFixed(2))
      : 0;

  return {
    driverId,
    driverName,
    totalTrips: filteredTrips.length,
    overallRunningKms,
    overallDriverBeta,
    overallHaltingDays,
    overallTotalDieselLitres: Number(overallTotalDieselLitres.toFixed(1)),
    overallMileage,
    overallAmountPaidToDriver,
    overallRemainingAmountToDriver,
    overallDieselExpense,
    overallTripRevenue,
    overallOtherExpenses,
  };
}

/**
 * Generate real rule-based business insights strictly from actual data calculations
 */
export function generateBusinessInsights(
  trips: Trip[],
  maintenance: MaintenanceRecord[],
  vehicles: Vehicle[],
  selectedVehicleId?: string
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  const vehicleTrips = selectedVehicleId
    ? trips.filter((t) => t.vehicle_id === selectedVehicleId)
    : trips;

  const vehicleMaint = selectedVehicleId
    ? maintenance.filter((m) => m.vehicle_id === selectedVehicleId)
    : maintenance;

  if (vehicleTrips.length < 2) {
    insights.push({
      id: "ins-not-enough",
      type: "info",
      category: "performance",
      title: "Data Availability",
      message:
        "Not enough data available for this comparison. Add more trips to unlock monthly & route trend insights.",
    });
    return insights;
  }

  // 1. Month-over-Month comparison
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(
    prevMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const currentMonthTrips = vehicleTrips.filter((t) =>
    t.trip_date.startsWith(currentMonthStr)
  );
  const prevMonthTrips = vehicleTrips.filter((t) =>
    t.trip_date.startsWith(prevMonthStr)
  );

  // If current and previous months don't have enough data, look at recent half vs older half
  const sortedTrips = [...vehicleTrips].sort((a, b) =>
    a.trip_date.localeCompare(b.trip_date)
  );
  const mid = Math.floor(sortedTrips.length / 2);
  const olderTrips = sortedTrips.slice(0, mid);
  const recentTrips = sortedTrips.slice(mid);

  // Diesel expense comparison
  const recentDieselExpense = recentTrips.reduce(
    (sum, t) => sum + (t.diesel_expense || 0),
    0
  );
  const olderDieselExpense = olderTrips.reduce(
    (sum, t) => sum + (t.diesel_expense || 0),
    0
  );
  const recentKm = recentTrips.reduce(
    (sum, t) => sum + (t.trip_running_kms || 0),
    0
  );
  const olderKm = olderTrips.reduce(
    (sum, t) => sum + (t.trip_running_kms || 0),
    0
  );

  const recentFuelPerKm =
    recentKm > 0 ? recentDieselExpense / recentKm : 0;
  const olderFuelPerKm =
    olderKm > 0 ? olderDieselExpense / olderKm : 0;

  if (recentFuelPerKm > olderFuelPerKm * 1.05 && olderFuelPerKm > 0) {
    insights.push({
      id: "ins-diesel-warn",
      type: "warning",
      category: "diesel",
      title: "Fuel Expense Alert",
      message: `Diesel cost per KM increased to ₹${recentFuelPerKm.toFixed(
        2
      )}/km compared to ₹${olderFuelPerKm.toFixed(
        2
      )}/km in earlier trips. Check tyre pressure or driving habits.`,
    });
  } else if (recentFuelPerKm < olderFuelPerKm * 0.95 && recentFuelPerKm > 0) {
    insights.push({
      id: "ins-diesel-good",
      type: "success",
      category: "diesel",
      title: "Fuel Efficiency Improved",
      message: `Diesel cost per KM dropped to ₹${recentFuelPerKm.toFixed(
        2
      )}/km, saving fuel expenditure across recent routes.`,
    });
  }

  // Mileage comparison
  const recentLitres = recentTrips.reduce(
    (sum, t) => sum + (t.diesel_litres || 0),
    0
  );
  const olderLitres = olderTrips.reduce(
    (sum, t) => sum + (t.diesel_litres || 0),
    0
  );
  const recentMileage = recentLitres > 0 ? recentKm / recentLitres : 0;
  const olderMileage = olderLitres > 0 ? olderKm / olderLitres : 0;

  if (recentMileage < olderMileage * 0.9 && olderMileage > 0) {
    insights.push({
      id: "ins-mileage-warn",
      type: "attention",
      category: "mileage",
      title: "Mileage Reduction Noted",
      message: `Average mileage decreased from ${olderMileage.toFixed(
        2
      )} km/L to ${recentMileage.toFixed(
        2
      )} km/L. Recommended to check engine oil, fuel filters, or load limits.`,
    });
  }

  // Vehicle Profit Comparison (if fleet view or vehicle specified)
  const vehicleStatsMap: Record<string, { name: string; profit: number; trips: number }> =
    {};
  for (const v of vehicles) {
    vehicleStatsMap[v.id] = { name: v.vehicle_number, profit: 0, trips: 0 };
  }
  for (const t of trips) {
    if (vehicleStatsMap[t.vehicle_id]) {
      vehicleStatsMap[t.vehicle_id].profit += t.net_profit || 0;
      vehicleStatsMap[t.vehicle_id].trips += 1;
    }
  }

  const activeVStats = Object.values(vehicleStatsMap).filter(
    (v) => v.trips > 0
  );
  if (activeVStats.length > 1) {
    activeVStats.sort((a, b) => b.profit - a.profit);
    const topV = activeVStats[0];
    const lowV = activeVStats[activeVStats.length - 1];

    if (!selectedVehicleId) {
      insights.push({
        id: "ins-top-vehicle",
        type: "success",
        category: "performance",
        title: "Top Profit Generator",
        message: `${topV.name} generated the highest profit (${formatINR(
          topV.profit
        )}) across ${topV.trips} completed trips.`,
      });
    }

    if (
      selectedVehicleId &&
      vehicleStatsMap[selectedVehicleId] &&
      vehicleStatsMap[selectedVehicleId].trips > 0
    ) {
      const avgFleetTripProfit =
        trips.reduce((s, t) => s + (t.net_profit || 0), 0) / trips.length;
      const thisVehicleAvg =
        vehicleStatsMap[selectedVehicleId].profit /
        vehicleStatsMap[selectedVehicleId].trips;

      if (thisVehicleAvg < avgFleetTripProfit * 0.85) {
        insights.push({
          id: "ins-v-below-avg",
          type: "attention",
          category: "performance",
          title: "Below Fleet Average Profit",
          message: `${
            vehicleStatsMap[selectedVehicleId].name
          } has lower profit per trip (${formatINR(
            thisVehicleAvg
          )}) than the fleet average (${formatINR(avgFleetTripProfit)}).`,
        });
      }
    }
  }

  // Route Insight: Compare route profitability
  const routeProfits: Record<string, { total: number; count: number }> = {};
  for (const t of vehicleTrips) {
    const route = `${t.from_city} → ${t.to_city}`;
    if (!routeProfits[route]) routeProfits[route] = { total: 0, count: 0 };
    routeProfits[route].total += t.net_profit || 0;
    routeProfits[route].count += 1;
  }

  const routeList = Object.entries(routeProfits).filter(
    ([_, data]) => data.count >= 1
  );
  if (routeList.length >= 2) {
    routeList.sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count);
    const bestR = routeList[0];
    const secondR = routeList[1];
    const bestAvg = Math.round(bestR[1].total / bestR[1].count);
    const secondAvg = Math.round(secondR[1].total / secondR[1].count);

    if (bestAvg > secondAvg * 1.1) {
      insights.push({
        id: "ins-route-compare",
        type: "info",
        category: "route",
        title: "Route Profitability Insight",
        message: `"${bestR[0]}" has a higher average profit per trip (${formatINR(
          bestAvg
        )}) than "${secondR[0]}" (${formatINR(secondAvg)}).`,
      });
    }
  }

  // Maintenance insight
  if (vehicleMaint.length > 0) {
    const totalMaint = vehicleMaint.reduce((s, m) => s + (m.amount || 0), 0);
    const totalRev = vehicleTrips.reduce((s, t) => s + (t.trip_fare || 0), 0);
    const maintPercent = totalRev > 0 ? (totalMaint / totalRev) * 100 : 0;

    if (maintPercent > 15) {
      insights.push({
        id: "ins-maint-high",
        type: "warning",
        category: "maintenance",
        title: "High Maintenance Ratio",
        message: `Maintenance expenses account for ${maintPercent.toFixed(
          1
        )}% of total revenue (${formatINR(totalMaint)}). Review recurring mechanical repairs.`,
      });
    }
  }

  return insights;
}

/**
 * Vehicle-specific actionable insights
 */
export function generateVehicleInsights(
  stats: VehicleReportStats,
  trips: Trip[],
  maintenance: MaintenanceRecord[]
): Array<{ type: "good" | "warning" | "info"; title: string; message: string }> {
  const insights: Array<{ type: "good" | "warning" | "info"; title: string; message: string }> = [];

  if (trips.length === 0) {
    return [
      {
        type: "info",
        title: "No Trips Logged",
        message: "Enter trips for this vehicle to generate real-time financial and mileage insights.",
      },
    ];
  }

  // Mileage insight
  if (stats.overallMileage >= 4.5) {
    insights.push({
      type: "good",
      title: "Strong Fuel Economy",
      message: `Average mileage is ${stats.overallMileage} km/L, indicating efficient fuel consumption and healthy engine condition.`,
    });
  } else if (stats.overallMileage > 0 && stats.overallMileage < 3.5) {
    insights.push({
      type: "warning",
      title: "Low Mileage Warning",
      message: `Average mileage is ${stats.overallMileage} km/L. Recommended to check tyre pressure, air filter, and driving habits to reduce diesel cost.`,
    });
  }

  // Profit margin insight
  if (stats.profitMargin >= 30) {
    insights.push({
      type: "good",
      title: "High Profitability",
      message: `Excellent net profit margin of ${stats.profitMargin}% (retained ${formatINR(stats.finalVehicleProfit)}).`,
    });
  } else if (stats.profitMargin < 15 && stats.profitMargin >= 0) {
    insights.push({
      type: "warning",
      title: "Narrow Operating Margin",
      message: `Current margin is ${stats.profitMargin}%. Review high toll routes and loading expenses to increase retained profit.`,
    });
  } else if (stats.profitMargin < 0) {
    insights.push({
      type: "warning",
      title: "Operating at Net Loss",
      message: `Operating costs and maintenance exceed freight revenue by ${formatINR(Math.abs(stats.finalVehicleProfit))}.`,
    });
  }

  // Maintenance ratio
  if (stats.totalTripRevenue > 0 && stats.overallMaintenanceAmount > 0) {
    const maintRatio = (stats.overallMaintenanceAmount / stats.totalTripRevenue) * 100;
    if (maintRatio > 15) {
      insights.push({
        type: "warning",
        title: "High Maintenance Expenditure",
        message: `Maintenance accounts for ${maintRatio.toFixed(1)}% of total revenue (${formatINR(stats.overallMaintenanceAmount)}).`,
      });
    } else {
      insights.push({
        type: "info",
        title: "Controlled Maintenance",
        message: `Maintenance costs remain healthy at ${maintRatio.toFixed(1)}% of freight turnover.`,
      });
    }
  }

  // Route insight
  const routeCounts: Record<string, { trips: number; profit: number }> = {};
  for (const t of trips) {
    const r = `${t.from_city} -> ${t.to_city}`;
    if (!routeCounts[r]) routeCounts[r] = { trips: 0, profit: 0 };
    routeCounts[r].trips += 1;
    routeCounts[r].profit += t.net_profit || 0;
  }
  const topRoutes = Object.entries(routeCounts).sort((a, b) => b[1].profit - a[1].profit);
  if (topRoutes.length > 0) {
    const [bestR, bData] = topRoutes[0];
    insights.push({
      type: "good",
      title: "Most Profitable Route",
      message: `"${bestR}" delivered ${formatINR(bData.profit)} across ${bData.trips} trip(s).`,
    });
  }

  return insights;
}

