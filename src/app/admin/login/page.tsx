"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const router = useRouter();

  function log(msg: string) {
    setDebug((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDebug([]);
    setLoading(true);

    log(`Submitting to /api/admin/login`);
    log(`Password length: ${password.length}`);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      log(`Response status: ${res.status}`);
      log(`Response headers:`);
      res.headers.forEach((value, key) => {
        log(`  ${key}: ${value}`);
      });

      const data = await res.json();
      log(`Response body: ${JSON.stringify(data)}`);

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      log(`✅ Login successful! Cookie should be set.`);
      
      // Check if cookie is accessible (it won't be if HttpOnly, but let's try)
      log(`document.cookie: "${document.cookie}"`);
      
      // Try hitting /api/admin/me to verify session
      log(`Verifying session with /api/admin/me...`);
      const meRes = await fetch("/api/admin/me", { credentials: "include" });
      log(`/api/admin/me status: ${meRes.status}`);
      const meData = await meRes.json().catch(() => ({}));
      log(`/api/admin/me body: ${JSON.stringify(meData)}`);

      if (meRes.ok) {
        log(`✅ Session verified! Redirecting to ${next}...`);
        setTimeout(() => {
          window.location.href = next;
        }, 1000);
      } else {
        log(`❌ Session NOT verified. Cookie not being sent back.`);
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      log(`❌ Error: ${message}`);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4">
      <div className="w-full max-w-[900px] flex gap-6">
        {/* Login Form */}
        <div className="w-[400px] flex-shrink-0">
          <div className="text-center mb-8">
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
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Admin Password
                </label>
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
                <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#DC2626]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#111827] text-white py-3 px-4 text-[15px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#1F2937] transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-[12px] text-[#9CA3AF]">
            WanderNook Admin · Secure Access
          </p>
        </div>

        {/* Debug Panel */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#1a1a2e] p-4 h-full max-h-[600px] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-mono font-bold text-green-400">🔍 Debug Console</span>
              <button
                onClick={() => setDebug([])}
                className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/10"
              >
                Clear
              </button>
            </div>
            {debug.length === 0 ? (
              <p className="text-[12px] text-gray-500 font-mono">Submit the form to see debug output...</p>
            ) : (
              <div className="space-y-1">
                {debug.map((line, i) => (
                  <p
                    key={i}
                    className={`text-[11px] font-mono leading-relaxed break-all ${
                      line.includes("✅") ? "text-green-400" :
                      line.includes("❌") ? "text-red-400" :
                      line.includes("Response status") ? "text-yellow-300" :
                      "text-gray-300"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
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
