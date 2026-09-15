from pathlib import Path

# Simple, isolated UI patch. DriverReportPage.tsx is intentionally untouched.

app = Path("src/App.tsx")
s = app.read_text()

s = s.replace(
    'import { PlusCircle, Loader2, CheckCircle2 } from "lucide-react";',
    'import { PlusCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";'
)

marker = '  const [currentTab, setCurrentTab] = useState<string>("home");\n'
if 'const [tabHistory, setTabHistory]' not in s:
    if marker not in s:
        raise SystemExit("App currentTab marker not found")
    s = s.replace(marker, marker + '''  const [tabHistory, setTabHistory] = useState<string[]>([]);\n\n  const navigateTo = useCallback((tab: string) => {\n    setCurrentTab((current) => {\n      if (current !== tab) setTabHistory((history) => [...history, current]);\n      return tab;\n    });\n    window.scrollTo({ top: 0, behavior: "smooth" });\n  }, []);\n\n  const handleBack = useCallback(() => {\n    setTabHistory((history) => {\n      if (history.length === 0) return history;\n      const next = [...history];\n      const previous = next.pop()!;\n      setCurrentTab(previous);\n      if (previous !== "reports") setSelectedVehicleForReport(undefined);\n      window.scrollTo({ top: 0, behavior: "smooth" });\n      return next;\n    });\n  }, []);\n''')

old = '''        setCurrentTab={(tab) => {\n          if (tab !== "reports") setSelectedVehicleForReport(undefined);\n          setCurrentTab(tab);\n          window.scrollTo({ top: 0, behavior: "smooth" });\n        }}'''
new = '''        setCurrentTab={(tab) => {\n          if (tab !== "reports") setSelectedVehicleForReport(undefined);\n          navigateTo(tab);\n        }}'''
if old in s:
    s = s.replace(old, new)

needle = '''      </Navbar>\n\n      <main className="flex-1 pb-16">'''
repl = '''      </Navbar>\n\n      {tabHistory.length > 0 && (\n        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">\n          <button\n            id="global-back-btn"\n            type="button"\n            onClick={handleBack}\n            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm font-bold transition"\n            aria-label="Go back to previous page"\n          >\n            <ArrowLeft className="w-4 h-4" />\n            <span>Back</span>\n          </button>\n        </div>\n      )}\n\n      <main className="flex-1 pb-16">'''
if needle not in s:
    raise SystemExit("App main marker not found")
s = s.replace(needle, repl, 1)

s = s.replace(
    '''                  setSelectedVehicleForReport(vehicleId);\n                  setCurrentTab(tab);\n                  window.scrollTo({ top: 0, behavior: "smooth" });''',
    '''                  setSelectedVehicleForReport(vehicleId);\n                  navigateTo(tab);'''
)
s = s.replace('onNavigateHome={() => setCurrentTab("home")}', 'onNavigateHome={() => navigateTo("home")}')
s = s.replace(
    '''              setCurrentTab("add-trip");\n              window.scrollTo({ top: 0, behavior: "smooth" });''',
    '''              navigateTo("add-trip");'''
)
app.write_text(s)

vr = Path("src/components/VehicleReportPage.tsx")
s = vr.read_text()

if 'const finalNetProfit =' not in s:
    marker = '''  const insights = useMemo(() => {\n    return generateVehicleInsights(stats, vehicleTrips, vehicleMaintenance);\n  }, [stats, vehicleTrips, vehicleMaintenance]);'''
    if marker not in s:
        raise SystemExit("Vehicle Report insights marker not found")
    s = s.replace(
        marker,
        '''  const finalNetProfit = (Number(stats.totalTripNetProfit) || 0) + (Number(stats.totalHaltingAmount) || 0);\n\n''' + marker,
        1,
    )

if 'id="vehicle-halting-days-card"' not in s:
    heading = 'Vehicle Performance Snapshot'
    pos = s.find(heading)
    if pos < 0:
        raise SystemExit("Vehicle Performance Snapshot heading not found")
    grid_start = s.find('<div className="grid', pos)
    if grid_start < 0:
        raise SystemExit("Vehicle Performance Snapshot grid not found")
    opening_end = s.find('>', grid_start) + 1
    if opening_end <= 0:
        raise SystemExit("Vehicle Performance Snapshot grid opening not found")
    cards = '''\n            <div id="vehicle-halting-days-card" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">\n              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Halting Days</p>\n              <p className="mt-1 text-2xl font-black text-slate-900">{Number(stats.totalHaltingDays || 0).toFixed(2)}</p>\n              <p className="text-[11px] text-slate-400">Loading + Unloading</p>\n            </div>\n            <div id="vehicle-final-net-profit-card" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">\n              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Net Profit</p>\n              <p className="mt-1 text-2xl font-black text-emerald-700">{formatINR(finalNetProfit)}</p>\n              <p className="text-[11px] text-slate-400">Existing net profit + total halting</p>\n            </div>'''
    s = s[:opening_end] + cards + s[opening_end:]

vr.write_text(s)
print("Simple patch applied")
