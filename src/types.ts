export interface Vehicle {
  id: string;
  vehicle_number: string;
  active: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  driver_name: string;
  active: boolean;
  halting_amount_per_day?: number;
  created_at: string;
}

export type DriverBetaType = 'percentage' | 'manual';

export interface Trip {
  id: string;
  trip_date: string;
  vehicle_id: string;
  driver_id: string;
  transporter_name: string;
  trip_fare: number;
  broker_fare: number;
  driver_beta: number;
  driver_beta_type: DriverBetaType;
  from_state: string;
  from_city: string;
  to_state: string;
  to_city: string;
  trip_running_kms: number;
  toll_charges: number;
  diesel_expense: number;
  diesel_litres: number;
  mileage: number;
  loading_expense: number;
  unloading_expense: number;
  other_expenses: number;
  net_profit: number;

  // Existing combined halting values are retained for compatibility.
  halting_days?: number;
  halting_charge_per_day?: number;
  halting_fare?: number;

  // New separate loading/unloading halting values.
  loading_halting_days?: number;
  loading_halting_charge_per_day?: number;
  loading_halting_fare?: number;
  unloading_halting_days?: number;
  unloading_halting_charge_per_day?: number;
  unloading_halting_fare?: number;

  advance_received?: number;
  advance_received_date?: string;
  balance_amount?: number;
  balance_received_date?: string;
  amount_paid_to_driver?: number;
  driver_payment_date?: string;
  remaining_amount_to_driver?: number;
  created_at: string;
  updated_at?: string;
  vehicle_number?: string;
  driver_name?: string;
}

export interface DriverReportStats {
  driverId: string;
  driverName: string;
  totalTrips: number;
  overallRunningKms: number;
  overallDriverBeta: number;
  overallHaltingDays: number;
  overallTotalDieselLitres: number;
  overallMileage: number;
  overallAmountPaidToDriver: number;
  overallRemainingAmountToDriver: number;
  overallDieselExpense: number;
  overallTripRevenue: number;
  overallOtherExpenses: number;
}

export interface ManualMileageRecord {
  id: string;
  vehicle_id: string;
  record_date: string;
  trip_number: number;
  starting_odometer: number;
  ending_odometer: number;
  diesel_litres: number;
  mileage: number;
  created_at: string;
  vehicle_number?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_date: string;
  odometer_reading: number;
  service_type: string;
  description: string;
  amount: number;
  notes: string;
  created_at: string;
  vehicle_number?: string;
}

export interface VehicleReportStats {
  totalTrips: number;
  overallRunningKms: number;
  overallTripRunningKms?: number;
  overallDieselExpense: number;
  overallDieselLitres: number;
  overallDriverBeta: number;
  overallMaintenanceAmount: number;
  overallTollExpense: number;
  overallMileage: number;
  totalTripRevenue: number;
  totalBrokerFare: number;
  totalLoadingExpense: number;
  totalUnloadingExpense: number;
  totalOtherExpenses: number;
  totalTripExpenses: number;
  totalAllExpenses: number;
  totalTripNetProfit: number;
  finalVehicleProfit: number;
  profitMargin: number;
  maintenanceRecordCount?: number;
  revenuePerKm: number;
  profitPerKm: number;
  averageProfitPerTrip: number;
  fuelCostPerKm: number;
  tollCostPerKm: number;
  totalHaltingDays: number;
  totalHaltingAmount: number;
  haltingTripCount: number;
}

export interface FleetStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  profitMargin: number;
  totalTrips: number;
  totalKm: number;
  totalDistance?: number;
  totalDiesel: number;
  totalDieselExpense?: number;
  totalToll: number;
  totalTollExpense?: number;
  averageMileage: number;
  totalMaintenance: number;
  bestVehicle: { vehicleNumber: string; profit: number } | null;
  bestPerformingVehicle?: { vehicleNumber: string; profit: number } | null;
  lowestVehicle: { vehicleNumber: string; profit: number } | null;
  lowestPerformingVehicle?: { vehicleNumber: string; profit: number } | null;
  bestRoute: { route: string; tripCount: number; avgProfit: number; profit?: number; trips?: number } | null;
  highestExpenseCategory: { category: string; amount: number } | null;
}

export interface BusinessInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'attention';
  category: 'performance' | 'diesel' | 'route' | 'mileage' | 'maintenance';
  title: string;
  message: string;
}

export interface UserSession {
  email: string;
  role: 'owner' | 'manager';
  name: string;
}
