"use client";
// Next imports
import Image from "next/image";

// Images
import benefits1 from "@/public/svgs/benefits1.svg";
import benefits3 from "@/public/svgs/benefits3.svg";
import benefitsIcon1 from "@/public/svgs/benefitsAvatar1.svg";
import benefitsIcon2 from "@/public/svgs/benefitsAvatar2.svg";
import benefitsIcon3 from "@/public/svgs/benefitsAvatar3.svg";

const KeyBenefits = () => {
  // JSON array containing all card data
  const benefitsData = [
    {
      id: 1,
      bgColor: "bg-[var(--font-orange-main-color)]",
      icon: benefitsIcon1,
      heading: "Educational Content Made Exciting",
      bodyText:
        "We make learning an adventure! Our content covers everything from science to history, making education a joyful journey.",
      bgImage: benefits1,
      textColor: "text-white",
    },
    {
      id: 2,
      bgColor: "bg-[#B022F2]",
      icon: benefitsIcon2,
      heading: "Age-Appropriate News & Stories",
      bodyText:
        "Every issue is crafted for young minds, presenting news in an easy-to-understand way that sparks curiosity.",
      bgImage: benefits3,
      textColor: "text-white",
    },
    {
      id: 3,
      bgColor: "bg-[#3EFBE4]",
      icon: benefitsIcon3,
      heading: "Fun Activities & Puzzles",
      bodyText:
        "Puzzles, vibrant coloring pages, and activities are packed into every Wander Nook issue, providing a playful way to spark creativity and critical thinking.",
      bgImage: benefits3,
      textColor: "text-[#210079]",
    },
  ];

  return (
    <div id="home" className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* <div className="w-[110px] h-[33px] flex items-center justify-center rounded-[50px] bg-[#6A43D733] ">
        <p className="text-sm font-normal text-[var(--font-purple-shade-1)] leading-4">
          Key Benefits
        </p>
      </div> */}
      <div className="md:w-[640px] w-full mt-4">
        <h2 className="md:text-[42px] text-[28px] text-center leading-[34px] md:leading-[50px] text-[var(--font-black-shade-1)] font-semibold ">
          Why Kids Love Wander Nook
        </h2>
        <p className="mt-3 text-[var(--font-black-shade-1)] w-full text-[16px] md:text-[20px] font-normal leading-5 md:leading-6 text-center ">
          Beyond the Headlines: Fun, Learning, and Adventure in Every Issue.
        </p>
      </div>
      {/* Key Benefits Cards */}
      <div className="flex items-center justify-center mt-12 flex-wrap gap-6 relative">
        {benefitsData.map((benefit, index) => (
          <div
            key={benefit.id + index}
            className={`${benefit.bgColor} rounded-2xl p-6 w-full md:w-[340px] h-[370px] relative overflow-hidden shadow-lg `}
          >
            {/* Background decorative image */}
            <div className="absolute top-0 right-0 text-6xl z-10 ">
              <Image
                src={benefit.bgImage}
                alt={benefit.heading}
                width={2000}
                height={2000}
                className="w-full h-full"
              />
            </div>

            {/* Icon */}
            <div className="flex flex-col relative z-20 justify-between h-full">
              <div>
                <Image
                  src={benefit.icon}
                  alt={benefit.heading}
                  width={2000}
                  height={2000}
                  className="w-14 h-14 mb-3"
                />

                {/* Heading */}
                <h3 className={`${benefit.textColor} text-[24px] font-semibold mb-4 leading-7`}>
                  {benefit.heading}
                </h3>
              </div>

              {/* Body text */}
              <p className={`${benefit.textColor} font-normal text-base leading-[18px]`}>
                {benefit.bodyText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyBenefits;
