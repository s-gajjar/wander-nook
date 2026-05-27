import { prisma } from "@/src/lib/prisma";
import ReplayAutopayForm from "@/src/components/Admin/ReplayAutopayForm";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getMetadataRecord(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  return metadata as Record<string, unknown>;
}

function getMetadataText(metadata: unknown, keys: string[]) {
  const record = getMetadataRecord(metadata);
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      if (normalized) return normalized;
    }
  }
  return "";
}

export default async function AdminEventsPage() {
  const events = await prisma.conversionEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const leads = Array.from(
    events
      .reduce<
        Map<string, {
          key: string;
          name: string;
          email: string;
          phone: string;
          plan: string;
          latestEvent: string;
          createdAt: Date;
        }>
      >((map, event) => {
        const email = (event.customerEmail || getMetadataText(event.metadata, ["customer_email"])).toLowerCase();
        const phone = getMetadataText(event.metadata, ["customer_phone", "customerPhone"]);
        const name = getMetadataText(event.metadata, ["customer_name", "customerName"]);
        const plan = event.planId || getMetadataText(event.metadata, ["plan_id"]);
        const key = phone || email;
        if (!key || map.has(key)) return map;
        map.set(key, { key, name: name || "-", email: email || "-", phone: phone || "-", plan: plan || "-", latestEvent: event.eventName, createdAt: event.createdAt });
        return map;
      }, new Map())
      .values()
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111827] tracking-[-0.02em]">Conversion Events</h1>
        <p className="mt-1 text-[13px] sm:text-[14px] text-[#6B7280]">Payment funnel, webhook events, and lead contacts.</p>
      </div>

      <ReplayAutopayForm />

      {/* Leads — desktop table */}
      <section className="hidden md:block rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">Lead Contacts</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{leads.length} leads</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Phone</th>
                <th className="px-5 py-2.5 font-medium">Plan</th>
                <th className="px-5 py-2.5 font-medium">Latest Event</th>
                <th className="px-5 py-2.5 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.key} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#111827]">{lead.name}</td>
                  <td className="px-5 py-3 text-[#6B7280]">{lead.email}</td>
                  <td className="px-5 py-3 text-[#6B7280] tabular-nums">{lead.phone}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">{lead.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[11px] font-medium">{lead.latestEvent}</span>
                  </td>
                  <td className="px-5 py-3 text-[#9CA3AF]">{formatDateTime(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leads — mobile cards */}
      <section className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#111827]">Lead Contacts</h2>
          <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{leads.length}</span>
        </div>
        {leads.slice(0, 50).map((lead) => (
          <div key={lead.key} className="rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#111827] truncate">{lead.name}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{lead.email}</p>
              </div>
              <span className="inline-flex rounded-full bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 text-[10px] font-medium shrink-0">
                {lead.latestEvent}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6B7280]">
              <span className="tabular-nums">{lead.phone}</span>
              <span className="inline-flex rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#374151]">{lead.plan}</span>
              <span className="ml-auto text-[#9CA3AF]">{formatDateTime(lead.createdAt)}</span>
            </div>
          </div>
        ))}
      </section>

      {/* All events — desktop table */}
      <section className="hidden md:block rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">All Events</h2>
          <span className="text-[12px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{events.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC] text-left text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">
                <th className="px-5 py-2.5 font-medium">Event</th>
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Phone</th>
                <th className="px-5 py-2.5 font-medium">Plan</th>
                <th className="px-5 py-2.5 font-medium">Payment</th>
                <th className="px-5 py-2.5 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-[#F9FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-[#F3F4F6] text-[#374151] px-2 py-0.5 text-[11px] font-medium">
                      {event.eventName}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-[#111827]">
                    {getMetadataText(event.metadata, ["customer_name", "customerName"]) || "-"}
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">
                    {event.customerEmail || getMetadataText(event.metadata, ["customer_email"]) || "-"}
                  </td>
                  <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                    {getMetadataText(event.metadata, ["customer_phone", "customerPhone"]) || "-"}
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">
                    {event.planId || getMetadataText(event.metadata, ["plan_id"]) || "-"}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#6B7280]">
                    {event.razorpayPaymentId || getMetadataText(event.metadata, ["payment_id"]) || "-"}
                  </td>
                  <td className="px-5 py-3 text-[#9CA3AF] whitespace-nowrap">{formatDateTime(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All events — mobile cards */}
      <section className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#111827]">All Events</h2>
          <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#F3F4F6] rounded-full px-2.5 py-1">{events.length}</span>
        </div>
        {events.slice(0, 50).map((event) => (
          <div key={event.id} className="rounded-xl border border-[#E8ECF0] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-[#F3F4F6] text-[#374151] px-2 py-0.5 text-[10px] font-medium">
                {event.eventName}
              </span>
              <span className="text-[10px] text-[#9CA3AF]">{formatDateTime(event.createdAt)}</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <p className="text-[#111827] font-medium truncate">
                {getMetadataText(event.metadata, ["customer_name", "customerName"]) || "-"}
              </p>
              <p className="text-[#6B7280] truncate">
                {event.customerEmail || getMetadataText(event.metadata, ["customer_email"]) || "-"}
              </p>
              {event.razorpayPaymentId && (
                <p className="font-mono text-[10px] text-[#9CA3AF] truncate">{event.razorpayPaymentId}</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
