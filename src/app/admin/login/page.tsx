"use client";

import { Suspense, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [done, setDone] = useState(false);
  const debugRef = useRef<HTMLDivElement>(null);

  function log(msg: string) {
    setDebug((prev) => [...prev, msg]);
  }

  function copyDebug() {
    navigator.clipboard.writeText(debug.join("\n")).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDebug([]);
    setLoading(true);
    setShowDebug(true);
    setDone(false);

    try {
      log("1. POST /api/admin/login");
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      log(`   Status: ${res.status} | Body: ${JSON.stringify(data)}`);

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      log("2. GET /api/admin/me (req.cookies check)");
      const meRes = await fetch("/api/admin/me", { credentials: "include" });
      const meData = await meRes.json();
      log(`   ${JSON.stringify(meData)}`);

      log("3. GET /api/admin/debug-cookies (next/headers cookies() check)");
      const dbgRes = await fetch("/api/admin/debug-cookies", { credentials: "include" });
      const dbgData = await dbgRes.json();
      log(`   ${JSON.stringify(dbgData)}`);

      if (dbgData.wouldRedirect) {
        log("❌ LAYOUT WOULD REDIRECT - cookies() doesn't see admin_session");
      } else {
        log("✅ LAYOUT WOULD PASS - safe to navigate");
      }

      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      log(`❌ Error: ${message}`);
      setError(message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4 py-8">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-4">
            <span className="text-lg font-bold text-white">W</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#111827] tracking-[-0.02em]">Welcome back</h1>
          <p className="mt-1.5 text-[14px] text-[#6B7280]">Sign in to the WanderNook admin panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] transition-shadow"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#DC2626]">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#111827] text-white py-3 px-4 text-[15px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#1F2937] transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Sign in"}
            </button>

            {done && (
              <div className="space-y-2">
                <a
                  href="/admin/test"
                  className="block w-full text-center rounded-xl bg-green-600 text-white py-3 px-4 text-[15px] font-semibold hover:bg-green-700 transition-colors"
                >
                  Test Admin (simple page) →
                </a>
                <a
                  href={next}
                  className="block w-full text-center rounded-xl border-2 border-[#111827] text-[#111827] py-3 px-4 text-[15px] font-semibold hover:bg-[#111827] hover:text-white transition-colors"
                >
                  Full Dashboard →
                </a>
              </div>
            )}
          </div>
        </form>

        {/* Debug output */}
        {showDebug && (
          <div ref={debugRef} className="rounded-2xl bg-[#0d1117] p-4 max-h-[300px] overflow-auto">
            <div className="flex justify-between mb-2">
              <span className="text-[12px] font-mono text-green-400 font-bold">Debug</span>
              <button onClick={copyDebug} className="text-[11px] text-gray-400 hover:text-white bg-white/10 px-2 py-0.5 rounded">
                📋 Copy
              </button>
            </div>
            {debug.map((line, i) => (
              <p key={i} className={`text-[11px] font-mono break-all leading-relaxed ${
                line.includes("✅") ? "text-green-400" : line.includes("❌") ? "text-red-400" : "text-gray-300"
              }`}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
