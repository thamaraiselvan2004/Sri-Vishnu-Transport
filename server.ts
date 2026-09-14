import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Server database storage directory and file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "logistics_db.json");

interface LogisticsDatabase {
  vehicles: Array<{
    id: string;
    vehicle_number: string;
    active: boolean;
    created_at: string;
  }>;
  drivers: Array<{
    id: string;
    driver_name: string;
    active: boolean;
    created_at: string;
  }>;
  trips: Array<any>;
  maintenance: Array<any>;
  last_updated: string;
}

const DEFAULT_DB: LogisticsDatabase = {
  vehicles: [
    { id: "veh-1", vehicle_number: "TN 25 AK 4061", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "veh-2", vehicle_number: "TN 54 AA 4710", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "veh-3", vehicle_number: "TN 88 J 1056", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "veh-4", vehicle_number: "TN 04 BA 1499", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "veh-5", vehicle_number: "TN 12 P 1359", active: true, created_at: "2026-01-01T00:00:00Z" },
  ],
  drivers: [
    { id: "drv-1", driver_name: "Paranthaman", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "drv-2", driver_name: "Sivaguru", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "drv-3", driver_name: "Silambarasan", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "drv-4", driver_name: "Manikandan", active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: "drv-5", driver_name: "Myself", active: true, created_at: "2026-01-01T00:00:00Z" },
  ],
  trips: [],
  maintenance: [],
  last_updated: new Date().toISOString(),
};

// Ensure data folder and file exist
function readDatabase(): LogisticsDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : DEFAULT_DB.vehicles,
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers : DEFAULT_DB.drivers,
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
      maintenance: Array.isArray(parsed.maintenance) ? parsed.maintenance : [],
      settings: parsed.settings || {},
      last_updated: parsed.last_updated || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error reading database file, fallback to default:", err);
    return DEFAULT_DB;
  }
}

function writeDatabase(db: LogisticsDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.last_updated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// -------------------------------------------------------------
// CENTRALIZED SERVER API ROUTES (Accessible by all devices)
// -------------------------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Sri Vishnu Logistics",
    shared_database: "active",
    timestamp: new Date().toISOString(),
  });
});

// Full state sync
app.get("/api/sync", (_req, res) => {
  const db = readDatabase();
  res.json(db);
});

// Vehicles API
app.get("/api/vehicles", (req, res) => {
  const db = readDatabase();
  const onlyActive = req.query.onlyActive === "true";
  const list = onlyActive ? db.vehicles.filter((v) => v.active) : db.vehicles;
  res.json(list);
});

app.post("/api/vehicles", (req, res) => {
  const { vehicle_number } = req.body;
  if (!vehicle_number || typeof vehicle_number !== "string") {
    return res.status(400).json({ error: "Vehicle number is required" });
  }
  const cleanNumber = vehicle_number.trim().toUpperCase();
  const db = readDatabase();

  const existing = db.vehicles.find((v) => v.vehicle_number === cleanNumber);
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      writeDatabase(db);
    }
    return res.json(existing);
  }

  const newVeh = {
    id: "veh-" + Date.now(),
    vehicle_number: cleanNumber,
    active: true,
    created_at: new Date().toISOString(),
  };
  db.vehicles.push(newVeh);
  writeDatabase(db);
  res.status(201).json(newVeh);
});

app.put("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const { active, vehicle_number } = req.body;
  const db = readDatabase();
  const index = db.vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  if (typeof active === "boolean") {
    db.vehicles[index].active = active;
  }
  if (vehicle_number && typeof vehicle_number === "string") {
    db.vehicles[index].vehicle_number = vehicle_number.trim().toUpperCase();
  }
  writeDatabase(db);
  res.json(db.vehicles[index]);
});

// Drivers API
app.get("/api/drivers", (req, res) => {
  const db = readDatabase();
  const onlyActive = req.query.onlyActive === "true";
  const list = onlyActive ? db.drivers.filter((d) => d.active) : db.drivers;
  res.json(list);
});

app.post("/api/drivers", (req, res) => {
  const { driver_name } = req.body;
  if (!driver_name || typeof driver_name !== "string") {
    return res.status(400).json({ error: "Driver name is required" });
  }
  const cleanName = driver_name.trim();
  const db = readDatabase();

  const existing = db.drivers.find(
    (d) => d.driver_name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      writeDatabase(db);
    }
    return res.json(existing);
  }

  const newDriver = {
    id: "drv-" + Date.now(),
    driver_name: cleanName,
    active: true,
    created_at: new Date().toISOString(),
  };
  db.drivers.push(newDriver);
  writeDatabase(db);
  res.status(201).json(newDriver);
});

app.put("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const { active, driver_name } = req.body;
  const db = readDatabase();
  const index = db.drivers.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Driver not found" });
  }
  if (typeof active === "boolean") {
    db.drivers[index].active = active;
  }
  if (driver_name && typeof driver_name === "string") {
    db.drivers[index].driver_name = driver_name.trim();
  }
  writeDatabase(db);
  res.json(db.drivers[index]);
});

// Trips API
app.get("/api/trips", (req, res) => {
  const db = readDatabase();
  let trips = [...db.trips];

  const { vehicleId, driverId, fromDate, toDate } = req.query;

  if (vehicleId && typeof vehicleId === "string") {
    trips = trips.filter((t) => t.vehicle_id === vehicleId);
  }
  if (driverId && typeof driverId === "string") {
    trips = trips.filter((t) => t.driver_id === driverId);
  }
  if (fromDate && typeof fromDate === "string") {
    trips = trips.filter((t) => t.trip_date >= fromDate);
  }
  if (toDate && typeof toDate === "string") {
    trips = trips.filter((t) => t.trip_date <= toDate);
  }

  // Enrich with current vehicle and driver names if missing
  const vehicleMap = new Map(db.vehicles.map((v) => [v.id, v.vehicle_number]));
  const driverMap = new Map(db.drivers.map((d) => [d.id, d.driver_name]));

  const enriched = trips.map((t) => ({
    ...t,
    vehicle_number: t.vehicle_number || vehicleMap.get(t.vehicle_id) || "Vehicle #" + (t.vehicle_id ? t.vehicle_id.slice(-4) : ""),
    driver_name: t.driver_name || driverMap.get(t.driver_id) || "Driver #" + (t.driver_id ? t.driver_id.slice(-4) : ""),
  }));

  // Sort newest first
  enriched.sort((a, b) => (b.trip_date || "").localeCompare(a.trip_date || ""));
  res.json(enriched);
});

app.post("/api/trips", (req, res) => {
  const tripData = req.body;
  if (!tripData.vehicle_id || !tripData.trip_date) {
    return res.status(400).json({ error: "Vehicle and Trip Date are required" });
  }

  const db = readDatabase();
  const adv = Number(tripData.advance_received) || 0;
  const fare = Number(tripData.trip_fare) || 0;
  const broker = Number(tripData.broker_fare) || 0;
  const haltingDays = Number(tripData.halting_days) || 0;
  const haltingChargePerDay = Number(tripData.halting_charge_per_day) || 0;
  const haltingFare =
    tripData.halting_fare !== undefined
      ? Number(tripData.halting_fare)
      : haltingDays * haltingChargePerDay;
  const beta = Number(tripData.driver_beta) || 0;
  const paidToDriver = Number(tripData.amount_paid_to_driver) || 0;

  const newTrip = {
    ...tripData,
    id: tripData.id || "trip-" + Date.now(),
    created_at: tripData.created_at || new Date().toISOString(),
    halting_days: haltingDays,
    halting_charge_per_day: haltingChargePerDay,
    halting_fare: haltingFare,
    advance_received: adv,
    advance_received_date: tripData.advance_received_date || "",
    balance_amount:
      tripData.balance_amount !== undefined
        ? Number(tripData.balance_amount)
        : fare - broker - adv + haltingFare,
    balance_received_date: tripData.balance_received_date || "",
    amount_paid_to_driver: paidToDriver,
    driver_payment_date: tripData.driver_payment_date || "",
    remaining_amount_to_driver:
      tripData.remaining_amount_to_driver !== undefined
        ? Number(tripData.remaining_amount_to_driver)
        : beta - paidToDriver,
  };

  db.trips.unshift(newTrip);
  writeDatabase(db);
  res.status(201).json(newTrip);
});

app.put("/api/trips/:id", (req, res) => {
  const { id } = req.params;
  const tripUpdate = req.body;
  const db = readDatabase();

  const index = db.trips.findIndex((t) => String(t.id).trim() === String(id).trim());
  if (index === -1) {
    return res.status(404).json({ error: "Trip not found" });
  }

  const current = db.trips[index];
  const adv =
    tripUpdate.advance_received !== undefined
      ? Number(tripUpdate.advance_received)
      : Number(current.advance_received) || 0;
  const fare =
    tripUpdate.trip_fare !== undefined
      ? Number(tripUpdate.trip_fare)
      : Number(current.trip_fare) || 0;
  const broker =
    tripUpdate.broker_fare !== undefined
      ? Number(tripUpdate.broker_fare)
      : Number(current.broker_fare) || 0;
  const haltingDays =
    tripUpdate.halting_days !== undefined
      ? Number(tripUpdate.halting_days)
      : Number(current.halting_days) || 0;
  const haltingChargePerDay =
    tripUpdate.halting_charge_per_day !== undefined
      ? Number(tripUpdate.halting_charge_per_day)
      : Number(current.halting_charge_per_day) || 0;
  const haltingFare =
    tripUpdate.halting_fare !== undefined
      ? Number(tripUpdate.halting_fare)
      : haltingDays * haltingChargePerDay;
  const beta =
    tripUpdate.driver_beta !== undefined
      ? Number(tripUpdate.driver_beta)
      : Number(current.driver_beta) || 0;
  const paidToDriver =
    tripUpdate.amount_paid_to_driver !== undefined
      ? Number(tripUpdate.amount_paid_to_driver)
      : Number(current.amount_paid_to_driver) || 0;

  db.trips[index] = {
    ...current,
    ...tripUpdate,
    halting_days: haltingDays,
    halting_charge_per_day: haltingChargePerDay,
    halting_fare: haltingFare,
    advance_received: adv,
    advance_received_date:
      tripUpdate.advance_received_date !== undefined
        ? tripUpdate.advance_received_date
        : current.advance_received_date,
    balance_amount:
      tripUpdate.balance_amount !== undefined
        ? Number(tripUpdate.balance_amount)
        : fare - broker - adv + haltingFare,
    balance_received_date:
      tripUpdate.balance_received_date !== undefined
        ? tripUpdate.balance_received_date
        : current.balance_received_date,
    amount_paid_to_driver: paidToDriver,
    driver_payment_date:
      tripUpdate.driver_payment_date !== undefined
        ? tripUpdate.driver_payment_date
        : current.driver_payment_date,
    remaining_amount_to_driver:
      tripUpdate.remaining_amount_to_driver !== undefined
        ? Number(tripUpdate.remaining_amount_to_driver)
        : beta - paidToDriver,
    updated_at: new Date().toISOString(),
  };

  writeDatabase(db);
  res.json(db.trips[index]);
});

app.delete("/api/trips/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.trips = db.trips.filter((t) => String(t.id).trim() !== String(id).trim());
  writeDatabase(db);
  res.json({ success: true, deletedId: id });
});

// Maintenance API
app.get("/api/maintenance", (req, res) => {
  const db = readDatabase();
  let list = [...db.maintenance];
  const { vehicleId, fromDate, toDate } = req.query;

  if (vehicleId && typeof vehicleId === "string") {
    list = list.filter((m) => m.vehicle_id === vehicleId);
  }
  if (fromDate && typeof fromDate === "string") {
    list = list.filter((m) => m.service_date >= fromDate);
  }
  if (toDate && typeof toDate === "string") {
    list = list.filter((m) => m.service_date <= toDate);
  }

  const vehicleMap = new Map(db.vehicles.map((v) => [v.id, v.vehicle_number]));
  const enriched = list.map((m) => ({
    ...m,
    vehicle_number: m.vehicle_number || vehicleMap.get(m.vehicle_id) || "Vehicle #" + (m.vehicle_id ? m.vehicle_id.slice(-4) : ""),
  }));

  enriched.sort((a, b) => (b.service_date || "").localeCompare(a.service_date || ""));
  res.json(enriched);
});

app.post("/api/maintenance", (req, res) => {
  const record = req.body;
  if (!record.vehicle_id || !record.service_date) {
    return res.status(400).json({ error: "Vehicle and Service Date are required" });
  }
  const db = readDatabase();
  const newRecord = {
    ...record,
    id: record.id || "maint-" + Date.now(),
    created_at: record.created_at || new Date().toISOString(),
  };
  db.maintenance.unshift(newRecord);
  writeDatabase(db);
  res.status(201).json(newRecord);
});

app.delete("/api/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const prevCount = db.maintenance.length;
  db.maintenance = db.maintenance.filter((m) => m.id !== id);
  if (db.maintenance.length === prevCount) {
    return res.status(404).json({ error: "Maintenance record not found" });
  }
  writeDatabase(db);
  res.json({ success: true, deletedId: id });
});

// Device Migration Endpoint:
// Allows devices to submit any locally saved trips so they are uploaded to the shared server DB!
app.post("/api/migrate-local", (req, res) => {
  const { trips, maintenance, vehicles, drivers } = req.body;
  const db = readDatabase();
  let addedTripsCount = 0;

  if (Array.isArray(trips)) {
    for (const t of trips) {
      if (t && t.id && !db.trips.some((existing) => existing.id === t.id)) {
        db.trips.push(t);
        addedTripsCount++;
      }
    }
  }

  if (Array.isArray(maintenance)) {
    for (const m of maintenance) {
      if (m && m.id && !db.maintenance.some((existing) => existing.id === m.id)) {
        db.maintenance.push(m);
      }
    }
  }

  if (Array.isArray(vehicles)) {
    for (const v of vehicles) {
      if (v && v.vehicle_number && !db.vehicles.some((existing) => existing.vehicle_number === v.vehicle_number)) {
        db.vehicles.push(v);
      }
    }
  }

  if (Array.isArray(drivers)) {
    for (const d of drivers) {
      if (d && d.driver_name && !db.drivers.some((existing) => existing.driver_name.toLowerCase() === d.driver_name.toLowerCase())) {
        db.drivers.push(d);
      }
    }
  }

  writeDatabase(db);
  res.json({
    success: true,
    addedTripsCount,
    totalTrips: db.trips.length,
  });
});

// Backup & Restore Endpoints
app.get("/api/backup", (_req, res) => {
  const db = readDatabase();
  res.json(db);
});

app.post("/api/restore", (req, res) => {
  const snapshot = req.body;
  if (!snapshot || typeof snapshot !== "object") {
    return res.status(400).json({ error: "Invalid backup snapshot" });
  }
  const db: LogisticsDatabase = {
    vehicles: Array.isArray(snapshot.vehicles) ? snapshot.vehicles : [],
    drivers: Array.isArray(snapshot.drivers) ? snapshot.drivers : [],
    trips: Array.isArray(snapshot.trips) ? snapshot.trips : [],
    maintenance: Array.isArray(snapshot.maintenance) ? snapshot.maintenance : [],
    last_updated: new Date().toISOString(),
  };
  writeDatabase(db);
  res.json({ success: true, message: "Database restored successfully", totalTrips: db.trips.length });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSETS
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sri Vishnu Logistics Server running on port ${PORT}`);
  });
}

startServer();
