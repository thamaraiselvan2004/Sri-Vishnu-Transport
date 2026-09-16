import React, { useState, useEffect, useCallback } from "react";
import { UserSession, Vehicle, Driver, Trip, MaintenanceRecord } from "./types";
import {
  getVehicles,
  getDrivers,
  getTrips,
  getMaintenanceRecords,
  deleteTrip,
  updateTrip,
} from "./lib/database";
import { LoginView } from "./components/LoginView";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./components/HomePage";
import { AddTripPage } from "./components/AddTripPage";
import { ReportAnalysisContainer } from "./components/ReportAnalysisContainer";
import { MileageStatusPage } from "./components/MileageStatusPage";
import { VehicleMonthlyProfitReport } from "./components/VehicleMonthlyProfitReport";
import { ServiceMaintenancePage } from "./components/ServiceMaintenancePage";
import { FleetManagementPage } from "./components/FleetManagementPage";
import { ExportBackupPage } from "./components/ExportBackupPage";
import { ArrowLeft, PlusCircle, Loader2, CheckCircle2 } from "lucide-react";

export function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("svl_auth_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>("home");
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [selectedVehicleForReport, setSelectedVehicleForReport] = useState<string | undefined>(undefined);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [vData, dData, tData, mData] = await Promise.all([
        getVehicles(),
        getDrivers(),
        getTrips(),
        getMaintenanceRecords(),
      ]);
      setVehicles(vData);
      setDrivers(dData);
      setTrips(tData);
      setMaintenance(mData);
    } catch (err) {
      console.error("Error loading application data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSilent = useCallback(async () => {
    try {
      const [vData, dData, tData, mData] = await Promise.all([
        getVehicles(),
        getDrivers(),
        getTrips(),
        getMaintenanceRecords(),
      ]);
      setVehicles(vData);
      setDrivers(dData);
      setTrips(tData);
      setMaintenance(mData);
    } catch (err) {
      console.warn("Silent multi-device sync notice:", err);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    loadData();
    const pollTimer = setInterval(() => refreshSilent(), 8000);
    const onFocus = () => refreshSilent();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshSilent();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [session, loadData, refreshSilent]);

  const navigateTo = useCallback((tab: string, vehicleId?: string) => {
    if (tab === "home") {
      setTabHistory([]);
      setSelectedVehicleForReport(undefined);
      setCurrentTab("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCurrentTab((current) => {
      if (current !== tab) setTabHistory((history) => [...history, current]);
      return tab;
    });
    setSelectedVehicleForReport(vehicleId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!session || currentTab !== "reports") return;

    const handleVehicleCardClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>('[id^="vehicle-card-"]');
      if (!card) return;

      const vehicleId = card.id.replace("vehicle-card-", "");
      if (vehicleId) setSelectedVehicleForReport(vehicleId);
    };

    document.addEventListener("click", handleVehicleCardClick);
    return () => document.removeEventListener("click", handleVehicleCardClick);
  }, [session, currentTab]);

  const handleBack = useCallback(() => {
    if (selectedVehicleForReport) {
      setSelectedVehicleForReport(undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setTabHistory((history) => {
      if (history.length === 0) return history;
      const next = [...history];
      const previous = next.pop()!;
      setCurrentTab(previous);
      setSelectedVehicleForReport(undefined);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return next;
    });
  }, [selectedVehicleForReport]);

  const handleLogout = () => {
    localStorage.removeItem("svl_auth_session");
    setSession(null);
    setCurrentTab("home");
    setTabHistory([]);
    setSelectedVehicleForReport(undefined);
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteTrip(id);
    await loadData();
  };

  const handleUpdateTrip = async (id: string, tripData: Partial<Trip>) => {
    await updateTrip(id, tripData);
    await loadData();
    showToast("Updated sucessfuly");
  };

  const handleTripAdded = async () => {
    await loadData();
    showToast("Trip saved sucessfully");
  };

  if (!session) {
    return <LoginView onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const showBackButton = currentTab !== "home" && (tabHistory.length > 0 || !!selectedVehicleForReport);

  const selectedVehicle = selectedVehicleForReport
    ? vehicles.find((v) => v.id === selectedVehicleForReport)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== "reports") setSelectedVehicleForReport(undefined);
          navigateTo(tab);
        }}
        onLogout={handleLogout}
        userEmail={session.email}
      />

      {showBackButton && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <button
            id="global-back-btn"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm font-bold transition"
            aria-label={selectedVehicleForReport ? "Back to report analysis" : "Go back to previous page"}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      )}

      <main className="flex-1 pb-16">
        {isLoading && trips.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading Sri Vishnu Logistics records...</p>
          </div>
        ) : (
          <>
            {currentTab === "home" && (
              <HomePage
                trips={trips}
                vehicles={vehicles}
                drivers={drivers}
                maintenance={maintenance}
                onUpdateTrip={handleUpdateTrip}
                onNavigate={(tab, vehicleId) => navigateTo(tab, vehicleId)}
              />
            )}

            {currentTab === "add-trip" && (
              <AddTripPage
                vehicles={vehicles}
                drivers={drivers}
                onTripAdded={handleTripAdded}
                onNavigateHome={() => navigateTo("home")}
                onRefreshMasterData={loadData}
              />
            )}

            {currentTab === "reports" && (
              <>
                <ReportAnalysisContainer
                  key={selectedVehicleForReport || "report-analysis-list"}
                  vehicles={vehicles}
                  drivers={drivers}
                  trips={trips}
                  maintenance={maintenance}
                  initialVehicleId={selectedVehicleForReport}
                  onDeleteTrip={handleDeleteTrip}
                  onUpdateTrip={handleUpdateTrip}
                />
                {selectedVehicle && (
                  <VehicleMonthlyProfitReport
                    vehicle={selectedVehicle}
                    trips={trips}
                    maintenance={maintenance}
                  />
                )}
                {selectedVehicleForReport && (
                  <MileageStatusPage
                    vehicles={vehicles}
                    onNavigateHome={handleBack}
                  />
                )}
              </>
            )}

            {currentTab === "mileage-status" && (
              <MileageStatusPage
                vehicles={vehicles}
                onNavigateHome={() => navigateTo("home")}
              />
            )}

            {currentTab === "service" && (
              <ServiceMaintenancePage
                vehicles={vehicles}
                maintenanceRecords={maintenance}
                onMaintenanceUpdated={loadData}
              />
            )}

            {currentTab === "drivers-vehicles" && (
              <FleetManagementPage
                vehicles={vehicles}
                drivers={drivers}
                trips={trips}
                onRefreshData={loadData}
              />
            )}

            {currentTab === "export" && (
              <ExportBackupPage
                trips={trips}
                maintenance={maintenance}
                vehicles={vehicles}
                drivers={drivers}
                onDataCleared={loadData}
              />
            )}
          </>
        )}
      </main>

      {toastMessage && (
        <div id="global-toast-notification" className="fixed bottom-6 right-6 z-50 animate-bounce duration-300 max-w-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-500/80">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{toastMessage}</p>
              <p className="text-[11px] text-emerald-400">All calculations updated</p>
            </div>
          </div>
        </div>
      )}

      {currentTab !== "add-trip" && (
        <div className="sm:hidden fixed bottom-6 right-6 z-30">
          <button
            id="fab-add-trip-btn"
            onClick={() => navigateTo("add-trip")}
            className="w-14 h-14 rounded-full bg-blue-600 active:bg-blue-700 text-white shadow-xl shadow-blue-600/40 flex items-center justify-center ring-4 ring-blue-400/20"
            aria-label="Add Trip Quick Button"
          >
            <PlusCircle className="w-7 h-7" />
          </button>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">Sri Vishnu Logistics &mdash; Private Fleet Management Portal</p>
          <p className="mt-1 text-slate-400">Designed for mobile &amp; desktop &bull; 15% Automated Driver Beta &bull; Vehicle-wise Analytics &bull; &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
