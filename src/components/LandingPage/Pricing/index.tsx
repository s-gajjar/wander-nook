"use client";

import { useState } from "react";
import { toast } from "sonner";

type PurchaseMode = "autopay" | "one-time";

type PlanOption = {
  id: "monthly-autopay" | "annual-autopay";
  title: string;
  bgColor: string;
  textColor: string;
  border: boolean;
  autopayFeatures: string[];
  oneTimeFeatures: string[];
  price: {
    currency: "INR";
    amount: string;
    period: string;
  };
  button: {
    autopayText: string;
    oneTimeText: string;
    bgColor: string;
    textColor: string;
  };
  durationLabel: string;
  durationMonths: number;
  variantId: string;
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

type RazorpayVerifyResponse = {
  ok: boolean;
  alreadyExists?: boolean;
  order?: {
    id?: string | number;
    name?: string;
  };
};

type RazorpayCheckoutSuccessPayload = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type ShopifyCheckoutResponse = {
  checkout?: {
    cartId?: string;
    checkoutUrl?: string;
  };
  message?: string;
  error?: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  subscription_id: string;
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

const MONTHLY_VARIANT_ID =
  process.env.NEXT_PUBLIC_MONTHLY_VARIANT_ID ||
  process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID2 ||
  "";
const ANNUAL_VARIANT_ID =
  process.env.NEXT_PUBLIC_ANNUAL_VARIANT_ID ||
  process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID2 ||
  "";

const pricingData: PlanOption[] = [
  {
    id: "monthly-autopay",
    title: "Monthly",
    bgColor: "bg-purple-600",
    textColor: "text-white",
    border: false,
    autopayFeatures: [
      "Billed every month",
      "Autopay mode so you don't have to worry",
      "Same subscription benefits included",
    ],
    oneTimeFeatures: [
      "Billed every month",
      "Autopay mode so you don't have to worry",
      "Same subscription benefits included",
    ],
    price: {
      currency: "INR",
      amount: "200",
      period: "/month",
    },
    button: {
      autopayText: "Start Monthly Plan",
      oneTimeText: "Buy Monthly Once",
      bgColor: "bg-white",
      textColor: "text-purple-600",
    },
    durationLabel: "36 months",
    durationMonths: 36,
    variantId: MONTHLY_VARIANT_ID,
  },
  {
    id: "annual-autopay",
    title: "Annual",
    bgColor: "bg-white",
    textColor: "text-black",
    border: true,
    autopayFeatures: [
      "Billed once",
      "Autopay mode for next year which you can cancel easily",
      "Same subscription benefits included",
    ],
    oneTimeFeatures: [
      "Billed once",
      "Autopay mode for next year which you can cancel easily",
      "Same subscription benefits included",
    ],
    price: {
      currency: "INR",
      amount: "2400",
      period: "/year",
    },
    button: {
      autopayText: "Start Annual Plan",
      oneTimeText: "Buy Annual Once",
      bgColor: "bg-orange-500",
      textColor: "text-white",
    },
    durationLabel: "5 years",
    durationMonths: 60,
    variantId: ANNUAL_VARIANT_ID,
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

function toMerchandiseId(variantId: string) {
  const trimmed = variantId.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("gid://shopify/ProductVariant/")) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    return `gid://shopify/ProductVariant/${trimmed}`;
  }
  return null;
}

const Pricing = () => {
  const [openSample, setOpenSample] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [openAutopayModal, setOpenAutopayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [autopayForm, setAutopayForm] = useState<AutopayCustomerForm>(defaultAutopayForm);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [cardLoadingPlanId, setCardLoadingPlanId] = useState<PlanOption["id"] | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("autopay");

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

  const startOneTimeCheckout = async (plan: PlanOption) => {
    const merchandiseId = toMerchandiseId(plan.variantId);
    if (!merchandiseId) {
      toast.error("One-time checkout is not configured for this plan yet.");
      return;
    }

    try {
      setCardLoadingPlanId(plan.id);

      const response = await fetch("/api/shopify?action=checkoutOneTime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              attributes: [],
              quantity: 1,
              merchandiseId,
            },
          ],
          checkoutMeta: {
            checkoutSource: "wanderstamps-one-time",
            purchaseMode: "one-time",
            selectedPlan: plan.id,
          },
        }),
      });

      const data = (await response.json().catch(() => null)) as ShopifyCheckoutResponse | null;
      if (!response.ok || !data?.checkout?.checkoutUrl) {
        throw new Error(data?.message || data?.error || "One-time checkout failed.");
      }

      toast.success("Redirecting to checkout...");
      window.location.href = data.checkout.checkoutUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "One-time checkout failed.");
    } finally {
      setCardLoadingPlanId(null);
    }
  };

  const handlePricingButtonClick = async (id: PlanOption["id"]) => {
    const plan = pricingData.find((item) => item.id === id);
    if (!plan) {
      toast.error("Plan not found");
      return;
    }

    if (purchaseMode === "one-time") {
      await startOneTimeCheckout(plan);
      return;
    }

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

  const startAutopayCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlan) {
      toast.error("Please select a plan first.");
      return;
    }

    try {
      setAutopayLoading(true);

      const createResponse = await fetch("/api/razorpay/autopay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          customer: autopayForm,
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

            const orderName = verifyData.order?.name;
            toast.success(
              verifyData.alreadyExists
                ? `Autopay already confirmed${orderName ? ` (${orderName})` : ""}.`
                : `Autopay activated successfully${orderName ? ` (${orderName})` : ""}.`
            );
            resetAutopayModal();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to verify payment.");
          } finally {
            setAutopayLoading(false);
          }
        },
      });

      razorpay.on("payment.failed", () => {
        toast.error("Payment was not completed. Please try again.");
        setAutopayLoading(false);
      });

      setAutopayLoading(false);
      razorpay.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start autopay.");
      setAutopayLoading(false);
    }
  };

  const submitSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDownloading(true);
      const res = await fetch("/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contactNo: contact, city, schoolName: school }),
      });
      const data = await res.json();
      if (!res.ok && !data?.downloadPath) throw new Error(data?.error || "Request failed");
      toast.success("Sample request sent!");
      setOpenSample(false);
      setName("");
      setEmail("");
      setContact("");
      setCity("");
      setSchool("");
      const downloadUrl = data?.downloadPath || data?.pdfUrl;
      if (downloadUrl) {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "sample.pdf";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      toast.error("Failed to send request");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="pricing"
      className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="md:w-[820px] w-full px-4 mt-4">
        <h2 className="md:text-[42px] text-[28px] text-center leading-[34px] md:leading-[50px] text-[var(--font-black-shade-1)] font-semibold ">
          Choose your plan
        </h2>
        <p className="mt-3 text-[var(--font-black-shade-1)] w-full text-[16px] md:text-[20px] font-normal leading-5 md:leading-6 text-center ">
          Find your perfect plan and embark on an exciting journey of discovery.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-[#E7E3D2] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPurchaseMode("autopay")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                purchaseMode === "autopay"
                  ? "bg-[#6A43D7] text-white"
                  : "text-[#4B5563] hover:bg-[#F5F3FF]"
              }`}
            >
              Autopay
            </button>
            <button
              type="button"
              onClick={() => setPurchaseMode("one-time")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                purchaseMode === "one-time"
                  ? "bg-[#2C2C2C] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              One-time
            </button>
          </div>
          <span className="text-xs text-[#6B7280] text-center">
            {purchaseMode === "autopay"
              ? "Recurring billing is enabled by default."
              : "One-time billing selected. No automatic renewal."}
          </span>
        </div>
        <p className="mt-6 text-center text-[15px] md:text-[16px] leading-5 md:leading-6">
          To view a sample PRINT edition,{" "}
          <button
            onClick={() => setOpenSample(true)}
            className="text-[#6A43D7] underline cursor-pointer"
          >
            click here
          </button>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center px-5 gap-16 mt-12">
        {pricingData.map((card) => (
          <div
            key={card.id}
            className={`${card.bgColor} ${
              card.textColor
            } rounded-2xl p-8 md:w-[372px] w-full max-w-[372px] min-h-[520px] flex flex-col ${
              card.border ? "border border-[#2C2C2C]" : ""
            }`}
          >
            <h3 className="md:text-[28px] leading-7 text-[24px] md:leading-[33px] font-semibold mb-2">
              {card.title}
            </h3>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70 mb-4">
              {purchaseMode === "autopay" ? "Recurring" : "One-time"}
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {(purchaseMode === "autopay" ? card.autopayFeatures : card.oneTimeFeatures).map(
                (feature, index) => (
                <li
                  key={index + 1}
                  className="flex text-[16px] md:text-[20px] leading-[22px] md:leading-[28px] font-normal items-start"
                >
                  <span className="mt-2 w-2 h-2 bg-current rounded-full mr-3 shrink-0"></span>
                  <span>{feature}</span>
                </li>
                )
              )}
            </ul>
            <div className="mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-sm">{card.price.currency}</span>
                <span className="text-4xl font-bold">{card.price.amount}</span>
                <span className="text-sm">
                  {purchaseMode === "autopay" ? card.price.period : "/one-time"}
                </span>
              </div>
              <button
                className={`${card.button.bgColor} ${card.button.textColor} cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity mt-8 ${
                  cardLoadingPlanId === card.id ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={() => void handlePricingButtonClick(card.id)}
                disabled={cardLoadingPlanId === card.id}
              >
                {cardLoadingPlanId === card.id
                  ? purchaseMode === "autopay"
                    ? "Opening..."
                    : "Redirecting..."
                  : purchaseMode === "autopay"
                  ? card.button.autopayText
                  : card.button.oneTimeText}
              </button>
              <p className="text-xs mt-2 text-center opacity-75 min-h-[16px]">
                {purchaseMode === "autopay"
                  ? `Recurring for ${card.durationLabel}`
                  : "One-time payment. No automatic renewal."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {openAutopayModal && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-6"
          onClick={resetAutopayModal}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-[#E7E3D2]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={resetAutopayModal}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h4 className="text-[26px] md:text-[34px] leading-tight font-semibold text-[#2C2C2C]">
                Complete your {selectedPlan.title}
              </h4>
              <p className="mt-2 text-[#5F6368] text-[15px] md:text-[17px]">
                {selectedPlan.price.currency} {selectedPlan.price.amount}
                {selectedPlan.price.period} for {selectedPlan.durationLabel}
              </p>
            </div>

            <form onSubmit={startAutopayCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    Full Name
                  </label>
                  <input
                    value={autopayForm.name}
                    onChange={(event) => handleAutopayFieldChange("name", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={autopayForm.email}
                    onChange={(event) => handleAutopayFieldChange("email", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    Phone Number
                  </label>
                  <input
                    value={autopayForm.phone}
                    onChange={(event) => handleAutopayFieldChange("phone", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    Pincode
                  </label>
                  <input
                    value={autopayForm.pincode}
                    onChange={(event) => handleAutopayFieldChange("pincode", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                  Address Line 1
                </label>
                <input
                  value={autopayForm.addressLine1}
                  onChange={(event) => handleAutopayFieldChange("addressLine1", event.target.value)}
                  className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                  required
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                  Address Line 2 (optional)
                </label>
                <input
                  value={autopayForm.addressLine2}
                  onChange={(event) => handleAutopayFieldChange("addressLine2", event.target.value)}
                  className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    City
                  </label>
                  <input
                    value={autopayForm.city}
                    onChange={(event) => handleAutopayFieldChange("city", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    State
                  </label>
                  <input
                    value={autopayForm.state}
                    onChange={(event) => handleAutopayFieldChange("state", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                    Country
                  </label>
                  <input
                    value={autopayForm.country}
                    onChange={(event) => handleAutopayFieldChange("country", event.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col md:flex-row gap-3 md:justify-end">
                <button
                  type="button"
                  onClick={resetAutopayModal}
                  className="rounded-lg border border-[#D1D5DB] px-5 py-3 font-medium text-[#111827] hover:bg-gray-50 cursor-pointer"
                  disabled={autopayLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={autopayLoading}
                  className={`rounded-lg bg-[#6A43D7] text-white px-6 py-3 font-semibold hover:opacity-90 cursor-pointer ${
                    autopayLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {autopayLoading ? "Processing..." : "Proceed to Secure Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openSample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-6"
          onClick={() => setOpenSample(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#FAF7E9] p-6 md:p-10 shadow-2xl border border-[#E7E3D2]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenSample(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 border border-[#E5E7EB] text-[#111827] hover:bg-white cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center mb-6 md:mb-8">
              <h4 className="text-[28px] md:text-[40px] leading-tight font-semibold text-[#2C2C2C]">
                Get Your Free Sample Print Edition
              </h4>
              <p className="mt-3 text-[#5F6368] text-[15px] md:text-[18px]">
                Fill out the form below to download the sample copy
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#EDF0F3] shadow-sm p-5 md:p-7">
              <form onSubmit={submitSample} className="space-y-5 md:space-y-6">
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">Name</label>
                  <input
                    placeholder="Value"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Value"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-[#0F1728] mb-2">Contact No</label>
                  <input
                    placeholder="Value"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[15px] font-medium text-[#0F1728] mb-2">City</label>
                    <input
                      placeholder="Value"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    />
                  </div>
                  <div>
                    <label className="block text-[15px] font-medium text-[#0F1728] mb-2">
                      School Name
                    </label>
                    <input
                      placeholder="Value"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full rounded-xl border border-[#E7EBF0] bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#6A43D7]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={downloading}
                    className={`w-full md:w-auto inline-flex items-center justify-center rounded-full bg-[#FFC21A] text-[#1F2937] font-semibold px-6 md:px-7 py-3 hover:brightness-95 cursor-pointer ${
                      downloading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {downloading ? "Preparing download…" : "Download The Sample Copy"}
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
