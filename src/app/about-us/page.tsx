"user client";

import ContactUs from "@/src/components/LandingPage/ContactUs";
import FAQs from "@/src/components/LandingPage/FAQs";
import Footer from "@/src/components/LandingPage/Footer";
import FounderSection from "@/src/components/LandingPage/FounderSection";
import OurMission from "@/src/components/LandingPage/OurMission";
import Navbar from "@/src/components/Navbar";
import Image from "next/image";
import logo from "@/public/wander-logo.png";
import OurStory from "@/src/components/AboutUs/OurStory";
import Banner from "@/src/components/Banner";
import aboutUsBannerBg from "@/public/svgs/aboutUsBannerBg.svg";

export default function AboutUs() {
  return (
    <div>
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <Banner text="About Us" imageSrc={aboutUsBannerBg} />
        <div className="flex justify-center pt-20 pb-10">
          <Image
            src={logo}
            alt="Wander Nook Logo"
            width={2000}
            height={2000}
            className="w-full max-w-sm md:max-w-5xl h-auto rounded-2xl object-cover"
          />
        </div>
        <OurStory />
        <OurMission />
        <FounderSection isIconShow={false} />
        <FAQs isIconShow={false} />
        <ContactUs />
        <Footer />
      </div>
    </div>
  );
}
