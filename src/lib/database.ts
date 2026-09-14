import { Vehicle, Driver, Trip, MaintenanceRecord } from "../types";

const VEHICLES_KEY = "svl_vehicles_data";
const DRIVERS_KEY = "svl_drivers_data";
const TRIPS_KEY = "svl_trips_data";
const MAINTENANCE_KEY = "svl_maintenance_data";
const MIGRATION_DONE_KEY = "svl_server_migrated_v1";

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
// ONE-TIME LOCAL DATA MIGRATION TO SHARED SERVER DATABASE
// -------------------------------------------------------------
let migrationAttempted = false;
async function autoMigrateLocalDataToServer() {
  if (migrationAttempted || typeof window === "undefined") return;
  migrationAttempted = true;

  try {
    const localTrips = getLocal<Trip[]>(TRIPS_KEY, []);
    const localMaintenance = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
    const localVehicles = getLocal<Vehicle[]>(VEHICLES_KEY, []);
    const localDrivers = getLocal<Driver[]>(DRIVERS_KEY, []);

    if (localTrips.length > 0 || localMaintenance.length > 0) {
      await fetch("/api/migrate-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trips: localTrips,
          maintenance: localMaintenance,
          vehicles: localVehicles,
          drivers: localDrivers,
        }),
      });
      localStorage.setItem(MIGRATION_DONE_KEY, "true");
    }
  } catch (err) {
    console.warn("Auto-migration to server database notice:", err);
  }
}

// -------------------------------------------------------------
// VEHICLES API (CENTRAL SERVER + LOCAL FALLBACK)
// -------------------------------------------------------------
export async function getVehicles(onlyActive = false): Promise<Vehicle[]> {
  try {
    const res = await fetch(`/api/vehicles${onlyActive ? "?onlyActive=true" : ""}`);
    if (res.ok) {
      const data: Vehicle[] = await res.json();
      setLocal(VEHICLES_KEY, data);
      autoMigrateLocalDataToServer();
      return onlyActive ? data.filter((v) => v.active) : data;
    }
  } catch (e) {
    console.warn("Server API unavailable for vehicles, fallback to local storage:", e);
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

  try {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle_number: cleanNumber }),
    });
    if (res.ok) {
      const savedVehicle: Vehicle = await res.json();
      const list = await getVehicles();
      setLocal(VEHICLES_KEY, list);
      return savedVehicle;
    }
  } catch (e) {
    console.warn("Server addVehicle failed, using local:", e);
  }

  const list = await getVehicles();
  const existing = list.find((v) => v.vehicle_number === cleanNumber);
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      setLocal(VEHICLES_KEY, list);
    }
    return existing;
  }

  const newVeh: Vehicle = {
    id: "veh-" + Date.now(),
    vehicle_number: cleanNumber,
    active: true,
    created_at: new Date().toISOString(),
  };

  const updated = [...list, newVeh];
  setLocal(VEHICLES_KEY, updated);
  return newVeh;
}

export async function updateVehicleStatus(id: string, active: boolean): Promise<void> {
  try {
    await fetch(`/api/vehicles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  } catch (e) {
    console.warn("Server updateVehicleStatus failed, using local:", e);
  }

  const list = await getVehicles();
  const updated = list.map((v) => (v.id === id ? { ...v, active } : v));
  setLocal(VEHICLES_KEY, updated);
}

// -------------------------------------------------------------
// DRIVERS API (CENTRAL SERVER + LOCAL FALLBACK)
// -------------------------------------------------------------
export async function getDrivers(onlyActive = false): Promise<Driver[]> {
  try {
    const res = await fetch(`/api/drivers${onlyActive ? "?onlyActive=true" : ""}`);
    if (res.ok) {
      const data: Driver[] = await res.json();
      setLocal(DRIVERS_KEY, data);
      return onlyActive ? data.filter((d) => d.active) : data;
    }
  } catch (e) {
    console.warn("Server API unavailable for drivers, fallback to local storage:", e);
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

  try {
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driver_name: cleanName }),
    });
    if (res.ok) {
      const savedDriver: Driver = await res.json();
      const list = await getDrivers();
      setLocal(DRIVERS_KEY, list);
      return savedDriver;
    }
  } catch (e) {
    console.warn("Server addDriver failed, using local:", e);
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

  const newDriver: Driver = {
    id: "drv-" + Date.now(),
    driver_name: cleanName,
    active: true,
    created_at: new Date().toISOString(),
  };

  const updated = [...list, newDriver];
  setLocal(DRIVERS_KEY, updated);
  return newDriver;
}

export async function updateDriverStatus(id: string, active: boolean): Promise<void> {
  try {
    await fetch(`/api/drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  } catch (e) {
    console.warn("Server updateDriverStatus failed, using local:", e);
  }

  const list = await getDrivers();
  const updated = list.map((d) => (d.id === id ? { ...d, active } : d));
  setLocal(DRIVERS_KEY, updated);
}

// -------------------------------------------------------------
// TRIPS API (CENTRAL SERVER + MULTI-DEVICE SYNC)
// -------------------------------------------------------------
export async function getTrips(filter?: {
  vehicleId?: string;
  driverId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<Trip[]> {
  const queryParams = new URLSearchParams();
  if (filter?.vehicleId) queryParams.set("vehicleId", filter.vehicleId);
  if (filter?.driverId) queryParams.set("driverId", filter.driverId);
  if (filter?.fromDate) queryParams.set("fromDate", filter.fromDate);
  if (filter?.toDate) queryParams.set("toDate", filter.toDate);

  try {
    const url = `/api/trips${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const res = await fetch(url);
    if (res.ok) {
      const serverTrips: Trip[] = await res.json();
      setLocal(TRIPS_KEY, serverTrips);
      return serverTrips;
    }
  } catch (e) {
    console.warn("Server trips query failed, using local cache:", e);
  }

  // Fallback to local storage cache
  const vehicles = await getVehicles();
  const drivers = await getDrivers();
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));
  const driverMap = new Map(drivers.map((d) => [d.id, d.driver_name]));

  let rawTrips = getLocal<Trip[]>(TRIPS_KEY, []);

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

  enrichedTrips.sort((a, b) => b.trip_date.localeCompare(a.trip_date));
  return enrichedTrips;
}

export async function addTrip(
  tripData: Omit<Trip, "id" | "created_at">
): Promise<Trip> {
  const adv = Number(tripData.advance_received) || 0;
  const fare = Number(tripData.trip_fare) || 0;
  const beta = Number(tripData.driver_beta) || 0;
  const paidToDriver = Number(tripData.amount_paid_to_driver) || 0;

  const payload = {
    ...tripData,
    advance_received: adv,
    advance_received_date: tripData.advance_received_date || "",
    balance_amount:
      tripData.balance_amount !== undefined
        ? Number(tripData.balance_amount)
        : fare - adv,
    balance_received_date: tripData.balance_received_date || "",
    amount_paid_to_driver: paidToDriver,
    driver_payment_date: tripData.driver_payment_date || "",
    remaining_amount_to_driver:
      tripData.remaining_amount_to_driver !== undefined
        ? Number(tripData.remaining_amount_to_driver)
        : beta - paidToDriver,
  };

  try {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const savedTrip: Trip = await res.json();
      const existingTrips = getLocal<Trip[]>(TRIPS_KEY, []);
      setLocal(TRIPS_KEY, [savedTrip, ...existingTrips.filter((t) => t.id !== savedTrip.id)]);
      return savedTrip;
    }
  } catch (e) {
    console.warn("Server addTrip failed, saving to local cache:", e);
  }

  const fallbackTrip: Trip = {
    ...payload,
    id: "trip-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  const existingTrips = getLocal<Trip[]>(TRIPS_KEY, []);
  setLocal(TRIPS_KEY, [fallbackTrip, ...existingTrips]);
  return fallbackTrip;
}

export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<void> {
  try {
    const res = await fetch(`/api/trips/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripData),
    });
    if (res.ok) {
      const updated: Trip = await res.json();
      const list = getLocal<Trip[]>(TRIPS_KEY, []);
      setLocal(
        TRIPS_KEY,
        list.map((t) => (t.id === id ? updated : t))
      );
      return;
    }
  } catch (e) {
    console.warn("Server updateTrip failed, updating local cache:", e);
  }

  const list = getLocal<Trip[]>(TRIPS_KEY, []);
  const updatedList = list.map((t) =>
    t.id === id
      ? {
          ...t,
          ...tripData,
          updated_at: new Date().toISOString(),
        }
      : t
  );
  setLocal(TRIPS_KEY, updatedList);
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    await fetch(`/api/trips/${id}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.warn("Server deleteTrip failed, updating local cache:", e);
  }

  const list = getLocal<Trip[]>(TRIPS_KEY, []);
  const updated = list.filter((t) => t.id !== id);
  setLocal(TRIPS_KEY, updated);
}

// -------------------------------------------------------------
// MAINTENANCE API (CENTRAL SERVER + MULTI-DEVICE SYNC)
// -------------------------------------------------------------
export async function getMaintenanceRecords(
  vehicleId?: string,
  fromDate?: string,
  toDate?: string
): Promise<MaintenanceRecord[]> {
  const queryParams = new URLSearchParams();
  if (vehicleId) queryParams.set("vehicleId", vehicleId);
  if (fromDate) queryParams.set("fromDate", fromDate);
  if (toDate) queryParams.set("toDate", toDate);

  try {
    const url = `/api/maintenance${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const res = await fetch(url);
    if (res.ok) {
      const serverRecords: MaintenanceRecord[] = await res.json();
      setLocal(MAINTENANCE_KEY, serverRecords);
      return serverRecords;
    }
  } catch (e) {
    console.warn("Server maintenance query failed, using local cache:", e);
  }

  const vehicles = await getVehicles();
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));

  let rawList = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
  if (vehicleId) {
    rawList = rawList.filter((m) => m.vehicle_id === vehicleId);
  }
  if (fromDate) {
    rawList = rawList.filter((m) => m.maintenance_date >= fromDate);
  }
  if (toDate) {
    rawList = rawList.filter((m) => m.maintenance_date <= toDate);
  }

  const enriched = rawList.map((m) => ({
    ...m,
    vehicle_number: m.vehicle_number || vehicleMap.get(m.vehicle_id) || "Vehicle #" + m.vehicle_id.slice(-4),
  }));

  enriched.sort((a, b) => b.maintenance_date.localeCompare(a.maintenance_date));
  return enriched;
}

export async function addMaintenanceRecord(
  record: Omit<MaintenanceRecord, "id" | "created_at">
): Promise<MaintenanceRecord> {
  try {
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (res.ok) {
      const saved: MaintenanceRecord = await res.json();
      const existing = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
      setLocal(MAINTENANCE_KEY, [saved, ...existing.filter((m) => m.id !== saved.id)]);
      return saved;
    }
  } catch (e) {
    console.warn("Server addMaintenance failed, saving to local cache:", e);
  }

  const newRecord: MaintenanceRecord = {
    ...record,
    id: "maint-" + Date.now(),
    created_at: new Date().toISOString(),
  };

  const existing = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
  setLocal(MAINTENANCE_KEY, [newRecord, ...existing]);
  return newRecord;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  try {
    await fetch(`/api/maintenance/${id}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.warn("Server deleteMaintenance failed, updating local cache:", e);
  }

  const list = getLocal<MaintenanceRecord[]>(MAINTENANCE_KEY, []);
  const updated = list.filter((m) => m.id !== id);
  setLocal(MAINTENANCE_KEY, updated);
}

export async function clearAllTripsAndMaintenance(): Promise<void> {
  setLocal(TRIPS_KEY, []);
  setLocal(MAINTENANCE_KEY, []);
}

// Check if shared backend is online
export async function checkServerSyncStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/health");
    return res.ok;
  } catch {
    return false;
  }
}
