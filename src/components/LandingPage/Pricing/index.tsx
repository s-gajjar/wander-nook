"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trackClientEvent } from "@/src/lib/analytics-client";
import { trackMetaPixelEvent } from "@/src/lib/meta-pixel";

type PlanOption = {
  id: "monthly-autopay" | "annual-onetime";
  title: string;
  billingLabel: string;
  checkoutMode: "autopay" | "one-time";
  bgColor: string;
  textColor: string;
  border: boolean;
  features: string[];
  price: {
    currency: "INR";
    amount: string;
    period: string;
  };
  button: {
    text: string;
    bgColor: string;
    textColor: string;
  };
  billingFootnote: string;
  durationMonths: number;
};

type AutopayCustomerForm = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type AutopaySuccessState = {
  alreadyExists: boolean;
  orderName?: string;
  paymentId: string;
  subscriptionId?: string;
  orderId?: string;
  invoice?: {
    number: string;
    url: string;
    emailSent: boolean;
    emailSkippedReason?: string;
  };
  invoiceError?: string;
  customer: AutopayCustomerForm;
  plan: {
    title: string;
    priceLabel: string;
  };
};

type RazorpayCreateResponse = {
  keyId: string;
  subscriptionId: string;
  plan: {
    id: PlanOption["id"];
    label: string;
    amountInr: number;
    cycle: "monthly" | "yearly";
    totalCount: number;
  };
};

type RazorpayOnetimeCreateResponse = {
  keyId: string;
  orderId: string;
  plan: {
    id: string;
    label: string;
    amountInr: number;
    amountPaise: number;
    currency: string;
    durationMonths: number;
  };
};

type RazorpayOnetimeVerifyResponse = {
  ok: boolean;
  meta?: {
    purchaseEventId?: string;
    shouldTrackPurchase?: boolean;
  };
  alreadyExists?: boolean;
  order?: {
    id?: string;
    orderNumber?: string;
  };
};

type RazorpayVerifyResponse = {
  ok: boolean;
  meta?: {
    purchaseEventId?: string;
    shouldTrackPurchase?: boolean;
  };
  alreadyExists?: boolean;
  order?: {
    id?: string | number;
    name?: string;
  };
  invoice?: {
    invoiceId: string;
    invoiceNumber: string;
    publicToken: string;
    created: boolean;
    emailSent: boolean;
    emailSkippedReason?: string;
  };
  invoiceError?: string;
};

type RazorpayCheckoutSuccessPayload = {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (payload: RazorpayCheckoutSuccessPayload) => void | Promise<void>;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: string, callback: (payload: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const pricingData: PlanOption[] = [
  {
    id: "monthly-autopay",
    title: "Monthly",
    billingLabel: "Recurring",
    checkoutMode: "autopay",
    bgColor: "bg-purple-600",
    textColor: "text-white",
    border: false,
    features: [
      "INR 200 billed every month",
      "Recurring auto-debit for 12 months",
      "Cancel anytime, no questions asked",
      "Full subscription benefits included",
    ],
    price: {
      currency: "INR",
      amount: "200",
      period: "/month",
    },
    button: {
      text: "Start Monthly Plan",
      bgColor: "bg-white",
      textColor: "text-purple-600",
    },
    billingFootnote: "Recurring billing enabled for 12 months",
    durationMonths: 12,
  },
  {
    id: "annual-onetime",
    title: "Annual",
    billingLabel: "One-time",
    checkoutMode: "one-time",
    bgColor: "bg-white",
    textColor: "text-black",
    border: true,
    features: [
      "One-time payment of INR 2300",
      "Valid for 12 months from date of purchase",
      "Renew manually next year if you want to continue",
      "Full subscription benefits included",
    ],
    price: {
      currency: "INR",
      amount: "2300",
      period: "/year",
    },
    button: {
      text: "Start Annual Plan",
      bgColor: "bg-orange-500",
      textColor: "text-white",
    },
    billingFootnote: "One-time annual payment. Renew manually next year.",
    durationMonths: 12,
  },
];

const defaultAutopayForm: AutopayCustomerForm = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  return (
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

const Pricing = () => {
  const [openSample, setOpenSample] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [sampleSubmitting, setSampleSubmitting] = useState(false);

  const [openAutopayModal, setOpenAutopayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [autopayForm, setAutopayForm] = useState<AutopayCustomerForm>(defaultAutopayForm);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [autopaySuccess, setAutopaySuccess] = useState<AutopaySuccessState | null>(null);

  const loadRazorpayScript = async () => {
    if (window.Razorpay) {
      return true;
    }

    return await new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePricingButtonClick = (id: PlanOption["id"]) => {
    const plan = pricingData.find((item) => item.id === id);
    if (!plan) {
      toast.error("Plan not found");
      return;
    }

    trackClientEvent("funnel_plan_selected", {
      plan_id: plan.id,
      plan_title: plan.title,
      amount_inr: plan.price.amount,
    });

    setSelectedPlan(plan);
    setOpenAutopayModal(true);
    setAutopayForm(defaultAutopayForm);
  };

  const handleAutopayFieldChange = <K extends keyof AutopayCustomerForm>(
    field: K,
    value: string
  ) => {
    setAutopayForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAutopayModal = () => {
    setAutopayLoading(false);
    setOpenAutopayModal(false);
    setSelectedPlan(null);
    setAutopayForm(defaultAutopayForm);
  };

  const closeAutopaySuccess = () => {
    setAutopaySuccess(null);
  };

  const buildLeadTrackingMeta = (plan: PlanOption) => ({
    plan_id: plan.id,
    plan_title: plan.title,
    purchase_mode: plan.checkoutMode,
    customer_name: autopayForm.name,
    customer_email: autopayForm.email,
    customer_phone: autopayForm.phone,
    customer_city: autopayForm.city,
    customer_state: autopayForm.state,
  });

  const buildMetaPixelCheckoutPayload = (plan: PlanOption) => ({
    content_name: `${plan.title} Plan`,
    content_category: "Subscription",
    content_type: "product",
    content_ids: [plan.id],
    value: Number(plan.price.amount),
    currency: plan.price.currency,
    num_items: 1,
  });

  const buildMetaBrowserTracking = () => ({
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  });

  const startOneTimeCheckout = async (plan: PlanOption) => {
    // Create Razorpay order
    const createResponse = await fetch("/api/razorpay/onetime/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        customer: autopayForm,
        tracking: buildMetaBrowserTracking(),
      }),
    });

    const createData = (await createResponse.json().catch(() => null)) as
      | RazorpayOnetimeCreateResponse
      | { error?: string }
      | null;

    if (!createResponse.ok || !createData || !("orderId" in createData)) {
      throw new Error(
        (createData && "error" in createData && createData.error) ||
          "Failed to initialize payment."
      );
    }

    trackClientEvent("funnel_checkout_initiated", {
      ...buildLeadTrackingMeta(plan),
      razorpay_order_id: createData.orderId,
    });
    trackMetaPixelEvent("InitiateCheckout", buildMetaPixelCheckoutPayload(plan));

    // Load Razorpay script
    const razorpayLoaded = await loadRazorpayScript();
    if (!razorpayLoaded || !window.Razorpay) {
      throw new Error("Unable to load Razorpay checkout. Please try again.");
    }

    // Open Razorpay checkout
    const razorpay = new window.Razorpay({
      key: createData.keyId,
      order_id: createData.orderId,
      amount: createData.plan.amountPaise,
      currency: createData.plan.currency,
      name: "Wander Nook",
      description: `${plan.title} Plan (${plan.price.currency} ${plan.price.amount}${plan.price.period})`,
      prefill: {
        name: autopayForm.name,
        email: autopayForm.email,
        contact: autopayForm.phone,
      },
      notes: {
        checkout_source: "wandernook-onetime",
        plan_id: plan.id,
      },
      theme: {
        color: "#F97316",
      },
      modal: {
        ondismiss: () => {
          setAutopayLoading(false);
        },
      },
      handler: async (payload) => {
        try {
          setAutopayLoading(true);
          const verifyResponse = await fetch("/api/razorpay/onetime/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: plan.id,
              customer: autopayForm,
              payment: {
                razorpayPaymentId: payload.razorpay_payment_id,
                razorpayOrderId: payload.razorpay_order_id,
                razorpaySignature: payload.razorpay_signature,
              },
              tracking: buildMetaBrowserTracking(),
            }),
          });

          const verifyData = (await verifyResponse.json().catch(() => null)) as
            | RazorpayOnetimeVerifyResponse
            | { error?: string }
            | null;

          if (!verifyResponse.ok || !verifyData || !("ok" in verifyData)) {
            throw new Error(
              (verifyData && "error" in verifyData && verifyData.error) ||
                "Payment was received but order confirmation failed."
            );
          }

          trackClientEvent("funnel_payment_success", {
            ...buildLeadTrackingMeta(plan),
            payment_id: payload.razorpay_payment_id,
            order_id: payload.razorpay_order_id,
            order_number: verifyData.order?.orderNumber,
            already_exists: Boolean(verifyData.alreadyExists),
          });

          if (verifyData.meta?.shouldTrackPurchase !== false) {
            const purchaseEventId =
              verifyData.meta?.purchaseEventId ||
              `purchase:razorpay:${payload.razorpay_payment_id}`;

            trackMetaPixelEvent(
              "Purchase",
              {
                ...buildMetaPixelCheckoutPayload(plan),
                content_name: `${plan.title} Purchase`,
                order_number: verifyData.order?.orderNumber,
              },
              {
                eventID: purchaseEventId,
              }
            );
          }

          setAutopaySuccess({
            alreadyExists: Boolean(verifyData.alreadyExists),
            orderName: verifyData.order?.orderNumber,
            paymentId: payload.razorpay_payment_id,
            orderId: payload.razorpay_order_id,
            customer: { ...autopayForm },
            plan: {
              title: plan.title,
              priceLabel: `${plan.price.currency} ${plan.price.amount}${plan.price.period}`,
            },
          });
          resetAutopayModal();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to verify payment.");
        } finally {
          setAutopayLoading(false);
        }
      },
    });

    razorpay.on("payment.failed", () => {
      trackClientEvent("funnel_payment_failed", {
        ...buildLeadTrackingMeta(plan),
      });
      toast.error("Payment was not completed. Please try again.");
      setAutopayLoading(false);
    });

    setAutopayLoading(false);
    razorpay.open();
  };

  const startPlanCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlan) {
      toast.error("Please select a plan first.");
      return;
    }

    try {
      setAutopayLoading(true);
      trackMetaPixelEvent("Lead", {
        content_name: "Form_Fill",
      });

      if (selectedPlan.checkoutMode === "one-time") {
        await startOneTimeCheckout(selectedPlan);
        setAutopayLoading(false);
        return;
      }

      const createResponse = await fetch("/api/razorpay/autopay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          customer: autopayForm,
          tracking: buildMetaBrowserTracking(),
        }),
      });

      const createData = (await createResponse.json().catch(() => null)) as
        | RazorpayCreateResponse
        | { error?: string }
        | null;

      if (!createResponse.ok || !createData || !("subscriptionId" in createData)) {
        throw new Error(
          (createData && "error" in createData && createData.error) ||
            "Failed to initialize secure payment."
        );
      }

      trackClientEvent("funnel_checkout_initiated", {
        ...buildLeadTrackingMeta(selectedPlan),
        subscription_id: createData.subscriptionId,
      });
      trackMetaPixelEvent("InitiateCheckout", buildMetaPixelCheckoutPayload(selectedPlan));

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout. Please try again.");
      }

      const razorpay = new window.Razorpay({
        key: createData.keyId,
        subscription_id: createData.subscriptionId,
        name: "Wander Stamps",
        description: `${selectedPlan.title} (${selectedPlan.price.currency} ${selectedPlan.price.amount}${selectedPlan.price.period})`,
        prefill: {
          name: autopayForm.name,
          email: autopayForm.email,
          contact: autopayForm.phone,
        },
        notes: {
          checkout_source: "wanderstamps-autopay",
          recurring_plan: selectedPlan.id,
          recurring_duration_months: String(selectedPlan.durationMonths),
        },
        theme: {
          color: "#6A43D7",
        },
        modal: {
          ondismiss: () => {
            setAutopayLoading(false);
          },
        },
        handler: async (payload) => {
          try {
            setAutopayLoading(true);
            const verifyResponse = await fetch("/api/razorpay/autopay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                planId: selectedPlan.id,
                customer: autopayForm,
                payment: {
                  paymentId: payload.razorpay_payment_id,
                  subscriptionId: payload.razorpay_subscription_id,
                  signature: payload.razorpay_signature,
                },
              }),
            });

            const verifyData = (await verifyResponse.json().catch(() => null)) as
              | RazorpayVerifyResponse
              | { error?: string }
              | null;

            if (!verifyResponse.ok || !verifyData || !("ok" in verifyData)) {
              throw new Error(
                (verifyData && "error" in verifyData && verifyData.error) ||
                  "Payment was received but order confirmation failed."
              );
            }

            trackClientEvent("funnel_payment_success", {
              ...buildLeadTrackingMeta(selectedPlan),
              payment_id: payload.razorpay_payment_id,
              subscription_id: payload.razorpay_subscription_id,
              order_name: verifyData.order?.name,
              already_exists: Boolean(verifyData.alreadyExists),
            });
            if (verifyData.meta?.shouldTrackPurchase !== false) {
              const purchaseEventId =
                verifyData.meta?.purchaseEventId ||
                `purchase:razorpay:${payload.razorpay_payment_id}`;

              trackMetaPixelEvent(
                "Purchase",
                {
                  ...buildMetaPixelCheckoutPayload(selectedPlan),
                  content_name: `${selectedPlan.title} Purchase`,
                  order_name: verifyData.order?.name,
                },
                {
                  eventID: purchaseEventId,
                }
              );
            }

            const orderName = verifyData.order?.name;
            setAutopaySuccess({
              alreadyExists: Boolean(verifyData.alreadyExists),
              orderName,
              paymentId: payload.razorpay_payment_id,
              subscriptionId: payload.razorpay_subscription_id,
              invoice: verifyData.invoice
                ? {
                    number: verifyData.invoice.invoiceNumber,
                    url: `/invoice/${verifyData.invoice.publicToken}`,
                    emailSent: verifyData.invoice.emailSent,
                    emailSkippedReason: verifyData.invoice.emailSkippedReason,
                  }
                : undefined,
              invoiceError: verifyData.invoiceError,
              customer: { ...autopayForm },
              plan: {
                title: selectedPlan.title,
                priceLabel: `${selectedPlan.price.currency} ${selectedPlan.price.amount}${selectedPlan.price.period}`,
              },
            });
            resetAutopayModal();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to verify payment.");
          } finally {
            setAutopayLoading(false);
          }
        },
      });

      razorpay.on("payment.failed", () => {
        trackClientEvent("funnel_payment_failed", {
          ...buildLeadTrackingMeta(selectedPlan),
        });
        toast.error("Payment was not completed. Please try again.");
        setAutopayLoading(false);
      });

      setAutopayLoading(false);
      razorpay.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start checkout.");
      setAutopayLoading(false);
    }
  };

  const submitSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSampleSubmitting(true);
      const res = await fetch("/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contactNo: contact, city, schoolName: school }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      trackClientEvent("sample_issue_requested", {
        source: "pricing_section",
      });
      toast.success("Sample request submitted. Our team will contact you for payment.");
      setOpenSample(false);
      setName("");
      setEmail("");
      setContact("");
      setCity("");
      setSchool("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send request");
    } finally {
      setSampleSubmitting(false);
    }
  };

  return (
    <div
      id="pricing"
      className="container mx-auto py-16 md:py-24 bg-white flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="md:w-[820px] w-full px-4">
        <h2 className="md:text-[44px] text-[28px] text-center leading-[34px] md:leading-[52px] text-[var(--font-black-shade-1)] font-semibold" style={{ textWrap: "balance" }}>
          Choose your plan
        </h2>
        <p className="mt-4 text-[var(--font-black-shade-2)] w-full text-[16px] md:text-[18px] font-normal leading-6 md:leading-7 text-center" style={{ textWrap: "pretty" }}>
          Find your perfect plan and embark on an exciting journey of discovery.
        </p>
      </div>

      <div className="flex flex-wrap items-stretch justify-center px-5 gap-6 md:gap-8 mt-14">
        {pricingData.map((card) => (
          <div
            key={card.id}
            className={`${card.bgColor} ${card.textColor} rounded-[20px] p-7 md:p-9 md:w-[380px] w-full max-w-[380px] min-h-[480px] md:min-h-[540px] flex flex-col transition-transform duration-200 hover:-translate-y-1 ${
              card.border
                ? "border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)]"
                : "shadow-[0_2px_8px_rgba(106,67,215,0.12),0_12px_40px_rgba(106,67,215,0.15)]"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="md:text-[26px] leading-7 text-[22px] md:leading-[30px] font-semibold">
                {card.title}
              </h3>
              <span className={`text-[11px] uppercase tracking-[0.16em] font-medium px-2.5 py-1 rounded-full ${
                card.border
                  ? "bg-[#F3F4F6] text-[#4B5563]"
                  : "bg-white/20 text-white/90"
              }`}>
                {card.billingLabel}
              </span>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              {card.features.map((feature, index) => (
                <li
                  key={index + 1}
                  className="flex text-[14px] md:text-[15px] leading-[20px] md:leading-[22px] font-normal items-start"
                >
                  <span className={`mt-[7px] w-1.5 h-1.5 rounded-full mr-3 shrink-0 ${
                    card.border ? "bg-[#6A43D7]" : "bg-white/80"
                  }`}></span>
                  <span className="opacity-90">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6 border-t border-current/10">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] opacity-70">{card.price.currency}</span>
                <span className="text-[38px] md:text-[42px] font-bold leading-none tabular-nums">{card.price.amount}</span>
                <span className="text-[13px] opacity-70">{card.price.period}</span>
              </div>
              <button
                className={`${card.button.bgColor} ${card.button.textColor} cursor-pointer w-full py-3.5 px-6 rounded-xl font-semibold text-[16px] transition-all duration-150 mt-6 active:scale-[0.96] ${
                  card.border
                    ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:brightness-105"
                    : "shadow-[0_1px_3px_rgba(255,255,255,0.2)] hover:shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:bg-white/95"
                }`}
                onClick={() => handlePricingButtonClick(card.id)}
              >
                {card.button.text}
              </button>
              <p className="text-[11px] mt-3 text-center opacity-60 min-h-[14px]">
                {card.billingFootnote}
              </p>
            </div>
          </div>
        ))}
      </div>

      {openAutopayModal && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-[2px] px-3 sm:px-6 py-4 overflow-y-auto overscroll-contain animate-[fadeIn_150ms_ease-out]"
          onClick={resetAutopayModal}
        >
          <div
            className="relative my-auto w-full max-w-3xl max-h-[92dvh] overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] border border-[#F0F0F0] animate-[slideUp_200ms_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={resetAutopayModal}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>

            <div className="text-center mb-7">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide mb-4 ${
                selectedPlan.checkoutMode === "one-time"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-purple-50 text-purple-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedPlan.checkoutMode === "one-time" ? "bg-orange-400" : "bg-purple-400"
                }`}></span>
                {selectedPlan.checkoutMode === "one-time" ? "One-time payment" : "Recurring subscription"}
              </div>
              <h4 className="text-[24px] md:text-[30px] leading-tight font-semibold text-[#111827]" style={{ textWrap: "balance" }}>
                Complete your {selectedPlan.title.toLowerCase()} plan
              </h4>
              <p className="mt-2 text-[#6B7280] text-[15px] md:text-[16px] tabular-nums">
                {selectedPlan.price.currency} {selectedPlan.price.amount}
                {selectedPlan.price.period}
              </p>
            </div>

            <form onSubmit={startPlanCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.name}
                    onChange={(event) => handleAutopayFieldChange("name", event.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={autopayForm.email}
                    onChange={(event) => handleAutopayFieldChange("email", event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.phone}
                    onChange={(event) => handleAutopayFieldChange("phone", event.target.value)}
                    placeholder="10-digit number"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow tabular-nums"
                    required
                    maxLength={10}
                    minLength={10}
                    pattern="\d{10}"
                    title="Please enter a 10-digit phone number"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Pincode <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.pincode}
                    onChange={(event) => handleAutopayFieldChange("pincode", event.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Address Line 1 <span className="text-red-400">*</span>
                </label>
                <input
                  value={autopayForm.addressLine1}
                  onChange={(event) => handleAutopayFieldChange("addressLine1", event.target.value)}
                  placeholder="House/flat number, street"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Address Line 2 <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <input
                  value={autopayForm.addressLine2}
                  onChange={(event) => handleAutopayFieldChange("addressLine2", event.target.value)}
                  placeholder="Landmark, area"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.city}
                    onChange={(event) => handleAutopayFieldChange("city", event.target.value)}
                    placeholder="City"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.state}
                    onChange={(event) => handleAutopayFieldChange("state", event.target.value)}
                    placeholder="State"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={autopayForm.country}
                    onChange={(event) => handleAutopayFieldChange("country", event.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3 md:justify-end border-t border-[#F3F4F6] mt-6">
                <button
                  type="button"
                  onClick={resetAutopayModal}
                  className="rounded-xl border border-[#E5E7EB] px-5 py-3 font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors cursor-pointer active:scale-[0.96]"
                  disabled={autopayLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={autopayLoading}
                  className={`rounded-xl px-7 py-3 font-semibold text-[15px] transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    selectedPlan.checkoutMode === "one-time"
                      ? "bg-[#F97316] text-white shadow-[0_1px_3px_rgba(249,115,22,0.2)] hover:shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:brightness-105"
                      : "bg-[#6A43D7] text-white shadow-[0_1px_3px_rgba(106,67,215,0.2)] hover:shadow-[0_4px_16px_rgba(106,67,215,0.3)] hover:brightness-105"
                  } ${autopayLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {autopayLoading
                    ? "Processing..."
                    : selectedPlan.checkoutMode === "one-time"
                      ? "Pay Now"
                      : "Proceed to Secure Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {autopaySuccess && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0F172A]/70 backdrop-blur-[2px] px-3 sm:px-6 py-4 overflow-y-auto overscroll-contain animate-[fadeIn_150ms_ease-out]"
          onClick={closeAutopaySuccess}
        >
          <div
            className="relative my-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)] animate-[slideUp_200ms_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={closeAutopaySuccess}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>

            <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#F0F9FF] border border-[#D1FAE5] p-5 md:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#10B981]/10 mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#059669] uppercase mb-1">
                Payment Successful
              </p>
              <h4 className="text-[22px] md:text-[28px] leading-tight font-semibold text-[#111827]" style={{ textWrap: "balance" }}>
                {autopaySuccess.alreadyExists
                  ? "Order already confirmed"
                  : autopaySuccess.subscriptionId
                    ? "Subscription activated"
                    : "Payment successful"}
              </h4>
              <p className="mt-2 text-[14px] md:text-[15px] text-[#374151]">
                {autopaySuccess.plan.title} Plan · <span className="tabular-nums">{autopaySuccess.plan.priceLabel}</span>
              </p>
              {autopaySuccess.orderName ? (
                <p className="mt-2 text-[13px] text-[#374151] font-medium tabular-nums">
                  Order #{autopaySuccess.orderName}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
              <div className="rounded-xl border border-[#F3F4F6] bg-[#FAFBFC] p-3.5">
                <p className="text-[#9CA3AF] text-[11px] uppercase tracking-[0.12em] font-medium">Full Name</p>
                <p className="mt-1 font-medium text-[#111827]">{autopaySuccess.customer.name}</p>
              </div>
              <div className="rounded-xl border border-[#F3F4F6] bg-[#FAFBFC] p-3.5">
                <p className="text-[#9CA3AF] text-[11px] uppercase tracking-[0.12em] font-medium">Phone</p>
                <p className="mt-1 font-medium text-[#111827] tabular-nums">{autopaySuccess.customer.phone}</p>
              </div>
              <div className="rounded-xl border border-[#F3F4F6] bg-[#FAFBFC] p-3.5 md:col-span-2">
                <p className="text-[#9CA3AF] text-[11px] uppercase tracking-[0.12em] font-medium">Email</p>
                <p className="mt-1 font-medium text-[#111827] break-all">
                  {autopaySuccess.customer.email}
                </p>
              </div>
              <div className="rounded-xl border border-[#F3F4F6] bg-[#FAFBFC] p-3.5 md:col-span-2">
                <p className="text-[#9CA3AF] text-[11px] uppercase tracking-[0.12em] font-medium">
                  Shipping Address
                </p>
                <p className="mt-1 font-medium text-[#111827] leading-relaxed">
                  {autopaySuccess.customer.addressLine1}
                  {autopaySuccess.customer.addressLine2
                    ? `, ${autopaySuccess.customer.addressLine2}`
                    : ""}
                  <br />
                  {autopaySuccess.customer.city}, {autopaySuccess.customer.state}{" "}
                  <span className="tabular-nums">{autopaySuccess.customer.pincode}</span>
                  <br />
                  {autopaySuccess.customer.country}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFBFC] p-3">
                <p className="text-[#9CA3AF] font-medium">Payment ID</p>
                <p className="mt-1 font-mono text-[#374151] break-all tabular-nums">
                  {autopaySuccess.paymentId}
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFBFC] p-3">
                <p className="text-[#9CA3AF] font-medium">{autopaySuccess.subscriptionId ? "Subscription ID" : "Order ID"}</p>
                <p className="mt-1 font-mono text-[#374151] break-all tabular-nums">
                  {autopaySuccess.subscriptionId || autopaySuccess.orderId}
                </p>
              </div>
            </div>

            {autopaySuccess.invoice ? (
              <div className="mt-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-4">
                <p className="text-[#6B7280] text-[11px] uppercase tracking-[0.12em] font-medium">
                  Invoice
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#111827]">
                  {autopaySuccess.invoice.number}
                </p>
                <p className="mt-1 text-[13px] text-[#4B5563]">
                  {autopaySuccess.invoice.emailSent
                    ? "Invoice emailed to your registered address."
                    : `Email status: ${
                        autopaySuccess.invoice.emailSkippedReason || "not sent yet"
                      }`}
                </p>
                <a
                  href={autopaySuccess.invoice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-[13px] font-medium text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors"
                >
                  View Invoice →
                </a>
              </div>
            ) : null}

            {autopaySuccess.invoiceError ? (
              <p className="mt-3 text-[12px] text-[#DC2626] bg-[#FEF2F2] rounded-lg px-3 py-2 border border-[#FECACA]">
                {autopaySuccess.invoiceError}
              </p>
            ) : null}

            <div className="mt-6 pt-4 border-t border-[#F3F4F6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[12px] text-[#9CA3AF]">
                A confirmation email has been sent to your inbox.
              </p>
              <button
                type="button"
                onClick={closeAutopaySuccess}
                className="rounded-xl bg-[#111827] text-white px-6 py-2.5 font-medium text-[14px] hover:bg-[#1F2937] transition-colors cursor-pointer active:scale-[0.96]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {openSample && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-[2px] px-3 sm:px-6 py-4 overflow-y-auto overscroll-contain animate-[fadeIn_150ms_ease-out]"
          onClick={() => setOpenSample(false)}
        >
          <div
            className="relative my-auto w-full max-w-4xl max-h-[92dvh] overflow-y-auto overscroll-contain rounded-2xl bg-[#FAF7E9] p-6 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-[#E7E3D2] animate-[slideUp_200ms_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenSample(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-white transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div className="text-center mb-6 md:mb-8">
              <h4 className="text-[26px] md:text-[36px] leading-tight font-semibold text-[#2C2C2C]" style={{ textWrap: "balance" }}>
                Request a Sample Print Copy (INR 100)
              </h4>
              <p className="mt-3 text-[#5F6368] text-[15px] md:text-[17px]" style={{ textWrap: "pretty" }}>
                Fill out the form and our team will contact you to assist with payment and dispatch.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#EDF0F3] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 md:p-7">
              <form onSubmit={submitSample} className="space-y-5 md:space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Name <span className="text-red-400">*</span></label>
                  <input
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Contact No <span className="text-red-400">*</span></label>
                  <input
                    placeholder="10-digit number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow tabular-nums"
                    required
                    maxLength={10}
                    minLength={10}
                    pattern="\d{10}"
                    title="Please enter a 10-digit phone number"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">City</label>
                    <input
                      placeholder="Your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                      School Name
                    </label>
                    <input
                      placeholder="School name (if applicable)"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]/30 focus:border-[#6A43D7] transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={sampleSubmitting}
                    className={`w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-[#FFC21A] text-[#1F2937] font-semibold px-7 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(255,194,26,0.3)] hover:brightness-105 transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                      sampleSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {sampleSubmitting ? "Submitting..." : "Request Sample Copy"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
