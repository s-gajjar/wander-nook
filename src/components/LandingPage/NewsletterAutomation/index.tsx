"use client";

import { useState } from "react";
import { trackClientEvent } from "@/src/lib/analytics-client";

export default function NewsletterAutomation() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          source: "landing_page_newsletter",
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to subscribe right now.");
      }

      trackClientEvent("newsletter_subscribed", {
        source: "landing_page_newsletter",
      });

      setMessage("Subscribed. We will share upcoming issue updates on email.");
      setName("");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to subscribe right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#132D46] py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute -left-24 top-12 h-52 w-52 rounded-full bg-[#5DA9E9] blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#6DDF9A] blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B7DEFF]">
            Newsletter Automation
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Get New Issue Alerts and Reading Activity Updates
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#D7E7F4]">
            Join our mailing list for issue release updates, curated learning picks, and subscription
            reminders.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[#30526E] bg-[#0F2234]/80 p-5 shadow-[0_20px_40px_rgba(5,12,20,0.35)]"
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#CBE3F7]">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mb-4 w-full rounded-lg border border-[#385870] bg-[#102739] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#8DAEC7] focus:border-[#7DCEF7]"
            placeholder="Your name"
          />

          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#CBE3F7]">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[#385870] bg-[#102739] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#8DAEC7] focus:border-[#7DCEF7]"
            placeholder="name@example.com"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-[#6DDF9A] px-4 py-2.5 text-sm font-semibold text-[#0D2B1F] transition hover:bg-[#8BE7AF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </button>

          {message ? <p className="mt-3 text-sm text-[#D4E8FA]">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
