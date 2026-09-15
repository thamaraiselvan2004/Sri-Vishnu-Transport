import { Vehicle, Driver, Trip, MaintenanceRecord, ManualMileageRecord } from "../types";
import { supabase } from "./supabase";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  return supabase;
}

function normalizeTripDates<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as T;
  for (const key of ["advance_received_date", "balance_received_date", "driver_payment_date"]) {
    if (key in result && (result as any)[key] === "") (result as any)[key] = null;
  }
  return result;
}

function tripPayload(data: Partial<Trip>): Record<string, any> {
  const allowed = [
    "trip_date", "vehicle_id", "driver_id", "transporter_name", "trip_fare", "broker_fare",
    "driver_beta", "driver_beta_type", "from_state", "from_city", "to_state", "to_city",
    "trip_running_kms", "toll_charges", "diesel_expense", "diesel_litres", "mileage",
    "loading_expense", "unloading_expense", "other_expenses", "net_profit", "halting_days",
    "halting_charge_per_day", "halting_fare", "loading_halting_days", "loading_halting_charge_per_day",
    "loading_halting_fare", "unloading_halting_days", "unloading_halting_charge_per_day",
    "unloading_halting_fare", "advance_received", "advance_received_date", "balance_amount",
    "balance_received_date", "amount_paid_to_driver", "driver_payment_date", "remaining_amount_to_driver",
  ];
  const payload: Record<string, any> = {};
  for (const key of allowed) if (key in data) payload[key] = (data as any)[key];
  return normalizeTripDates(payload);
}

function maintenancePayload(data: Partial<MaintenanceRecord>): Record<string, any> {
  const allowed = ["vehicle_id", "maintenance_date", "odometer_reading", "service_type", "description", "amount", "notes"];
  const payload: Record<string, any> = {};
  for (const key of allowed) if (key in data) payload[key] = (data as any)[key];
  return payload;
}

async function enrichTrips(trips: Trip[]): Promise<Trip[]> {
  const [vehicles, drivers] = await Promise.all([getVehicles(), getDrivers()]);
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));
  const driverMap = new Map(drivers.map((d) => [d.id, d.driver_name]));
  return trips.map((trip) => ({
    ...trip,
    vehicle_number: vehicleMap.get(trip.vehicle_id) ?? trip.vehicle_number,
    driver_name: driverMap.get(trip.driver_id) ?? trip.driver_name,
    advance_received: Number(trip.advance_received) || 0,
    balance_amount: Number(trip.balance_amount) || 0,
    amount_paid_to_driver: Number(trip.amount_paid_to_driver) || 0,
    remaining_amount_to_driver: Number(trip.remaining_amount_to_driver) || 0,
    halting_days: Number(trip.halting_days) || 0,
    halting_charge_per_day: Number(trip.halting_charge_per_day) || 0,
    halting_fare: Number(trip.halting_fare) || 0,
    loading_halting_days: Number(trip.loading_halting_days) || 0,
    loading_halting_charge_per_day: Number(trip.loading_halting_charge_per_day) || 0,
    loading_halting_fare: Number(trip.loading_halting_fare) || 0,
    unloading_halting_days: Number(trip.unloading_halting_days) || 0,
    unloading_halting_charge_per_day: Number(trip.unloading_halting_charge_per_day) || 0,
    unloading_halting_fare: Number(trip.unloading_halting_fare) || 0,
  }));
}

export async function getVehicles(onlyActive = false): Promise<Vehicle[]> {
  const client = requireSupabase();
  let query = client.from("vehicles").select("*").order("vehicle_number");
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function addVehicle(vehicleNumber: string): Promise<Vehicle> {
  const client = requireSupabase();
  const cleanNumber = vehicleNumber.trim().toUpperCase();
  const { data: existing, error: existingError } = await client.from("vehicles").select("*").eq("vehicle_number", cleanNumber).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (!existing.active) {
      const { data, error } = await client.from("vehicles").update({ active: true }).eq("id", existing.id).select().single();
      if (error) throw error;
      return data as Vehicle;
    }
    return existing as Vehicle;
  }
  const { data, error } = await client.from("vehicles").insert({ vehicle_number: cleanNumber, active: true }).select().single();
  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicleStatus(id: string, active: boolean): Promise<void> {
  const { error } = await requireSupabase().from("vehicles").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function getDrivers(onlyActive = false): Promise<Driver[]> {
  const client = requireSupabase();
  let query = client.from("drivers").select("*").order("driver_name");
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Driver[];
}

export async function addDriver(driverName: string): Promise<Driver> {
  const client = requireSupabase();
  const cleanName = driverName.trim();
  const { data: existing, error: existingError } = await client.from("drivers").select("*").ilike("driver_name", cleanName).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (!existing.active) {
      const { data, error } = await client.from("drivers").update({ active: true }).eq("id", existing.id).select().single();
      if (error) throw error;
      return data as Driver;
    }
    return existing as Driver;
  }
  const { data, error } = await client.from("drivers").insert({ driver_name: cleanName, active: true }).select().single();
  if (error) throw error;
  return data as Driver;
}

export async function updateDriverStatus(id: string, active: boolean): Promise<void> {
  const { error } = await requireSupabase().from("drivers").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function updateDriverHaltingAmount(id: string, amountPerDay: number): Promise<void> {
  const amount = Math.max(0, Number(amountPerDay) || 0);
  const { error } = await requireSupabase().from("drivers").update({ halting_amount_per_day: amount }).eq("id", id);
  if (error) throw error;
}

export async function getTrips(filter?: { vehicleId?: string; driverId?: string; fromDate?: string; toDate?: string }): Promise<Trip[]> {
  const client = requireSupabase();
  let query = client.from("trips").select("*").order("trip_date", { ascending: false });
  if (filter?.vehicleId) query = query.eq("vehicle_id", filter.vehicleId);
  if (filter?.driverId) query = query.eq("driver_id", filter.driverId);
  if (filter?.fromDate) query = query.gte("trip_date", filter.fromDate);
  if (filter?.toDate) query = query.lte("trip_date", filter.toDate);
  const { data, error } = await query;
  if (error) throw error;
  return enrichTrips((data ?? []) as Trip[]);
}

export async function addTrip(tripData: Omit<Trip, "id" | "created_at">): Promise<Trip> {
  const client = requireSupabase();
  const { data, error } = await client.from("trips").insert(tripPayload(tripData)).select().single();
  if (error) throw error;
  const [trip] = await enrichTrips([data as Trip]);
  return trip;
}

export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("trips").update({ ...tripPayload(tripData), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await requireSupabase().from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function getManualMileageRecords(vehicleId?: string): Promise<ManualMileageRecord[]> {
  const client = requireSupabase();
  let query = client.from("manual_mileage").select("*").order("trip_number", { ascending: true });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);
  const { data, error } = await query;
  if (error) throw error;
  const vehicles = await getVehicles();
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));
  return ((data ?? []) as ManualMileageRecord[]).map((r) => ({ ...r, vehicle_number: vehicleMap.get(r.vehicle_id) ?? r.vehicle_number }));
}

export async function addManualMileageRecord(data: Omit<ManualMileageRecord, "id" | "created_at" | "trip_number" | "vehicle_number">): Promise<ManualMileageRecord> {
  const client = requireSupabase();
  const { data: last, error: lastError } = await client.from("manual_mileage").select("trip_number").eq("vehicle_id", data.vehicle_id).order("trip_number", { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const tripNumber = Number(last?.trip_number || 0) + 1;
  const { data: row, error } = await client.from("manual_mileage").insert({ ...data, trip_number: tripNumber }).select().single();
  if (error) throw error;
  const vehicles = await getVehicles();
  return { ...(row as ManualMileageRecord), vehicle_number: vehicles.find((v) => v.id === data.vehicle_id)?.vehicle_number };
}

export async function deleteManualMileageRecord(id: string): Promise<void> {
  const { error } = await requireSupabase().from("manual_mileage").delete().eq("id", id);
  if (error) throw error;
}

export async function getMaintenanceRecords(vehicleId?: string, fromDate?: string, toDate?: string): Promise<MaintenanceRecord[]> {
  const client = requireSupabase();
  let query = client.from("maintenance").select("*").order("maintenance_date", { ascending: false });
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);
  if (fromDate) query = query.gte("maintenance_date", fromDate);
  if (toDate) query = query.lte("maintenance_date", toDate);
  const { data, error } = await query;
  if (error) throw error;
  const vehicles = await getVehicles();
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));
  return ((data ?? []) as MaintenanceRecord[]).map((record) => ({ ...record, vehicle_number: vehicleMap.get(record.vehicle_id) ?? record.vehicle_number }));
}

export async function addMaintenanceRecord(record: Omit<MaintenanceRecord, "id" | "created_at">): Promise<MaintenanceRecord> {
  const { data, error } = await requireSupabase().from("maintenance").insert(maintenancePayload(record)).select().single();
  if (error) throw error;
  const vehicles = await getVehicles();
  return { ...(data as MaintenanceRecord), vehicle_number: vehicles.find((v) => v.id === data.vehicle_id)?.vehicle_number };
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const { error } = await requireSupabase().from("maintenance").delete().eq("id", id);
  if (error) throw error;
}

export async function clearAllTripsAndMaintenance(): Promise<void> {
  const client = requireSupabase();
  const { error: tripsError } = await client.from("trips").delete().not("id", "is", null);
  if (tripsError) throw tripsError;
  const { error: maintenanceError } = await client.from("maintenance").delete().not("id", "is", null);
  if (maintenanceError) throw maintenanceError;
}

export async function checkServerSyncStatus(): Promise<boolean> {
  try {
    const { error } = await requireSupabase().from("vehicles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
