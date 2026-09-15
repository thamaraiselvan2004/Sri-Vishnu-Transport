-- ==============================================================================
-- SRI VISHNU LOGISTICS - SUPABASE POSTGRESQL DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Trips
-- Distance is entered directly as trip_running_kms.
-- GPS, BlackBuck and start/end odometer fields are intentionally not used.
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

  -- Halting
  halting_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
  halting_charge_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,
  halting_fare NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Advance & balance collections
  advance_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_received_date DATE,
  balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_received_date DATE,

  -- Driver settlement
  amount_paid_to_driver NUMERIC(12, 2) NOT NULL DEFAULT 0,
  driver_payment_date DATE,
  remaining_amount_to_driver NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Maintenance
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

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_date ON trips(vehicle_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance(vehicle_id, maintenance_date DESC);

-- 6. Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vehicles" ON vehicles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select drivers" ON drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert drivers" ON drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update drivers" ON drivers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select trips" ON trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trips" ON trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trips" ON trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trips" ON trips FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select maintenance" ON maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintenance" ON maintenance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintenance" ON maintenance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete maintenance" ON maintenance FOR DELETE TO authenticated USING (true);

-- 7. Seed Default Vehicles
INSERT INTO vehicles (vehicle_number, active) VALUES
  ('TN 25 AK 4061', true),
  ('TN 54 AA 4710', true),
  ('TN 88 J 1056', true),
  ('TN 04 BA 1499', true),
  ('TN 12 P 1359', true)
ON CONFLICT (vehicle_number) DO NOTHING;

-- 8. Seed Default Drivers
INSERT INTO drivers (driver_name, active) VALUES
  ('Paranthaman', true),
  ('Sivaguru', true),
  ('Silambarasan', true),
  ('Manikandan', true),
  ('Myself', true)
ON CONFLICT DO NOTHING;
