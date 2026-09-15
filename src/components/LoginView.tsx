import React, { useState } from "react";
import { Truck, Lock, Mail, KeyRound, ShieldAlert, ArrowRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { UserSession } from "../types";

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [authMethod, setAuthMethod] = useState<"pin" | "email">("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supabaseActive = isSupabaseConfigured();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Private owner PIN verification
    const validPin = "1978";
    if (pin.trim() === validPin) {
      const session: UserSession = {
        email: "owner@srivishnulogistics.com",
        role: "owner",
        name: "Sri Vishnu Logistics Owner",
      };
      localStorage.setItem("svl_auth_session", JSON.stringify(session));
      onLoginSuccess(session);
    } else {
      setErrorMessage("Incorrect PIN. Please enter the valid 4-digit business PIN.");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (supabaseActive && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const session: UserSession = {
            email: data.user.email || email,
            role: "owner",
            name: data.user.user_metadata?.full_name || "Logistics Manager",
          };
          localStorage.setItem("svl_auth_session", JSON.stringify(session));
          onLoginSuccess(session);
          return;
        }
      } else {
        if (email.includes("@") && password.length >= 4) {
          const session: UserSession = {
            email: email.trim(),
            role: "owner",
            name: "Business Owner",
          };
          localStorage.setItem("svl_auth_session", JSON.stringify(session));
          onLoginSuccess(session);
        } else {
          setErrorMessage("Please provide a valid email and at least 4-character password.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const session: UserSession = {
      email: "owner@srivishnulogistics.com",
      role: "owner",
      name: "Sri Vishnu Logistics Owner",
    };
    localStorage.setItem("svl_auth_session", JSON.stringify(session));
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20 mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sri Vishnu Logistics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Private Fleet Management &amp; Trip Recording Portal
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
            <button
              id="auth-tab-pin"
              type="button"
              onClick={() => {
                setAuthMethod("pin");
                setErrorMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                authMethod === "pin"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Quick PIN Login
            </button>
            <button
              id="auth-tab-email"
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setErrorMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                authMethod === "email"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email &amp; Password
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-sm flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authMethod === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Business Security PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="login-pin-input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg tracking-widest"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Enter your 4-digit business security PIN to access the system.
                </p>
              </div>

              <button
                id="submit-pin-login-btn"
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                <span>Unlock Logistics System</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {authMethod === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input id="login-email-input" type="email" placeholder="owner@srivishnulogistics.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input id="login-password-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                </div>
              </div>

              <button id="submit-email-login-btn" type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-base flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20">
                {isLoading ? <span>Signing In...</span> : <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button id="instant-access-btn" type="button" onClick={handleQuickDemoLogin} className="text-xs text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4">
              1-Click Owner Fast Entry (Father / Family Device)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Private &amp; Confidential. Sri Vishnu Logistics &copy; 2026.
        </p>
      </div>
    </div>
  );
};
