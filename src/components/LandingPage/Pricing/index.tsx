"use client";

import { VARIANT_ID_1, VARIANT_ID_2 } from "@/src/config";
import { ICheckoutResponse } from "@/src/utils/types";
import axios from "axios";
import { toast } from "sonner";

const Pricing = () => {
  const pricingData = [
    {
      id: 1,
      type: "type2",
      title: "Print Edition",
      bgColor: "bg-purple-600",
      textColor: "text-white",
      border: false,
      features: ["1 year", "24 newspapers delivered fortnightly", "Printables", "1 travel journal"],
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
    },
    {
      id: 2,
      type: "type1",
      title: "Digital Explorer",
      bgColor: "bg-white",
      textColor: "text-black",
      border: true,
      features: ["1 Year", "24 newspapers emailed fortnightly", "Printables", "1 travel journal"],
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
    },
  ];

  const handlePricingButtonClick = async (type: string) => {
    const variantId = type === "type1" ? VARIANT_ID_1 : VARIANT_ID_2;

    // Open a blank tab synchronously to avoid popup blockers
    const preOpenedTab = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

    try {
      const payload = {
        items: [
          {
            attributes: [],
            quantity: 1,
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
          },
        ],
      };

      const response = await axios.post<ICheckoutResponse>("/api/shopify?action=checkout", payload);

      if (response?.status === 200) {
        console.log("Checkout response:", response.data);

        if (response.data.checkout?.checkoutUrl && response.data.checkout?.cartId) {
          toast.success("✅ Checkout successful!");

          const checkoutUrl = response.data.checkout.checkoutUrl;

          if (preOpenedTab) {
            preOpenedTab.location.href = checkoutUrl;
          } else {
            // Fallback if the tab could not be opened (blocked): navigate in the same tab
            window.location.href = checkoutUrl;
          }
        } else {
          toast.error("❌ Checkout failed. Please try again.");
          // Close the pre-opened tab if we can't proceed
          preOpenedTab?.close();
        }
      } else {
        console.error("Checkout failed:", response.data);
        toast.error("❌ Checkout failed. Please try again.");
        preOpenedTab?.close();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Checkout API error:", error.message);
      } else {
        console.error("Checkout API error:", error);
      }
      // Close the pre-opened tab on error
      preOpenedTab?.close();
    }
  };

  return (
    <div
      id="pricing"
      className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* <div className="w-[110px] h-[33px] flex items-center justify-center rounded-[50px] bg-[#6A43D733] ">
        <p className="text-sm font-normal text-[var(--font-purple-shade-1)] leading-4">Pricing</p>
      </div> */}
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
            className={`${card.bgColor} ${card.textColor} rounded-2xl p-8 md:w-[372px] h-[444px] ${
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
                  <span className="text-4xl font-bold">{card.price.amount}</span>
                  <span className="text-sm">{card.price.period}</span>
                  <span className="text-lg line-through ml-2">{card.price.originalAmount}</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{card.price.currency}</span>
                  <span className="text-4xl font-bold">{card.price.amount}</span>
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

      <p className="mt-10 text-center text-[13px] md:text-[16px] leading-4 md:leading-5 font-normal">
        To view a sample PRINT edition,{" "}
        <button className="text-[#6A43D7] underline cursor-pointer">click here</button>
      </p>
    </div>
  );
};

export default Pricing;
