import Image from "next/image";
import Link from "next/link";
import AdminNav from "@/src/components/Admin/AdminNav";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-30 border-b border-[#E8ECF0] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-5 py-3">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/wander-stamps-logo.png"
                alt="WanderNook"
                width={28}
                height={28}
                className="rounded-full sm:w-8 sm:h-8"
              />
              <span className="text-[14px] sm:text-[15px] font-semibold text-[#111827] tracking-[-0.01em] hidden sm:inline">WanderNook</span>
            </Link>
            <div className="hidden md:block">
              <AdminNav />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-1.5 sm:px-3.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="border-t border-[#F3F4F6] md:hidden">
          <div className="px-3 py-2 overflow-x-auto scrollbar-none">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-5 py-5 sm:py-8">{children}</main>
    </div>
  );
}
