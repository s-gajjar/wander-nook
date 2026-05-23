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
  const [done, setDone] = useState(false);
  const debugRef = useRef<HTMLDivElement>(null);

  function log(msg: string) {
    setDebug((prev) => {
      const next = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      setTimeout(() => debugRef.current?.scrollTo(0, debugRef.current.scrollHeight), 50);
      return next;
    });
  }

  function copyDebug() {
    const text = debug.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setDebug([]);
    setLoading(true);
    setDone(false);

    log(`1. Submitting POST /api/admin/login`);
    log(`   Password length: ${password.length}`);

    try {
      // Use redirect: "manual" to prevent auto-following 303
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      log(`2. Response status: ${res.status} ${res.statusText}`);
      log(`   Response type: ${res.type}`);
      log(`   Response URL: ${res.url}`);
      log(`   Redirected: ${res.redirected}`);
      
      // With redirect: "manual", a 303 becomes an "opaqueredirect" type
      if (res.type === "opaqueredirect") {
        log(`   ⚠️ Got redirect response (303). This means server treated it as form POST, not JSON.`);
        log(`   Trying again without redirect:manual...`);
        
        const res2 = await fetch("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        log(`   Second attempt status: ${res2.status}`);
        const text = await res2.text();
        log(`   Second attempt body (first 200 chars): ${text.slice(0, 200)}`);
        setLoading(false);
        setDone(true);
        return;
      }

      log(`3. Response headers:`);
      res.headers.forEach((value, key) => {
        log(`   ${key}: ${value}`);
      });

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
        log(`4. Response body: ${JSON.stringify(data)}`);
      } catch {
        const text = await res.text();
        log(`4. Response body (not JSON, first 300 chars): ${text.slice(0, 300)}`);
        setLoading(false);
        setDone(true);
        return;
      }

      if (!res.ok) {
        log(`❌ Login failed: ${data?.error || res.status}`);
        setError(String(data?.error || "Login failed"));
        setLoading(false);
        setDone(true);
        return;
      }

      log(`5. ✅ Login API returned success!`);
      log(`   document.cookie: "${document.cookie}"`);
      
      // Verify session
      log(`6. Verifying session: GET /api/admin/me`);
      const meRes = await fetch("/api/admin/me", { credentials: "include" });
      log(`   /api/admin/me status: ${meRes.status}`);
      const meData = await meRes.json().catch(() => ({}));
      log(`   /api/admin/me body: ${JSON.stringify(meData)}`);

      if (meData?.authenticated) {
        log(`7. ✅ SESSION WORKS! Cookie is being sent. You can click "Go to Admin" below.`);
      } else {
        log(`7. ❌ SESSION BROKEN. Cookie was set but NOT sent back on next request.`);
        log(`   This means Vercel/browser is not storing the cookie from the login response.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      log(`❌ Fetch error: ${message}`);
      setError(message);
    }

    setLoading(false);
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4 py-8">
      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row gap-6">
        {/* Login Form */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-4">
              <span className="text-lg font-bold text-white">W</span>
            </div>
            <h1 className="text-[24px] font-semibold text-[#111827] tracking-[-0.02em]">Welcome back</h1>
            <p className="mt-1.5 text-[14px] text-[#6B7280]">Sign in to WanderNook admin</p>
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
                {loading ? "Checking..." : "Sign in"}
              </button>

              {done && (
                <a
                  href={next}
                  className="block w-full text-center rounded-xl border-2 border-[#111827] text-[#111827] py-3 px-4 text-[15px] font-semibold hover:bg-[#111827] hover:text-white transition-colors"
                >
                  Go to Admin →
                </a>
              )}
            </div>
          </form>
        </div>

        {/* Debug Panel */}
        <div className="flex-1 min-w-0">
          <div
            ref={debugRef}
            className="rounded-2xl border border-[#E5E7EB] bg-[#0d1117] p-4 h-[500px] lg:h-[600px] overflow-auto"
          >
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#0d1117] pb-2 z-10">
              <span className="text-[13px] font-mono font-bold text-green-400">🔍 Debug Console</span>
              <div className="flex gap-2">
                <button
                  onClick={copyDebug}
                  className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  📋 Copy All
                </button>
                <button
                  onClick={() => setDebug([])}
                  className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Clear
                </button>
              </div>
            </div>
            {debug.length === 0 ? (
              <p className="text-[12px] text-gray-500 font-mono">Submit the form to see debug output...</p>
            ) : (
              <div className="space-y-0.5">
                {debug.map((line, i) => (
                  <p
                    key={i}
                    className={`text-[11px] font-mono leading-relaxed break-all ${
                      line.includes("✅") ? "text-green-400" :
                      line.includes("❌") ? "text-red-400" :
                      line.includes("⚠️") ? "text-orange-400" :
                      line.includes("status:") ? "text-yellow-300" :
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
