"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "/admin";
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-4">
            <span className="text-lg font-bold text-white">W</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#111827] tracking-[-0.02em]">Welcome back</h1>
          <p className="mt-1.5 text-[14px] text-[#6B7280]">Sign in to the WanderNook admin panel</p>
        </div>

        <form
          action="/api/admin/login"
          method="POST"
          onSubmit={() => setLoading(true)}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
        >
          <input type="hidden" name="next" value={next} />
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Admin Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:border-[#111827] transition-shadow"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#DC2626]">
                Invalid password
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
