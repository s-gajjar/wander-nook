"use client";

// Next imports
import Image from "next/image";

// Images
import heroSection from "@/public/svgs/heroSection.png";

const HomePage = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div id="home" className="w-full h-full bg-[#F2EF221A]">
      <div className="container mx-auto relative overflow-hidden">
        {/* Main Content */}
        <div className="md:pt-16 pt-10 md:pr-22 md:pl-28 px-5 flex flex-col md:flex-row flex-wrap justify-between items-center">
          <div className="md:w-[50%] w-full flex flex-col items-start justify-center">
            <h1 className="md:mb-8 mb-5 mt-10 md:text-[72px] text-[42px] md:w-[90%] w-full md:leading-[80px] leading-[50px] font-semibold text-[var(--font-black-shade-1)] md:capitalize text-center md:text-left">
              Explore the world,{" "}
              <span className="text-[#FBC017] md:capitalize">
                one story at a time.
              </span>
            </h1>
            <p className="md:mb-16 mb-8 md:text-[20px] text-[16px] md:w-[90%] w-full md:leading-[24px] leading-[18px] font-normal text-[var(--font-black-shade-1)] text-center md:text-left">
              Spark your child&apos;s imagination with news, puzzles, and
              adventures delivered right to your door.
            </p>
            <div className="w-full flex justify-center md:justify-start">
              <button
                onClick={scrollToPricing}
                className="md:mb-34  bg-[#FBC017] text-[#210079] font-semibold text-[20px] px-6 py-3 rounded-full"
              >
                Subscribe Today
              </button>
            </div>
          </div>
          <div className="md:mb-20 mb-14 md:w-[36%] w-full flex items-center justify-center">
            <Image
              src={heroSection}
              alt="Home Page Image"
              width={2000}
              height={2000}
              className="w-full max-w-[489px] max-h-[606px] h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
