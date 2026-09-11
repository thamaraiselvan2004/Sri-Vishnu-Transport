import { Trip, MaintenanceRecord, Vehicle, Driver } from "../types";

function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportTripsToCsv(trips: Trip[]) {
  const headers = [
    "Trip ID",
    "Date",
    "Vehicle Number",
    "Driver Name",
    "Transporter Name",
    "From State",
    "From City",
    "To State",
    "To City",
    "Trip Fare (₹)",
    "Broker Fare (₹)",
    "Driver Beta (₹)",
    "Driver Beta Type",
    "Trip Running KM",
    "Diesel Expense (₹)",
    "Diesel Litres",
    "Mileage (KM/L)",
    "Toll Charges (₹)",
    "Loading Expense (₹)",
    "Unloading Expense (₹)",
    "Other Expenses (₹)",
    "Net Profit (₹)",
    "Created At",
  ];

  const rows = trips.map((t) => [
    t.id,
    t.trip_date,
    t.vehicle_number || "",
    t.driver_name || "",
    t.transporter_name,
    t.from_state,
    t.from_city,
    t.to_state,
    t.to_city,
    t.trip_fare,
    t.broker_fare,
    t.driver_beta,
    t.driver_beta_type,
    t.trip_running_kms,
    t.diesel_expense,
    t.diesel_litres,
    t.mileage,
    t.toll_charges,
    t.loading_expense,
    t.unloading_expense,
    t.other_expenses,
    t.net_profit,
    t.created_at,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  downloadCsvFile(csvContent, `Sri_Vishnu_Logistics_Trips_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportMaintenanceToCsv(records: MaintenanceRecord[]) {
  const headers = [
    "Record ID",
    "Maintenance Date",
    "Vehicle Number",
    "Odometer Reading",
    "Service Type",
    "Description",
    "Amount (₹)",
    "Notes",
    "Created At",
  ];

  const rows = records.map((m) => [
    m.id,
    m.maintenance_date,
    m.vehicle_number || "",
    m.odometer_reading,
    m.service_type,
    m.description,
    m.amount,
    m.notes,
    m.created_at,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  downloadCsvFile(csvContent, `Sri_Vishnu_Logistics_Maintenance_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportMasterDataToCsv(vehicles: Vehicle[], drivers: Driver[]) {
  const vHeaders = ["Vehicle ID", "Vehicle Number", "Active", "Created At"];
  const vRows = vehicles.map((v) => [v.id, v.vehicle_number, v.active ? "Active" : "Inactive", v.created_at]);

  const dHeaders = ["Driver ID", "Driver Name", "Active", "Created At"];
  const dRows = drivers.map((d) => [d.id, d.driver_name, d.active ? "Active" : "Inactive", d.created_at]);

  const content = [
    "--- VEHICLES ---",
    vHeaders.map(escapeCsvCell).join(","),
    ...vRows.map((r) => r.map(escapeCsvCell).join(",")),
    "",
    "--- DRIVERS ---",
    dHeaders.map(escapeCsvCell).join(","),
    ...dRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  downloadCsvFile(content, `Sri_Vishnu_Logistics_Fleet_Master_${new Date().toISOString().slice(0, 10)}.csv`);
}

// Aliases with uppercase CSV
export const exportTripsToCSV = exportTripsToCsv;
export const exportMaintenanceToCSV = exportMaintenanceToCsv;
export const exportMasterDataToCSV = exportMasterDataToCsv;

/**
 * Export full single vehicle report with trips and maintenance breakdown
 */
export function exportVehicleReportToCSV(
  vehicleNumber: string,
  trips: Trip[],
  maintenance: MaintenanceRecord[],
  stats: any
) {
  const summaryHeaders = [
    "Vehicle Number",
    "Total Trips",
    "Running Distance (KM)",
    "Total Freight Revenue (₹)",
    "Total Trip Expenses (₹)",
    "Maintenance Expense (₹)",
    "Final Vehicle Profit (₹)",
    "Profit Margin (%)",
    "Average Mileage (km/L)",
  ];

  const summaryRows = [
    [
      vehicleNumber,
      stats.totalTrips,
      stats.overallRunningKms || stats.overallTripRunningKms || 0,
      stats.totalTripRevenue,
      stats.totalTripExpenses,
      stats.overallMaintenanceAmount,
      stats.finalVehicleProfit,
      stats.profitMargin,
      stats.overallMileage,
    ],
  ];

  const tripHeaders = [
    "Date",
    "Driver",
    "Transporter",
    "Route",
    "Running KM",
    "Fare (₹)",
    "Driver Beta (₹)",
    "Diesel (₹)",
    "Toll (₹)",
    "Net Profit (₹)",
  ];

  const tripRows = trips.map((t) => [
    t.trip_date,
    t.driver_name || "",
    t.transporter_name,
    `${t.from_city} -> ${t.to_city}`,
    t.trip_running_kms,
    t.trip_fare,
    t.driver_beta,
    t.diesel_expense,
    t.toll_charges,
    t.net_profit,
  ]);

  const content = [
    `--- SRI VISHNU LOGISTICS VEHICLE STATEMENT: ${vehicleNumber} ---`,
    summaryHeaders.map(escapeCsvCell).join(","),
    ...summaryRows.map((r) => r.map(escapeCsvCell).join(",")),
    "",
    "--- TRIP LOGS ---",
    tripHeaders.map(escapeCsvCell).join(","),
    ...tripRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  downloadCsvFile(content, `SVL_${vehicleNumber.replace(/\s+/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export complete backup snapshot as JSON
 */
export function exportCompleteBackupJSON(data: any) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Sri_Vishnu_Logistics_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
