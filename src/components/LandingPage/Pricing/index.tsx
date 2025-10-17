"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const Pricing = () => {
  const [openSample, setOpenSample] = useState(false);
  const [openCustomerForm, setOpenCustomerForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [redirecting, setRedirecting] = useState(false);

  // Customer form fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");

  // Valid Indian states for controlled selection
  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Puducherry", "Chandigarh"
  ];

  // Check if we're in test mode
  useEffect(() => {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (razorpayKey?.startsWith('rzp_test_')) {
      setIsTestMode(true);
    }
  }, []);

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
        amount: "2400",
        period: "/yr",
      },
      button: {
        text: "Get Everything!",
        bgColor: "bg-white",
        textColor: "text-purple-600",
      },
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID || "plan_RGGEByLCIXwHrL",
      requiresDelivery: true,
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
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_DIGITAL_PLAN_ID || "plan_RGGDvOBG7Ey6NK",
      requiresDelivery: false,
    },
  ];

  const handlePricingButtonClick = (type: string) => {
    const plan = pricingData.find(p => p.type === type);
    if (!plan) {
      toast.error("Plan not found");
      return;
    }

    setSelectedPlan(plan);
    setOpenCustomerForm(true);
  };

  const handleCustomerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    // Validation - check contact instead of customerPhone
    if (!customerName || !customerEmail || !contact) {
      toast.error("Please fill in name, email and contact number");
      return;
    }

    if (selectedPlan.requiresDelivery) {
      if (!customerAddress || customerAddress.trim().length < 10) {
        toast.error("Please enter a complete delivery address (min 10 chars)");
        return;
      }
      if (!customerCity || customerCity.trim().length < 2) {
        toast.error("Please enter a valid city");
        return;
      }
      if (!customerState || !INDIAN_STATES.includes(customerState)) {
        toast.error("Please select a valid state");
        return;
      }
      if (!/^[0-9]{6}$/.test(customerPincode)) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
    }

    setLoading(true);

    // Show test mode warning
    if (isTestMode) {
      toast.info("�� Test Mode: No real payment will be charged");
    }

    // Open a blank tab synchronously to avoid popup blockers
    const preOpenedTab =
      typeof window !== "undefined"
        ? window.open("about:blank", "_blank")
        : null;

    let subscriptionResponse: any = null;
    try {
      // Show loaders immediately to avoid initial white flash
      setRedirecting(true);
      if (preOpenedTab) {
        try {
          preOpenedTab.document.open();
          preOpenedTab.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Redirecting…</title><style>html,body{height:100%;margin:0;background:#0b0b0b;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Noto Sans",sans-serif} .wrap{height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px} .spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#FFC21A;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="wrap"><div class="spinner"></div><div>Taking you to secure payment…</div></div></body></html>`);
          preOpenedTab.document.close();
        } catch {}
      }
      console.log("Creating Razorpay subscription with plan:", selectedPlan.razorpayPlanId);

      // Combine country code and contact number
      const fullPhoneNumber = `${countryCode}${contact}`;

      const subscriptionPayload = {
        planId: selectedPlan.razorpayPlanId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: fullPhoneNumber, // Use the combined phone number
        ...(selectedPlan.requiresDelivery && {
          deliveryAddress: `${customerAddress}, ${customerCity}, ${customerState} - ${customerPincode}`,
          city: customerCity,
          state: customerState,
          pincode: customerPincode,
        }),
      };

      console.log("📞 DEBUG: Full phone number being sent:", fullPhoneNumber);

      subscriptionResponse = await axios.post("/api/razorpay?action=create-subscription", subscriptionPayload);

      if (subscriptionResponse?.status === 200 && subscriptionResponse.data.success) {
        console.log("Subscription response:", subscriptionResponse.data);

        if (subscriptionResponse.data.shortUrl) {
          toast.success("✅ Redirecting to payment...");
          if (subscriptionResponse.data.shopifyCustomer) {
            toast.success("✅ Customer created in Shopify!");
          }
          setOpenCustomerForm(false);

          if (preOpenedTab) {
            try {
              // Show a lightweight loader in the new tab before redirect to avoid white flash
              preOpenedTab.document.open();
              preOpenedTab.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Redirecting…</title><style>html,body{height:100%;margin:0;background:#0b0b0b;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Noto Sans",sans-serif} .wrap{height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px} .spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#FFC21A;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="wrap"><div class="spinner"></div><div>Taking you to secure payment…</div></div></body></html>`);
              preOpenedTab.document.close();
            } catch {}
            preOpenedTab.location.href = subscriptionResponse.data.shortUrl;
          } else {
            // Fallback: keep showing overlay on current tab until navigation happens
            window.location.href = subscriptionResponse.data.shortUrl;
          }
        } else {
          toast.error("❌ Failed to create subscription. Please try again.");
          preOpenedTab?.close();
        }
      } else {
        console.error("Subscription failed:", subscriptionResponse?.data);
        toast.error("❌ Subscription failed. Please try again.");
        preOpenedTab?.close();
        setRedirecting(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Subscription API error:", error.message);
      } else {
        console.error("Subscription API error:", error);
      }
      toast.error("❌ Subscription failed. Please try again.");
      preOpenedTab?.close();
      setRedirecting(false);
    } finally {
      setLoading(false);
      // If redirect began we keep overlay; otherwise ensure it's off
      setTimeout(() => {
        if (!subscriptionResponse?.data?.shortUrl) setRedirecting(false);
      }, 0);
    }
  };

  const submitSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDownloading(true);
      const res = await fetch("/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          contactNo: `${countryCode}${contact}`, 
          city, 
          schoolName: school 
        }),
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
      setCountryCode("+91"); // Reset to default
      const downloadUrl = data?.downloadPath || data?.pdfUrl;
      if (downloadUrl) {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "Wander Nook Launch.pdf";
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
      {redirecting && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-10 h-10 border-4 border-white/30 border-t-[#FFC21A] rounded-full animate-spin"></div>
            <div className="text-sm">Redirecting to secure payment…</div>
          </div>
        </div>
      )}
      <div className="md:w-[750px] w-full px-4 mt-4">
        <h2 className="md:text-[42px] text-[28px] text-center leading-[34px] md:leading-[50px] text-[var(--font-black-shade-1)] font-semibold ">
          Choose your Subscription package
        </h2>
        <p className="mt-3 text-[var(--font-black-shade-1)] w-full text-[16px] md:text-[20px] font-normal leading-5 md:leading-6 text-center ">
          Find your perfect plan and embark on an exciting journey of discovery.
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
              {'originalAmount' in card.price ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{card.price.currency}</span>
                  <span className="text-4xl font-bold">
                    {card.price.amount}
                  </span>
                  <span className="text-sm">{card.price.period}</span>
                  <span className="text-lg line-through ml-2">
                    {(card.price as any).originalAmount}
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
              className={`${card.button.bgColor} ${card.button.textColor} cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity`}
              onClick={() => handlePricingButtonClick(card.type)}
            >
              {card.button.text}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-lg text-gray-700">
          To view a sample PRINT edition,{" "}
          <button
            onClick={() => setOpenSample(true)}
            className="text-blue-600 underline hover:text-blue-800 font-medium cursor-pointer transition-colors"
          >
            click here
          </button>
        </p>
      </div>

      {/* Customer Details Form Modal */}
      {openCustomerForm && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-6"
          onClick={() => setOpenCustomerForm(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#FAF7E9] p-6 md:p-10 shadow-2xl border border-[#E7E3D2] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenCustomerForm(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 border border-[#E5E7EB] text-[#111827] hover:bg-white cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-2">
                Subscribe to {selectedPlan.title}
              </h3>
              <p className="text-[#6B7280] text-sm md:text-base">
                {selectedPlan.requiresDelivery 
                  ? "Please provide your details for subscription and delivery"
                  : "Please provide your details for subscription"
                }
              </p>
            </div>

            <form onSubmit={handleCustomerFormSubmit} className="space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Contact No *
                  </label>
                  <div className="flex">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="country-code-dropdown px-3 py-3 rounded-l-lg border border-r-0 border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none text-sm"
                    >
                      <option value="+91" style={{ backgroundColor: "#FAF7E9" }}>🇮🇳 +91</option>
                      <option value="+1" style={{ backgroundColor: "#FAF7E9" }}>🇺🇸 +1</option>
                      <option value="+44" style={{ backgroundColor: "#FAF7E9" }}>🇬🇧 +44</option>
                      <option value="+971" style={{ backgroundColor: "#FAF7E9" }}>🇦🇪 +971</option>
                      <option value="+65" style={{ backgroundColor: "#FAF7E9" }}>🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 10) {
                          setContact(value);
                        }
                      }}
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      className="flex-1 px-4 py-3 rounded-r-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {countryCode === "+91" ? "Enter your 10-digit Indian mobile number" : "Enter your phone number"}
                  </p>
                </div>

                {selectedPlan.requiresDelivery && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                        placeholder="Enter your complete delivery address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                        placeholder="Enter your city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        State *
                      </label>
                      <select
                        required
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none bg-white"
                      >
                        <option value="" disabled>Select state</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerPincode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v.length <= 6) setCustomerPincode(v);
                        }}
                        pattern="[0-9]{6}"
                        title="Please enter a valid 6-digit pincode"
                        className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full md:w-auto inline-flex items-center justify-center rounded-full bg-[#FFC21A] text-[#1F2937] font-semibold px-6 md:px-7 py-3 hover:brightness-95 cursor-pointer ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : `Subscribe to ${selectedPlan.title}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sample Form Modal */}
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
                    Contact No *
                  </label>
                  <div className="flex">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="country-code-dropdown px-3 py-3 rounded-l-lg border border-r-0 border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none text-sm"
                    >
                      <option value="+91" style={{ backgroundColor: "#FAF7E9" }}>🇮🇳 +91</option>
                      <option value="+1" style={{ backgroundColor: "#FAF7E9" }}>🇺🇸 +1</option>
                      <option value="+44" style={{ backgroundColor: "#FAF7E9" }}>🇬🇧 +44</option>
                      <option value="+971" style={{ backgroundColor: "#FAF7E9" }}>🇦🇪 +971</option>
                      <option value="+65" style={{ backgroundColor: "#FAF7E9" }}>🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 10) {
                          setContact(value);
                        }
                      }}
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      className="flex-1 px-4 py-3 rounded-r-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {countryCode === "+91" ? "Enter your 10-digit Indian mobile number" : "Enter your phone number"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-[#FFC21A] focus:border-transparent outline-none"
                    placeholder="Enter your city"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
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
