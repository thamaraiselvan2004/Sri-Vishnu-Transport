from pathlib import Path

# 1) Driver model: store the driver-specific halting amount/day separately from vehicle halting.
p = Path('src/types.ts')
s = p.read_text()
if '  halting_amount_per_day?: number;' not in s:
    s = s.replace('  active: boolean;\n  created_at: string;\n}\n\nexport type DriverBetaType', '  active: boolean;\n  halting_amount_per_day?: number;\n  created_at: string;\n}\n\nexport type DriverBetaType', 1)
p.write_text(s)

# 2) Supabase database helper for the driver-specific amount.
p = Path('src/lib/database.ts')
s = p.read_text()
if 'updateDriverHaltingAmount' not in s:
    anchor = 'export async function updateDriverStatus(id: string, active: boolean): Promise<void> {\n  const { error } = await requireSupabase().from("drivers").update({ active }).eq("id", id);\n  if (error) throw error;\n}\n'
    addition = anchor + '\nexport async function updateDriverHaltingAmount(id: string, amountPerDay: number): Promise<void> {\n  const amount = Math.max(0, Number(amountPerDay) || 0);\n  const { error } = await requireSupabase().from("drivers").update({ halting_amount_per_day: amount }).eq("id", id);\n  if (error) throw error;\n}\n'
    if anchor not in s:
        raise SystemExit('database driver status anchor not found')
    s = s.replace(anchor, addition, 1)
p.write_text(s)

# 3) Driver calculations: existing beta remains ONLY the existing trip beta.
#    The report UI adds driver-specific halting separately: days * manually entered amount/day.
p = Path('src/lib/calculations.ts')
s = p.read_text()
s = s.replace('    const haltingAmount = (Number(t.loading_halting_fare) || 0) + (Number(t.unloading_halting_fare) || 0) || (Number(t.halting_fare) || 0);\n', '', 1)
s = s.replace('    overallDriverBeta += beta + haltingAmount;\n', '    overallDriverBeta += beta;\n', 1)
p.write_text(s)

# 4) Driver report UI: add manual Halting Amount / per and Overall Halting Amount
#    inside Performance & Settlement Summary, then add the amount to Overall Driver Beta.
p = Path('src/components/DriverReportPage.tsx')
s = p.read_text()

s = s.replace('import React, { useState, useMemo } from "react";', 'import React, { useState, useMemo, useEffect } from "react";', 1)
s = s.replace('import { HaltingDetailsModal } from "./HaltingDetailsModal";\n', 'import { HaltingDetailsModal } from "./HaltingDetailsModal";\nimport { updateDriverHaltingAmount } from "../lib/database";\n', 1)

if 'const [haltingAmountPerDay, setHaltingAmountPerDay]' not in s:
    anchor = '  const [showOtherExpenseDetails, setShowOtherExpenseDetails] = useState(false);\n'
    addition = anchor + '  const [haltingAmountPerDay, setHaltingAmountPerDay] = useState(0);\n  const [savingHaltingAmount, setSavingHaltingAmount] = useState(false);\n\n  useEffect(() => {\n    setHaltingAmountPerDay(Number(selectedDriver?.halting_amount_per_day) || 0);\n  }, [selectedDriverId, selectedDriver?.halting_amount_per_day]);\n'
    if anchor not in s:
        raise SystemExit('driver modal state anchor not found')
    s = s.replace(anchor, addition, 1)

if 'const overallHaltingAmount = useMemo' not in s:
    anchor = '  const selectedDriverName = selectedDriver?.driver_name || "";\n'
    addition = anchor + '\n  const overallHaltingAmount = useMemo(() => {\n    return Math.max(0, Number(stats.overallHaltingDays) || 0) * Math.max(0, Number(haltingAmountPerDay) || 0);\n  }, [stats.overallHaltingDays, haltingAmountPerDay]);\n\n  const adjustedOverallDriverBeta = (Number(stats.overallDriverBeta) || 0) + overallHaltingAmount;\n\n  const saveHaltingAmountPerDay = async () => {\n    if (!selectedDriverId) return;\n    setSavingHaltingAmount(true);\n    try {\n      await updateDriverHaltingAmount(selectedDriverId, haltingAmountPerDay);\n    } catch (error) {\n      console.error("Failed to save driver halting amount/day", error);\n      alert("Could not save the driver halting amount. Please check your database setup.");\n    } finally {\n      setSavingHaltingAmount(false);\n    }\n  };\n'
    if anchor not in s:
        raise SystemExit('driver name anchor not found')
    s = s.replace(anchor, addition, 1)

# Replace the existing Overall Driver Beta card value with the adjusted value.
s = s.replace('{formatINR(stats.overallDriverBeta)}', '{formatINR(adjustedOverallDriverBeta)}', 1)
s = s.replace('Total trip allowances earned (15% or manual)', 'Existing driver beta + overall halting amount', 1)

# Add the two requested fields immediately before the Overall Driver Beta card.
if 'id="driver-halting-amount-per-day"' not in s:
    anchor = '          {/* 2. Overall Driver Beta */}'
    block = '''          {/* Driver-specific halting amount fields */}\n          <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs hover:shadow-sm transition">\n            <div className="flex items-center justify-between text-slate-500">\n              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">Halting Amount / per</span>\n              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><IndianRupee className="w-4 h-4" /></div>\n            </div>\n            <div className="flex items-center gap-2 mt-3">\n              <span className="text-lg font-black text-slate-600">₹</span>\n              <input\n                id="driver-halting-amount-per-day"\n                type="number"\n                min="0"\n                step="0.01"\n                value={haltingAmountPerDay}\n                onChange={(e) => setHaltingAmountPerDay(Math.max(0, Number(e.target.value) || 0))}\n                onBlur={saveHaltingAmountPerDay}\n                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-black font-mono text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"\n                placeholder="Enter amount/day"\n              />\n            </div>\n            <div className="text-[11px] text-slate-500 mt-2">Driver-specific amount. Saved per driver.</div>\n            {savingHaltingAmount && <div className="text-[10px] text-purple-600 mt-1 font-semibold">Saving...</div>}\n          </div>\n\n          <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs hover:shadow-sm transition">\n            <div className="flex items-center justify-between text-slate-500">\n              <span className="text-xs font-bold uppercase tracking-wide text-purple-900">Overall Halting Amount</span>\n              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Clock className="w-4 h-4" /></div>\n            </div>\n            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-800 mt-2">{formatINR(overallHaltingAmount)}</div>\n            <div className="text-xs text-slate-500 mt-1">{stats.overallHaltingDays} days × {formatINR(haltingAmountPerDay)} / day</div>\n          </div>\n\n'''
    if anchor not in s:
        raise SystemExit('driver beta card anchor not found')
    s = s.replace(anchor, block + anchor, 1)

# Use adjusted beta for settlement progress and its percentage/remaining display.
s = s.replace('formatINR(stats.overallDriverBeta)} total beta', 'formatINR(adjustedOverallDriverBeta)} total beta', 1)
s = s.replace('(stats.overallAmountPaidToDriver / stats.overallDriverBeta) * 100', '(stats.overallAmountPaidToDriver / adjustedOverallDriverBeta) * 100')
s = s.replace('stats.overallDriverBeta > 0', 'adjustedOverallDriverBeta > 0')
s = s.replace('stats.overallDriverBeta', 'stats.overallDriverBeta', 0)  # intentional no-op; keeps source stable

# Export summary should expose the driver-specific halting values and adjusted beta.
s = s.replace('["Overall Halting Days", stats.overallHaltingDays],\n      ["Overall Driver Beta (Rs)", stats.overallDriverBeta],', '["Overall Halting Days", stats.overallHaltingDays],\n      ["Halting Amount / per (Rs)", haltingAmountPerDay],\n      ["Overall Halting Amount (Rs)", overallHaltingAmount],\n      ["Overall Driver Beta (Rs)", adjustedOverallDriverBeta],', 1)
p.write_text(s)

# 5) Keep the repository schema/documentation aligned with the live migration.
p = Path('supabase_schema.sql')
s = p.read_text()
if '  halting_amount_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,' not in s:
    s = s.replace('  active BOOLEAN NOT NULL DEFAULT true,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone(\'utc\'::text, now())\n);', '  active BOOLEAN NOT NULL DEFAULT true,\n  halting_amount_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone(\'utc\'::text, now())\n);', 1)
p.write_text(s)

print('DRIVER_HALTING_AMOUNT_PATCH_OK')
