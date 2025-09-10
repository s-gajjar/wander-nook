"use client";

import { VARIANT_ID_1, VARIANT_ID_2 } from "@/src/config";
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
        "1 year",
        "24 newspapers delivered fortnightly",
        "Printables",
        "1 travel journal",
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
      sellingPlanId: process.env.NEXT_PUBLIC_PRINT_SELLING_PLAN_ID || "", // You'll need to add this to .env
    },
    {
      id: 2,
      type: "type1",
      title: "Digital Explorer",
      bgColor: "bg-white",
      textColor: "text-black",
      border: true,
      features: [
        "1 Year",
        "24 newspapers emailed fortnightly",
        "Printables",
        "1 travel journal",
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
      sellingPlanId: process.env.NEXT_PUBLIC_DIGITAL_SELLING_PLAN_ID || "", // You'll need to add this to .env
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

    try {
      // For now, we'll use the existing checkout flow
      // In a real implementation, you'd need to:
      // 1. Create a customer account first
      // 2. Then create a subscription contract
      
      const payload = {
        items: [
          {
            attributes: [],
            quantity: 1,
            merchandiseId: `gid://shopify/ProductVariant/${plan.variantId}`,
            sellingPlanId: plan.sellingPlanId, // This enables autopay
          },
        ],
      };

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
          toast.success("✅ Redirecting to checkout...");
          window.location.href = response.data.checkout.checkoutUrl;
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
        // Force download via hidden link to our proxy which sets Content-Disposition
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
    <div
      id="pricing"
      className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="md:w-[750px] w-full px-4 mt-4">
        <h2 className="md:text-[42px] text-[28px] text-center leading-[34px] md:leading-[50px] text-[var(--font-black-shade-1)] font-semibold ">
          Choose your Subscription package
        </h2>
        <p className="mt-3 text-[var(--font-black-shade-1)] w-full text-[16px] md:text-[20px] font-normal leading-5 md:leading-6 text-center ">
          Find your perfect plan and embark on an exciting journey of discovery.
        </p>
        <p className="mt-6 text-center text-[15px] md:text-[16px] leading-5 md:leading-6">
          To view a sample PRINT edition, {" "}
          <button
            onClick={() => setOpenSample(true)}
            className="text-[#6A43D7] underline cursor-pointer"
          >
            click here
          </button>
        </p>
      </div>
      
      {/* Pricing Cards */}
      <div className="flex flex-wrap items-center justify-center px-5 gap-16 mt-12">
        {pricingData.map((card) => (
          <div
            key={card.id}
            className={`${card.bgColor} ${
              card.textColor
            } rounded-2xl p-8 md:w-[372px] h-[444px] ${
              card.border ? "border border-[#2C2C2C]" : ""
            }`}
          >
            <h3 className="md:text-[28px] leading-7 text-[24px] md:leading-[33px] font-semibold mb-6">
              {card.title}
            </h3>
            <ul className="space-y-3 ml-4 mb-8">
              {card.features.map((feature, index) => (
                <li
                  key={index + 1}
                  className="flex text-[16px] md:text-[20px] leading-[18px] md:leading-[24px] font-normal items-center"
                >
                  <span className="w-2 h-2 bg-current rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mb-8">
              {card.price.originalAmount ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{card.price.currency}</span>
                  <span className="text-4xl font-bold">
                    {card.price.amount}
                  </span>
                  <span className="text-sm">{card.price.period}</span>
                  <span className="text-lg line-through ml-2">
                    {card.price.originalAmount}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{card.price.currency}</span>
                  <span className="text-4xl font-bold">
                    {card.price.amount}
                  </span>
                  <span className="text-sm">{card.price.period}</span>
                </div>
              )}
            </div>
            <button
              className={`${card.button.bgColor} ${card.button.textColor} cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={() => handlePricingButtonClick(card.type)}
              disabled={loading}
            >
              {loading ? 'Processing...' : card.button.text}
            </button>
            <p className="text-xs mt-2 text-center opacity-75">
              🔄 Auto-renewal enabled
            </p>
          </div>
        ))}
      </div>

      {/* Sample Print Modal */}
      {openSample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-6"
          onClick={() => setOpenSample(false)}
        >
          {/* Outer soft panel */}
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#FAF7E9] p-6 md:p-10 shadow-2xl border border-[#E7E3D2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
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

            {/* Inner card */}
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
                    <label className="block text-[15px] font-medium text-[#0F1728] mb-2">School Name</label>
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
                    className={`w-full md:w-auto inline-flex items-center justify-center rounded-full bg-[#FFC21A] text-[#1F2937] font-semibold px-6 md:px-7 py-3 hover:brightness-95 cursor-pointer ${downloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {downloading ? 'Preparing download…' : 'Download The Sample Copy'}
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
