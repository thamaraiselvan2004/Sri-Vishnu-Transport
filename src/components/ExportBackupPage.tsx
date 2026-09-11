import React, { useState } from "react";
import {
  Download,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Info,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Trip, MaintenanceRecord, Vehicle, Driver } from "../types";
import {
  exportTripsToCSV,
  exportMaintenanceToCSV,
  exportCompleteBackupJSON,
} from "../lib/exportCsv";
import { isSupabaseConfigured } from "../lib/supabase";
import { clearAllTripsAndMaintenance } from "../lib/database";

interface ExportBackupPageProps {
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onDataCleared?: () => Promise<void>;
}

export const ExportBackupPage: React.FC<ExportBackupPageProps> = ({
  trips,
  maintenance,
  vehicles,
  drivers,
  onDataCleared,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  const handleExportTrips = () => {
    exportTripsToCSV(trips);
    setDownloadSuccess("All trips exported to CSV successfully!");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportMaintenance = () => {
    exportMaintenanceToCSV(maintenance);
    setDownloadSuccess("Maintenance records exported to CSV successfully!");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportJSON = () => {
    exportCompleteBackupJSON({
      vehicles,
      drivers,
      trips,
      maintenance,
    });
    setDownloadSuccess("Complete system JSON backup downloaded!");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllTripsAndMaintenance();
      if (onDataCleared) {
        await onDataCleared();
      }
      setShowClearConfirm(false);
      setDownloadSuccess("All existing trips and maintenance records have been cleared!");
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error("Clear error:", err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Download className="w-6 h-6" />
          </div>
          <span>Data Export &amp; Offline Backup</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Export all transport records to Microsoft Excel / Google Sheets
          compatible CSV files, or create a full JSON snapshot.
        </p>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Database Connection Notice */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            supabaseActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">
            Storage Engine:{" "}
            {supabaseActive
              ? "Supabase PostgreSQL Database (Cloud Synced)"
              : "Protected Local Browser Storage (Active & Persistent)"}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {supabaseActive
              ? "Your data is safely stored in your cloud PostgreSQL database with strict Row Level Security (RLS)."
              : "Your business trips and maintenance are currently persisted locally in this device's storage. You can connect your free Supabase project at any time by configuring VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings."}
          </p>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Trips CSV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Trips Register (CSV)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Includes route, running KMs, diesel, driver beta, freight fares, and
              net profit for all {trips.length} trips.
            </p>
          </div>
          <button
            id="export-all-trips-csv-btn"
            onClick={handleExportTrips}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Trips CSV</span>
          </button>
        </div>

        {/* Card 2: Maintenance CSV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Maintenance Register (CSV)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete log of all {maintenance.length} vehicle service and
              repair records with cost breakdown.
            </p>
          </div>
          <button
            id="export-all-maintenance-csv-btn"
            onClick={handleExportMaintenance}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Service CSV</span>
          </button>
        </div>

        {/* Card 3: Full Backup JSON */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Full System Backup
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Entire database snapshot including master vehicles, drivers,
              trips, and service history.
            </p>
          </div>
          <button
            id="export-complete-backup-btn"
            onClick={handleExportJSON}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Clear All Trips & Maintenance Records Section */}
      <div className="p-6 rounded-3xl bg-red-50/70 border border-red-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-red-950 text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Reset &amp; Clear Existing Business Data</span>
            </div>
            <p className="text-xs text-red-800/80">
              Clear all {trips.length} trip entries and {maintenance.length} service records to start completely fresh.
              Master vehicle and driver lists will remain intact.
            </p>
          </div>
          <div>
            {!showClearConfirm ? (
              <button
                id="open-clear-data-modal-btn"
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data ({trips.length} trips)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="confirm-clear-data-btn"
                  type="button"
                  disabled={isClearing}
                  onClick={handleClearAllData}
                  className="py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-sm disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isClearing ? "Clearing..." : "Yes, Permanently Clear All"}</span>
                </button>
                <button
                  id="cancel-clear-data-btn"
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excel / Google Sheets Instructions */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Opening CSV Files in Microsoft Excel or Google Sheets</span>
        </div>
        <p>
          1. The downloaded files are formatted in standard UTF-8 CSV with
          proper column headers.
        </p>
        <p>
          2. Double-click the downloaded file to open it automatically in
          Microsoft Excel, Apple Numbers, or upload it to Google Drive / Google
          Sheets.
        </p>
        <p>
          3. We recommend downloading regular weekly backups to keep local
          offline records on your laptop or phone.
        </p>
      </div>
    </div>
  );
};
