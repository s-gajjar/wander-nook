"use client";

import { VARIANT_ID_1, VARIANT_ID_2, PRINT_SELLING_PLAN_ID, DIGITAL_SELLING_PLAN_ID } from "@/src/config";
import { ICheckoutResponse } from "@/src/utils/types";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";

const Pricing = () => {
  const [openSample, setOpenSample] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);

  const pricingData = [
    {
      id: 1,
      type: "type2",
      title: "Print Edition",
      bgColor: "bg-purple-600",
      textColor: "text-white",
      border: false,
      features: [
        "1 year subscription",
        "24 newspapers delivered monthly",
        "Printables",
        "1 travel journal",
        "Auto-renewal every year",
      ],
      price: {
        currency: "INR",
        originalAmount: "2400",
        amount: "2200",
        period: "/yr",
      },
      button: {
        text: "Get Everything!",
        bgColor: "bg-white",
        textColor: "text-purple-600",
      },
      variantId: VARIANT_ID_2,
      sellingPlanId: PRINT_SELLING_PLAN_ID,
    },
    {
      id: 2,
      type: "type1",
      title: "Digital Explorer",
      bgColor: "bg-white",
      textColor: "text-black",
      border: true,
      features: [
        "1 year subscription",
        "24 newspapers emailed monthly",
        "Printables",
        "1 travel journal",
        "Auto-renewal every year",
      ],
      price: {
        currency: "INR",
        amount: "1500",
        period: "/yr",
      },
      button: {
        text: "Go Digital!",
        bgColor: "bg-orange-500",
        textColor: "text-white",
      },
      variantId: VARIANT_ID_1,
      sellingPlanId: DIGITAL_SELLING_PLAN_ID,
    },
  ];

  const handlePricingButtonClick = async (type: string) => {
    setLoading(true);
    const plan = pricingData.find(p => p.type === type);
    if (!plan) {
      toast.error("Plan not found");
      setLoading(false);
      return;
    }

    // Check if selling plan ID is available
    if (!plan.sellingPlanId) {
      toast.error("Subscription plan not configured. Please contact support.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        items: [
          {
            attributes: [],
            quantity: 1,
            merchandiseId: `gid://shopify/ProductVariant/${plan.variantId}`,
            sellingPlanId: plan.sellingPlanId, // This enables auto-renewal!
          },
        ],
      };

      console.log("Creating auto-renewal checkout with payload:", payload);

      const response = await axios.post<ICheckoutResponse>(
        "/api/shopify?action=checkout",
        payload
      );

      if (response?.status === 200) {
        console.log("Checkout response:", response.data);

        if (
          response.data.checkout?.checkoutUrl &&
          response.data.checkout?.cartId
        ) {
          toast.success("✅ Redirecting to subscription checkout...");
          // Use window.open to prevent redirect issues
          const checkoutWindow = window.open(response.data.checkout.checkoutUrl, '_blank');
          if (!checkoutWindow) {
            // Fallback to direct redirect if popup blocked
            window.location.href = response.data.checkout.checkoutUrl;
          }
        } else {
          toast.error("❌ Checkout failed. Please try again.");
        }
      } else {
        console.error("Checkout failed:", response.data);
        toast.error("❌ Checkout failed. Please try again.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Checkout API error:", error.message);
      } else {
        console.error("Checkout API error:", error);
      }
      toast.error("❌ Checkout failed. Please try again.");
    } finally {
      setLoading(false);
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
    } catch (err) {
      toast.error("Failed to send request");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div id="pricing" className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <img
          src="/svgs/pricingBannerBg.svg"
          alt="pricing banner background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Choose your Subscription package
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get access to our premium travel content and exclusive features
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl">
          {pricingData.map((card) => (
            <div
              key={card.id}
              className={`${card.bgColor} ${card.textColor} rounded-2xl p-8 md:w-[372px] h-[444px] ${
                card.border ? "border border-[#2C2C2C]" : ""
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold">
                    {card.price.currency} {card.price.amount}
                  </span>
                  <span className="text-lg ml-1">{card.price.period}</span>
                </div>
                {card.price.originalAmount && (
                  <div className="text-sm opacity-75 line-through">
                    {card.price.currency} {card.price.originalAmount}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {card.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-current rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`${card.button.bgColor} ${card.button.textColor} cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                onClick={() => handlePricingButtonClick(card.type)}
                disabled={loading}
              >
                {loading ? 'Processing...' : card.button.text}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setOpenSample(true)}
            className="bg-[#FFC21A] text-[#1F2937] font-semibold px-8 py-3 rounded-full hover:brightness-95 transition-all cursor-pointer"
          >
            Free Sample Print Edition
          </button>
        </div>
      </div>

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

            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-2">
                Free Sample Print Edition
              </h3>
              <p className="text-[#6B7280] text-sm md:text-base">
                Get a free sample of our print edition delivered to your doorstep
              </p>
            </div>

            <form onSubmit={submitSample} className="space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Contact No
                  </label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your city"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your school name"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={downloading}
                  className={`w-full md:w-auto inline-flex items-center justify-center rounded-full bg-[#FFC21A] text-[#1F2937] font-semibold px-6 md:px-7 py-3 hover:brightness-95 cursor-pointer ${
                    downloading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {downloading ? 'Preparing download…' : 'Download The Sample Copy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
