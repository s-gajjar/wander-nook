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
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return metadata as Record<string, unknown>;
}

function getMetadataText(metadata: unknown, keys: string[]) {
  const record = getMetadataRecord(metadata);
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      if (normalized) {
        return normalized;
      }
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
      Map<
        string,
        {
          key: string;
          name: string;
          email: string;
          phone: string;
          plan: string;
          latestEvent: string;
          createdAt: Date;
        }
      >
    >((map, event) => {
      const email =
        (event.customerEmail || getMetadataText(event.metadata, ["customer_email"])).toLowerCase();
      const phone = getMetadataText(event.metadata, ["customer_phone", "customerPhone"]);
      const name = getMetadataText(event.metadata, ["customer_name", "customerName"]);
      const plan = event.planId || getMetadataText(event.metadata, ["plan_id"]);
      const key = phone || email;

      if (!key || map.has(key)) {
        return map;
      }

      map.set(key, {
        key,
        name: name || "-",
        email: email || "-",
        phone: phone || "-",
        plan: plan || "-",
        latestEvent: event.eventName,
        createdAt: event.createdAt,
      });

        return map;
      }, new Map())
      .values()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Conversion Events</h1>
        <p className="mt-1 text-sm text-slate-600">Payment funnel and webhook events.</p>
      </div>

      <ReplayAutopayForm />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Lead Contacts</h2>
          <span className="text-xs text-slate-500">{leads.length} leads</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Latest Event</th>
                <th className="py-2 pr-4">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.key} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{lead.name}</td>
                  <td className="py-3 pr-4">{lead.email}</td>
                  <td className="py-3 pr-4">{lead.phone}</td>
                  <td className="py-3 pr-4">{lead.plan}</td>
                  <td className="py-3 pr-4">{lead.latestEvent}</td>
                  <td className="py-3 pr-4">{formatDateTime(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">All Events</h2>
          <span className="text-xs text-slate-500">{events.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{event.eventName}</td>
                  <td className="py-3 pr-4">
                    {getMetadataText(event.metadata, ["customer_name", "customerName"]) || "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {event.customerEmail || getMetadataText(event.metadata, ["customer_email"]) || "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {getMetadataText(event.metadata, ["customer_phone", "customerPhone"]) || "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {event.planId || getMetadataText(event.metadata, ["plan_id"]) || "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {event.razorpayPaymentId || getMetadataText(event.metadata, ["payment_id"]) || "-"}
                  </td>
                  <td className="py-3 pr-4">{formatDateTime(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
