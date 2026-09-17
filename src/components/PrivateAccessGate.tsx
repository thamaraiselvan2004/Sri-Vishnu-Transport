import React, { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

interface PrivateAccessGateProps {
  children: React.ReactNode;
}

const ACCESS_KEY = "sri-vishnu-private-access";
const PASSWORD_HASH = "46635b56d3c7f0b7bb26adae2a1692debbfd145d4a0986a9137fe91e73e70360";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const PrivateAccessGate: React.FC<PrivateAccessGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(ACCESS_KEY) === "1");
    setChecking(false);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const hash = await sha256(password);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(ACCESS_KEY, "1");
        setUnlocked(true);
        setPassword("");
      } else {
        setError("Incorrect private password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Unable to verify the password. Please try again.");
    }
  };

  if (checking) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-7 sm:p-9">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/20">
          <LockKeyhole className="w-8 h-8" />
        </div>

        <div className="text-center mt-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Private Access</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Enter the private password to access Sri Vishnu Transport.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label htmlFor="private-access-password" className="block text-sm font-semibold text-slate-700">
            Private Password
          </label>
          <input
            id="private-access-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="Enter private password"
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3.5 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
          />

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 transition shadow-md shadow-violet-600/20 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Unlock Website
          </button>
        </form>
      </div>
    </div>
  );
};
