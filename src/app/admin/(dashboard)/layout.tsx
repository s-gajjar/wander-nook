import Link from "next/link";
import AdminNav from "@/src/components/Admin/AdminNav";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-30 border-b border-[#E8ECF0] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                <span className="text-[13px] font-bold text-white">W</span>
              </div>
              <span className="text-[15px] font-semibold text-[#111827] tracking-[-0.01em]">WanderNook</span>
            </Link>
            <div className="hidden md:block">
              <AdminNav />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog/new"
              className="hidden rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all sm:inline-flex"
            >
              New Blog Post
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3.5 py-2 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="border-t border-[#F3F4F6] md:hidden">
          <div className="px-4 py-2">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-5 py-8">{children}</main>
    </div>
  );
}
