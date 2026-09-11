import { supabase, isSupabaseConfigured } from "./supabase";
import { Vehicle, Driver, Trip, MaintenanceRecord } from "../types";

const VEHICLES_KEY = "svl_vehicles_data";
const DRIVERS_KEY = "svl_drivers_data";
const TRIPS_KEY = "svl_trips_data";
const MAINTENANCE_KEY = "svl_maintenance_data";

// Initial seed data as per specification
const INITIAL_VEHICLES: Vehicle[] = [
  { id: "veh-1", vehicle_number: "TN 25 AK 4061", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "veh-2", vehicle_number: "TN 54 AA 4710", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "veh-3", vehicle_number: "TN 88 J 1056", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "veh-4", vehicle_number: "TN 04 BA 1499", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "veh-5", vehicle_number: "TN 12 P 1359", active: true, created_at: "2026-01-01T00:00:00Z" },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: "drv-1", driver_name: "Paranthaman", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "drv-2", driver_name: "Sivaguru", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "drv-3", driver_name: "Silambarasan", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "drv-4", driver_name: "Manikandan", active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "drv-5", driver_name: "Myself", active: true, created_at: "2026-01-01T00:00:00Z" },
];

const INITIAL_TRIPS: Trip[] = [];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [];

// Automatic migration to clear previous demo/seed data as requested
const RESET_DATA_KEY = "svl_clean_state_v2";
if (typeof window !== "undefined") {
  try {
    if (!localStorage.getItem(RESET_DATA_KEY)) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify([]));
      localStorage.setItem(MAINTENANCE_KEY, JSON.stringify([]));
      localStorage.setItem(RESET_DATA_KEY, "true");
    }
  } catch (err) {
    console.error("Local clean reset error:", err);
  }
}

// Helper to access LocalStorage safely
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

// -------------------------------------------------------------
// VEHICLES API
// -------------------------------------------------------------
export async function getVehicles(onlyActive = false): Promise<Vehicle[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("vehicles").select("*").order("created_at", { ascending: true });
      if (onlyActive) {
        query = query.eq("active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase vehicle query fallback to local:", e);
    }
  }

  let list = getLocal<Vehicle[]>(VEHICLES_KEY, INITIAL_VEHICLES);
  if (!list || list.length === 0) {
    list = INITIAL_VEHICLES;
    setLocal(VEHICLES_KEY, list);
  }
  return onlyActive ? list.filter((v) => v.active) : list;
}

export async function addVehicle(vehicleNumber: string): Promise<Vehicle> {
  const cleanNumber = vehicleNumber.trim().toUpperCase();
  const newVeh: Vehicle = {
    id: "veh-" + Date.now(),
    vehicle_number: cleanNumber,
    active: true,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([{ vehicle_number: cleanNumber, active: true }])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase addVehicle fallback to local:", e);
    }
  }

  const list = await getVehicles();
  // Check if exists
  const existing = list.find((v) => v.vehicle_number === cleanNumber);
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      setLocal(VEHICLES_KEY, list);
    }
    return existing;
  }

  const updated = [...list, newVeh];
  setLocal(VEHICLES_KEY, updated);
  return newVeh;
}

export async function updateVehicleStatus(id: string, active: boolean): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("vehicles").update({ active }).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateVehicleStatus fallback:", e);
    }
  }

  const list = await getVehicles();
  const updated = list.map((v) => (v.id === id ? { ...v, active } : v));
  setLocal(VEHICLES_KEY, updated);
}

// -------------------------------------------------------------
// DRIVERS API
// -------------------------------------------------------------
export async function getDrivers(onlyActive = false): Promise<Driver[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("drivers").select("*").order("created_at", { ascending: true });
      if (onlyActive) {
        query = query.eq("active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase driver query fallback to local:", e);
    }
  }

  let list = getLocal<Driver[]>(DRIVERS_KEY, INITIAL_DRIVERS);
  if (!list || list.length === 0) {
    list = INITIAL_DRIVERS;
    setLocal(DRIVERS_KEY, list);
  }
  return onlyActive ? list.filter((d) => d.active) : list;
}

export async function addDriver(driverName: string): Promise<Driver> {
  const cleanName = driverName.trim();
  const newDriver: Driver = {
    id: "drv-" + Date.now(),
    driver_name: cleanName,
    active: true,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .insert([{ driver_name: cleanName, active: true }])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase addDriver fallback to local:", e);
    }
  }

  const list = await getDrivers();
  const existing = list.find(
    (d) => d.driver_name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      setLocal(DRIVERS_KEY, list);
    }
    return existing;
  }

  const updated = [...list, newDriver];
  setLocal(DRIVERS_KEY, updated);
  return newDriver;
}

export async function updateDriverStatus(id: string, active: boolean): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("drivers").update({ active }).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateDriverStatus fallback:", e);
    }
  }

  const list = await getDrivers();
  const updated = list.map((d) => (d.id === id ? { ...d, active } : d));
  setLocal(DRIVERS_KEY, updated);
}

// -------------------------------------------------------------
// TRIPS API
// -------------------------------------------------------------
export async function getTrips(filter?: {
  vehicleId?: string;
  driverId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<Trip[]> {
  const vehicles = await getVehicles();
  const drivers = await getDrivers();

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));
  const driverMap = new Map(drivers.map((d) => [d.id, d.driver_name]));

  let rawTrips: Trip[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("trips").select("*").order("trip_date", { ascending: false });
      if (filter?.vehicleId) query = query.eq("vehicle_id", filter.vehicleId);
      if (filter?.driverId) query = query.eq("driver_id", filter.driverId);
      if (filter?.fromDate) query = query.gte("trip_date", filter.fromDate);
      if (filter?.toDate) query = query.lte("trip_date", filter.toDate);

      const { data, error } = await query;
      if (!error && data) {
        rawTrips = data;
      }
    } catch (e) {
      console.warn("Supabase trips query fallback:", e);
    }
  }

  if (rawTrips.length === 0) {
    rawTrips = getLocal<Trip[]>(TRIPS_KEY, []);

    if (filter?.vehicleId) {
      rawTrips = rawTrips.filter((t) => t.vehicle_id === filter.vehicleId);
    }
    if (filter?.driverId) {
      rawTrips = rawTrips.filter((t) => t.driver_id === filter.driverId);
    }
    if (filter?.fromDate) {
      rawTrips = rawTrips.filter((t) => t.trip_date >= filter.fromDate!);
    }
    if (filter?.toDate) {
      rawTrips = rawTrips.filter((t) => t.trip_date <= filter.toDate!);
    }
  }

  // Preserve historical names even if active/inactive status changed
  const enrichedTrips = rawTrips.map((t) => {
    const adv = Number(t.advance_received) || 0;
    const fare = Number(t.trip_fare) || 0;
    const beta = Number(t.driver_beta) || 0;
    const paidToDriver = Number(t.amount_paid_to_driver) || 0;
    const balAmount =
      t.balance_amount !== undefined && t.balance_amount !== null
        ? Number(t.balance_amount)
        : fare - adv;
    const remDriver =
      t.remaining_amount_to_driver !== undefined && t.remaining_amount_to_driver !== null
        ? Number(t.remaining_amount_to_driver)
        : beta - paidToDriver;

    return {
      ...t,
      advance_received: adv,
      advance_received_date: t.advance_received_date || "",
      balance_amount: balAmount,
      balance_received_date: t.balance_received_date || "",
      amount_paid_to_driver: paidToDriver,
      driver_payment_date: t.driver_payment_date || "",
      remaining_amount_to_driver: remDriver,
      vehicle_number:
        t.vehicle_number ||
        vehicleMap.get(t.vehicle_id) ||
        "Vehicle #" + t.vehicle_id.slice(-4),
      driver_name:
        t.driver_name ||
        driverMap.get(t.driver_id) ||
        "Driver #" + t.driver_id.slice(-4),
    };
  });

  // Always newest trip first
  enrichedTrips.sort((a, b) => b.trip_date.localeCompare(a.trip_date));
  return enrichedTrips;
}

export async function addTrip(
  tripData: Omit<Trip, "id" | "created_at">
): Promise<Trip> {
  const newTrip: Trip = {
    ...tripData,
    advance_received: Number(tripData.advance_received) || 0,
    advance_received_date: tripData.advance_received_date || "",
    balance_amount:
      tripData.balance_amount !== undefined
        ? Number(tripData.balance_amount)
        : (Number(tripData.trip_fare) || 0) - (Number(tripData.advance_received) || 0),
    balance_received_date: tripData.balance_received_date || "",
    amount_paid_to_driver: Number(tripData.amount_paid_to_driver) || 0,
    driver_payment_date: tripData.driver_payment_date || "",
    remaining_amount_to_driver:
      tripData.remaining_amount_to_driver !== undefined
        ? Number(tripData.remaining_amount_to_driver)
        : (Number(tripData.driver_beta) || 0) - (Number(tripData.amount_paid_to_driver) || 0),
    id: "trip-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("trips")
        .insert([
          {
            trip_date: tripData.trip_date,
            vehicle_id: tripData.vehicle_id,
            driver_id: tripData.driver_id,
            transporter_name: tripData.transporter_name,
            trip_fare: tripData.trip_fare,
            broker_fare: tripData.broker_fare,
            driver_beta: tripData.driver_beta,
            driver_beta_type: tripData.driver_beta_type,
            from_state: tripData.from_state,
            from_city: tripData.from_city,
            to_state: tripData.to_state,
            to_city: tripData.to_city,
            starting_odometer: tripData.starting_odometer || 0,
            ending_odometer: tripData.ending_odometer || 0,
            trip_running_kms: tripData.trip_running_kms,
            toll_charges: tripData.toll_charges,
            diesel_expense: tripData.diesel_expense,
            diesel_litres: tripData.diesel_litres,
            mileage: tripData.mileage,
            loading_expense: tripData.loading_expense,
            unloading_expense: tripData.unloading_expense,
            other_expenses: tripData.other_expenses,
            net_profit: tripData.net_profit,
            advance_received: newTrip.advance_received,
            advance_received_date: newTrip.advance_received_date,
            balance_amount: newTrip.balance_amount,
            balance_received_date: newTrip.balance_received_date,
            amount_paid_to_driver: newTrip.amount_paid_to_driver,
            driver_payment_date: newTrip.driver_payment_date,
            remaining_amount_to_driver: newTrip.remaining_amount_to_driver,
          },
        ])
        .select()
        .single();
      if (!error && data) {
        return {
          ...data,
          vehicle_number: tripData.vehicle_number,
          driver_name: tripData.driver_name,
        };
      }
    } catch (e) {
      console.warn("Supabase addTrip fallback:", e);
    }
  }

  const existingTrips = getLocal<Trip[]>(TRIPS_KEY, []);
  const updatedTrips = [newTrip, ...existingTrips];
  setLocal(TRIPS_KEY, updatedTrips);
  return newTrip;
}

export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: Record<string, any> = { ...tripData };
      delete payload.id;
      delete payload.created_at;
      delete payload.vehicle_number;
      delete payload.driver_name;
      payload.updated_at = new Date().toISOString();
      await supabase.from("trips").update(payload).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateTrip fallback:", e);
    }
  }

  const list = getLocal<Trip[]>(TRIPS_KEY, []);
  const updated = list.map((t) =>
    t.id === id
      ? {
          ...t,
          ...tripData,
          updated_at: new Date().toISOString(),
        }
      : t
  );
  setLocal(TRIPS_KEY, updated);
}

export async function deleteTrip(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("trips").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteTrip fallback:", e);
    }
  }

  const list = getLocal<Trip[]>(TRIPS_KEY, []);
  const updated = list.filter((t) => t.id !== id);
  setLocal(TRIPS_KEY, updated);
}

// -------------------------------------------------------------
// MAINTENANCE API
// -------------------------------------------------------------
export async function getMaintenanceRecords(
  vehicleId?: string,
  fromDate?: string,
  toDate?: string
): Promise<MaintenanceRecord[]> {
  const vehicles = await getVehicles();
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));

  let rawList: MaintenanceRecord[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("maintenance").select("*").order("maintenance_date", { ascending: false });
      if (vehicleId) query = query.eq("vehicle_id", vehicleId);
      if (fromDate) query = query.gte("maintenance_date", fromDate);
      if (toDate) query = query.lte("maintenance_date", toDate);

      const { data, error } = await query;
      if (!error && data) {
        rawList = data;
      }
    } catch (e) {
      console.warn("Supabase maintenance query fallback:", e);
    }
  }

  if (rawList.length === 0) {
    rawList = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);

    if (vehicleId) {
      rawList = rawList.filter((m) => m.vehicle_id === vehicleId);
    }
    if (fromDate) {
      rawList = rawList.filter((m) => m.maintenance_date >= fromDate);
    }
    if (toDate) {
      rawList = rawList.filter((m) => m.maintenance_date <= toDate);
    }
  }

  const enriched = rawList.map((m) => ({
    ...m,
    vehicle_number: m.vehicle_number || vehicleMap.get(m.vehicle_id) || "Vehicle #" + m.vehicle_id.slice(-4),
  }));

  // Sort newest first
  enriched.sort((a, b) => b.maintenance_date.localeCompare(a.maintenance_date));
  return enriched;
}

export async function addMaintenanceRecord(
  record: Omit<MaintenanceRecord, "id" | "created_at">
): Promise<MaintenanceRecord> {
  const newRecord: MaintenanceRecord = {
    ...record,
    id: "maint-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("maintenance")
        .insert([
          {
            vehicle_id: record.vehicle_id,
            maintenance_date: record.maintenance_date,
            odometer_reading: record.odometer_reading,
            service_type: record.service_type,
            description: record.description,
            amount: record.amount,
            notes: record.notes,
          },
        ])
        .select()
        .single();
      if (!error && data) {
        return {
          ...data,
          vehicle_number: record.vehicle_number,
        };
      }
    } catch (e) {
      console.warn("Supabase addMaintenance fallback:", e);
    }
  }

  const existing = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
  const updated = [newRecord, ...existing];
  setLocal(MAINTENANCE_KEY, updated);
  return newRecord;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("maintenance").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteMaintenance fallback:", e);
    }
  }

  const list = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
  const updated = list.filter((m) => m.id !== id);
  setLocal(MAINTENANCE_KEY, updated);
}

export async function clearAllTripsAndMaintenance(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("trips").delete().neq("id", "0");
      await supabase.from("maintenance").delete().neq("id", "0");
    } catch (e) {
      console.warn("Supabase clear error:", e);
    }
  }
  setLocal(TRIPS_KEY, []);
  setLocal(MAINTENANCE_KEY, []);
}
