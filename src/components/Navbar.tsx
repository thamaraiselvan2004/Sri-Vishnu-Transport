import React, { useState } from "react";
import {
  Truck,
  PlusCircle,
  BarChart3,
  Wrench,
  Users,
  Download,
  LogOut,
  Menu,
  X,
  Database,
  Home,
  ShieldCheck,
} from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  userEmail: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onLogout,
  userEmail,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "add-trip", label: "Add Trip", icon: PlusCircle },
    { id: "reports", label: "Report Analysis", icon: BarChart3 },
    { id: "service", label: "Service Maintenance", icon: Wrench },
    { id: "drivers-vehicles", label: "Fleet & Drivers", icon: Users },
    { id: "export", label: "Backup & Export", icon: Download },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => handleNavClick("home")}
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-400/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sri Vishnu Logistics
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <ShieldCheck className="w-3 h-3" /> Private Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Fleet Management &amp; Analytics
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Status & Logout */}
          <div className="hidden sm:flex items-center space-x-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-xs"
              title="Live Central Database Connected - All trips and fleet records are synchronized across all your devices in real-time."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3.5 h-3.5" />
              <span>Multi-Device Cloud Sync Active</span>
            </div>

            <button
              id="logout-btn-desktop"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
              title={`Logged in as ${userEmail}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 text-blue-400" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 truncate max-w-[200px]">
              {userEmail}
            </span>
            <button
              id="mobile-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/60"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
