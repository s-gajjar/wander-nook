import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Newsletter Subscribers</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">Active newsletter subscribers.</p>
      </div>

      <section className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">Active Subscribers</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{subscribers.length} active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Source</th>
                <th className="px-5 py-2.5 font-medium">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-[#9CA3AF]">
                    No active subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#111827]">{s.email}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{s.name || "-"}</td>
                    <td className="px-5 py-3.5">
                      {s.source ? (
                        <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                          {s.source}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#9CA3AF]">{formatDate(s.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
