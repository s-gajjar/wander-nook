// Next imports
import Image from "next/image";

// Images
import footballVector from "@/public/svgs/footballVector.svg";
import founderImage from "@/public/svgs/founderSection.svg";
import playerVector from "@/public/svgs/playerVector.svg";

const FounderSection = () => {
  return (
    <section className="bg-white container mx-auto py-16 relative">
      <div className="max-w-6xl mx-auto px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-8">
          <div className="flex-1 max-w-lg lg:text-left">
            <h2 className="md:text-[24px] text-[22px] leading-7 font-semibold text-[var(--font-black-shade-1)] mb-4">
              Meet Our Founder
            </h2>
            <h3 className="md:text-[42px] mb-6 text-[32px] leading-[36px] md:leading-12 font-semibold text-[var(--font-black-shade-1)]">
              Pranjali Salaye Shastri
            </h3>
            {/* <p className="text-[20px] leading-6 text-[#757575] mb-6">[WIREFRAME PLACEHOLDER]</p> */}
            <div className="space-y-4">
              <p className="text-base font-normal leading-[18px] text-[var(--font-black-shade-1)] mb-6">
                Hi! I’m <b>Pranjali Salaye Shastri</b>, a proud mom to a curious toddler who keeps
                me on my toes.
              </p>
              <p className="text-base font-normal leading-[18px] text-[var(--font-black-shade-1)]">
                I’ve always been a wildlife enthusiast, a nature lover, and someone who believes in
                living a life rooted in sustainability and conservation. These passions inspired me
                to create Wander Stamps—a playful and educational venture to spark curiosity in
                little ones about the world around them.
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <Image
              src={founderImage}
              alt="Sarah Johnson presenting"
              width={500}
              height={500}
              className="w-full max-w-md h-auto rounded-2xl object-cover"
            />
          </div>
        </div>

        <Image
          src={playerVector}
          alt="player-icon"
          width={51}
          height={51}
          className="w-[51px] h-[51px] absolute md:top-0 -top-14  md:right-1/2"
        />

        <Image
          src={footballVector}
          alt="football-vector"
          width={50}
          height={50}
          className="w-[50px] h-[50px] absolute md:-top-10 top-10 right-0 md:-right-20"
        />
      </div>
    </section>
  );
};

export default FounderSection;
