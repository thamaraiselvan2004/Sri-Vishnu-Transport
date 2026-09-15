-- ==============================================================================
-- SRI VISHNU LOGISTICS - SUPABASE POSTGRESQL DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  halting_amount_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  transporter_name TEXT NOT NULL,
  trip_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,
  broker_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,
  driver_beta NUMERIC(12, 2) NOT NULL DEFAULT 0,
  driver_beta_type TEXT NOT NULL DEFAULT 'percentage',
  from_state TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_state TEXT NOT NULL,
  to_city TEXT NOT NULL,
  trip_running_kms NUMERIC(12, 2) NOT NULL DEFAULT 0,
  toll_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
  diesel_expense NUMERIC(12, 2) NOT NULL DEFAULT 0,
  diesel_litres NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mileage NUMERIC(6, 2) NOT NULL DEFAULT 0,
  loading_expense NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unloading_expense NUMERIC(12, 2) NOT NULL DEFAULT 0,
  other_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Existing combined halting values retained for compatibility.
  halting_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  halting_charge_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
  halting_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Separate loading and unloading halting.
  loading_halting_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  loading_halting_charge_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
  loading_halting_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unloading_halting_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unloading_halting_charge_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unloading_halting_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,

  advance_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_received_date DATE,
  balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_received_date DATE,
  amount_paid_to_driver NUMERIC(12, 2) NOT NULL DEFAULT 0,
  driver_payment_date DATE,
  remaining_amount_to_driver NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading NUMERIC(12, 2) NOT NULL DEFAULT 0,
  service_type TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Manual mileage is intentionally separate from trips so the existing trip mileage calculation is untouched.
CREATE TABLE IF NOT EXISTS manual_mileage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_number INTEGER NOT NULL,
  starting_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ending_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0,
  diesel_litres NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mileage NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_date ON trips(vehicle_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance(vehicle_id, maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_manual_mileage_vehicle_id ON manual_mileage(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_manual_mileage_vehicle_trip ON manual_mileage(vehicle_id, trip_number);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_mileage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can select drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can select trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can insert trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can update trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can delete trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can select maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can insert maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can update maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can delete maintenance" ON maintenance;

CREATE POLICY vehicles_anon_select ON vehicles FOR SELECT TO anon USING (true);
CREATE POLICY vehicles_anon_insert ON vehicles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY vehicles_anon_update ON vehicles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY drivers_anon_select ON drivers FOR SELECT TO anon USING (true);
CREATE POLICY drivers_anon_insert ON drivers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY drivers_anon_update ON drivers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY trips_anon_select ON trips FOR SELECT TO anon USING (true);
CREATE POLICY trips_anon_insert ON trips FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY trips_anon_update ON trips FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY trips_anon_delete ON trips FOR DELETE TO anon USING (true);
CREATE POLICY maintenance_anon_select ON maintenance FOR SELECT TO anon USING (true);
CREATE POLICY maintenance_anon_insert ON maintenance FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY maintenance_anon_update ON maintenance FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY maintenance_anon_delete ON maintenance FOR DELETE TO anon USING (true);
CREATE POLICY manual_mileage_anon_select ON manual_mileage FOR SELECT TO anon USING (true);
CREATE POLICY manual_mileage_anon_insert ON manual_mileage FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY manual_mileage_anon_update ON manual_mileage FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY manual_mileage_anon_delete ON manual_mileage FOR DELETE TO anon USING (true);

INSERT INTO vehicles (vehicle_number, active) VALUES
  ('TN 25 AK 4061', true),
  ('TN 54 AA 4710', true),
  ('TN 88 J 1056', true),
  ('TN 04 BA 1499', true),
  ('TN 12 P 1359', true)
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO drivers (driver_name, active) VALUES
  ('Paranthaman', true),
  ('Sivaguru', true),
  ('Silambarasan', true),
  ('Manikandan', true),
  ('Myself', true)
ON CONFLICT DO NOTHING;
