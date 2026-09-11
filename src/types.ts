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
  created_at: string;
}

export type DriverBetaType = 'percentage' | 'manual';

export interface Trip {
  id: string;
  trip_date: string; // YYYY-MM-DD
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
  starting_odometer?: number;
  ending_odometer?: number;
  trip_running_kms: number;
  toll_charges: number;
  diesel_expense: number;
  diesel_litres: number;
  mileage: number;
  loading_expense: number;
  unloading_expense: number;
  other_expenses: number;
  net_profit: number;
  // Advance and Balance Collections
  advance_received?: number;
  advance_received_date?: string; // YYYY-MM-DD
  balance_amount?: number; // Trip fare - advance received
  balance_received_date?: string; // YYYY-MM-DD

  // Driver Settlement Payments
  amount_paid_to_driver?: number;
  driver_payment_date?: string; // YYYY-MM-DD
  remaining_amount_to_driver?: number; // Driver beta - amount paid to driver

  created_at: string;
  updated_at?: string;

  // Joined/denormalized fields for display & historical safety
  vehicle_number?: string;
  driver_name?: string;
}

export interface DriverReportStats {
  driverId: string;
  driverName: string;
  totalTrips: number;
  overallRunningKms: number; // overall kms
  overallDriverBeta: number; // overall driver beta
  overallTotalDieselLitres: number; // overall Total Diesel in Litres
  overallMileage: number; // (overall kms / overall Total Diesel in Litres)
  overallAmountPaidToDriver: number; // overall Amount paid to driver
  overallRemainingAmountToDriver: number; // overall Remaining amount to driver
  overallDieselExpense: number;
  overallTripRevenue: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_date: string; // YYYY-MM-DD
  odometer_reading: number;
  service_type: string;
  description: string;
  amount: number;
  notes: string;
  created_at: string;

  // Joined display field
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

  // Profit improvement metrics
  revenuePerKm: number;
  profitPerKm: number;
  averageProfitPerTrip: number;
  fuelCostPerKm: number;
  tollCostPerKm: number;
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
