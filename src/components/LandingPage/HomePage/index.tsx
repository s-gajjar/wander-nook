"use client";

// Next imports
import Image from "next/image";

// Images
import arrowVector from "@/public/svgs/arrowVector.svg";
import avatarShape1 from "@/public/svgs/avatarShape1.svg";
import avatarShape2 from "@/public/svgs/avatarShape2.svg";
import avatarShape3 from "@/public/svgs/avatarShape3.svg";
import beanVector from "@/public/svgs/beanVector.svg";
import playerVector from "@/public/svgs/playerVector.svg";
import purpleVector from "@/public/svgs/purpleVector.svg";
import remoteVector from "@/public/svgs/remoteVector.svg";
import squarePurpleVector from "@/public/svgs/squarePurpleVector.svg";

const HomePage = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="container mx-auto bg-white relative overflow-hidden">
      {/* Scattered Icons - Top Left */}
      <div className="absolute top-27 left-70 hidden md:block">
        <Image src={purpleVector} alt="Scattered Icons" width={65} height={52} />
      </div>

      {/* Scattered Icons - Top Right */}
      <div className="absolute top-14 right-90 hidden md:block">
        <Image src={beanVector} alt="Scattered Icons" width={33} height={33} />
      </div>

      {/* Scattered Icons - Mid Right */}
      <div className="absolute top-65 right-60 hidden md:block">
        <Image src={squarePurpleVector} alt="Scattered Icons" width={52} height={52} />
      </div>

      {/* Scattered Icons - Mid Left */}
      <div className="absolute top-90 left-80 hidden md:block">
        <Image src={playerVector} alt="Scattered Icons" width={54} height={54} />
      </div>

      {/* Scattered Icons - Bottom Right */}
      <div className="absolute bottom-55 right-90 hidden md:block">
        <Image src={remoteVector} alt="Scattered Icons" width={58} height={40} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center mt-26  px-4 relative z-10">
        {/* Headline */}
        <div className="flex flex-col items-center">
          <span className="text-[32px] w-[660px] md:text-[72px] font-semibold leading-[40px] md:leading-[86px] text-center text-[var(--font-black-shade-1)] ">
            Explore the world,{" "}
          </span>
          <span className="text-[var(--font-orange-main-color)] text-[32px] md:text-[72px] font-semibold leading-[40px] md:leading-[86px] text-center">
            one story at a time.
          </span>
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl w-full md:w-[720px] text-[var(--font-black-shade-2)] text-center mb-8 leading-6">
          Spark your child&apos;s imagination with news, puzzles, and adventures delivered right to
          your door.
        </p>

        {/* Call to Action Button */}
        <button 
          onClick={scrollToPricing}
          className="bg-[var(--font-orange-main-color)] cursor-pointer hover:bg-orange-600 text-[var(--font-white-shade-1)] font-semibold text-[20px] leading-6 px-8 py-4 rounded-[20px] transition-colors duration-300 mb-8 shadow-lg"
        >
          Subscribe Today
        </button>

        {/* Curved Arrow */}
        <div className="relative -top-10 -left-30 mb-8">
          <Image src={arrowVector} alt="Curved Arrow" width={45} height={50} />
        </div>

        {/* Testimonial Section */}
        <div className="flex flex-col relative items-center -top-15 ">
          {/* Profile Pictures */}
          <div className="flex space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Image
                src={avatarShape1}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Image
                src={avatarShape2}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Image
                src={avatarShape3}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
          </div>

          {/* Testimonial Text */}
          {/* <p className="text-[var(--font-blue-shade-1)] text-center w-[180px] text-base leading-5 font-normal">
            Thousands of parents trust our mission.
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
