from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}")
    p.write_text(text.replace(old, new, 1))


# database.ts: add persistent Supabase CRUD for the new standalone mileage feature.
replace_once(
    "src/lib/database.ts",
    "export async function deleteManualMileageRecord(id: string): Promise<void> {\n  const { error } = await requireSupabase().from(\"manual_mileage\").delete().eq(\"id\", id);\n  if (error) throw error;\n}\n",
    """export async function deleteManualMileageRecord(id: string): Promise<void> {\n  const { error } = await requireSupabase().from(\"manual_mileage\").delete().eq(\"id\", id);\n  if (error) throw error;\n}\n\nexport async function getMileageStatusRecords(vehicleId?: string): Promise<MileageStatusRecord[]> {\n  const client = requireSupabase();\n  let query = client.from(\"mileage_status\").select(\"*\").order(\"starting_datetime\", { ascending: false });\n  if (vehicleId) query = query.eq(\"vehicle_id\", vehicleId);\n  const { data, error } = await query;\n  if (error) throw error;\n  const vehicles = await getVehicles();\n  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicle_number]));\n  return ((data ?? []) as MileageStatusRecord[]).map((r) => ({\n    ...r,\n    starting_odometer: Number(r.starting_odometer) || 0,\n    ending_odometer: Number(r.ending_odometer) || 0,\n    diesel_litres: Number(r.diesel_litres) || 0,\n    mileage: Number(r.mileage) || 0,\n    vehicle_number: vehicleMap.get(r.vehicle_id) ?? r.vehicle_number,\n  }));\n}\n\nexport async function addMileageStatusRecord(data: Omit<MileageStatusRecord, \"id\" | \"created_at\" | \"vehicle_number\">): Promise<MileageStatusRecord> {\n  const client = requireSupabase();\n  const payload = {\n    ...data,\n    starting_odometer: Number(data.starting_odometer) || 0,\n    ending_odometer: Number(data.ending_odometer) || 0,\n    diesel_litres: Number(data.diesel_litres) || 0,\n    mileage: Number(data.mileage) || 0,\n  };\n  const { data: row, error } = await client.from(\"mileage_status\").insert(payload).select().single();\n  if (error) throw error;\n  const vehicles = await getVehicles();\n  return { ...(row as MileageStatusRecord), vehicle_number: vehicles.find((v) => v.id === data.vehicle_id)?.vehicle_number };\n}\n\nexport async function deleteMileageStatusRecord(id: string): Promise<void> {\n  const { error } = await requireSupabase().from(\"mileage_status\").delete().eq(\"id\", id);\n  if (error) throw error;\n}\n"""
)

# App.tsx: add the new home action and route without touching reports or driver-report code.
replace_once(
    "src/App.tsx",
    'import { ManualMileageSection } from "./components/ManualMileageSection";\n',
    'import { ManualMileageSection } from "./components/ManualMileageSection";\nimport { MileageStatusHomeCard } from "./components/MileageStatusHomeCard";\nimport { MileageStatusPage } from "./components/MileageStatusPage";\n'
)

replace_once(
    "src/App.tsx",
    '''            {currentTab === "home" && (\n              <HomePage\n                trips={trips}\n                vehicles={vehicles}\n                drivers={drivers}\n                maintenance={maintenance}\n                onUpdateTrip={handleUpdateTrip}\n                onNavigate={(tab, vehicleId) => {\n                  setSelectedVehicleForReport(vehicleId);\n                  setCurrentTab(tab);\n                  window.scrollTo({ top: 0, behavior: "smooth" });\n                }}\n              />\n            )}\n''',
    '''            {currentTab === "home" && (\n              <>\n                <HomePage\n                  trips={trips}\n                  vehicles={vehicles}\n                  drivers={drivers}\n                  maintenance={maintenance}\n                  onUpdateTrip={handleUpdateTrip}\n                  onNavigate={(tab, vehicleId) => {\n                    setSelectedVehicleForReport(vehicleId);\n                    setCurrentTab(tab);\n                    window.scrollTo({ top: 0, behavior: "smooth" });\n                  }}\n                />\n                <MileageStatusHomeCard onNavigate={() => { setCurrentTab("mileage-status"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />\n              </>\n            )}\n'''
)

replace_once(
    "src/App.tsx",
    '''            {currentTab === "service" && (\n''',
    '''            {currentTab === "mileage-status" && (\n              <MileageStatusPage\n                vehicles={vehicles}\n                onNavigateHome={() => { setCurrentTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}\n              />\n            )}\n\n            {currentTab === "service" && (\n'''
)

# supabase_schema.sql: define the new independent table and anon policies.
replace_once(
    "supabase_schema.sql",
    '''CREATE TABLE IF NOT EXISTS maintenance (\n''',
    '''CREATE TABLE IF NOT EXISTS mileage_status (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,\n  starting_datetime TIMESTAMPTZ NOT NULL,\n  ending_datetime TIMESTAMPTZ NOT NULL,\n  starting_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0,\n  ending_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0,\n  diesel_litres NUMERIC(12, 2) NOT NULL DEFAULT 0,\n  mileage NUMERIC(10, 2) NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n);\n\nCREATE TABLE IF NOT EXISTS maintenance (\n'''
)
replace_once(
    "supabase_schema.sql",
    'CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance(vehicle_id, maintenance_date DESC);\n',
    'CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance(vehicle_id, maintenance_date DESC);\nCREATE INDEX IF NOT EXISTS idx_mileage_status_vehicle_start ON mileage_status(vehicle_id, starting_datetime DESC);\n'
)
replace_once(
    "supabase_schema.sql",
    'ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;\n',
    'ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;\nALTER TABLE mileage_status ENABLE ROW LEVEL SECURITY;\n'
)
replace_once(
    "supabase_schema.sql",
    'CREATE POLICY maintenance_anon_select ON maintenance FOR SELECT TO anon USING (true);\n',
    'CREATE POLICY mileage_status_anon_select ON mileage_status FOR SELECT TO anon USING (true);\nCREATE POLICY mileage_status_anon_insert ON mileage_status FOR INSERT TO anon WITH CHECK (true);\nCREATE POLICY mileage_status_anon_update ON mileage_status FOR UPDATE TO anon USING (true) WITH CHECK (true);\nCREATE POLICY mileage_status_anon_delete ON mileage_status FOR DELETE TO anon USING (true);\nCREATE POLICY maintenance_anon_select ON maintenance FOR SELECT TO anon USING (true);\n'
)
