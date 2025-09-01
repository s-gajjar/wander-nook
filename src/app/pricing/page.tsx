"user client";

import pricingBannerBg from "@/public/svgs/pricingBannerBg.svg";
import Banner from "@/src/components/Banner";
import ContactUs from "@/src/components/LandingPage/ContactUs";
import FAQs from "@/src/components/LandingPage/FAQs";
import Footer from "@/src/components/LandingPage/Footer";
import Pricing from "@/src/components/LandingPage/Pricing";
import Navbar from "@/src/components/Navbar";

export default function AboutUs() {
  return (
    <div>
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <Banner text="Subscribe to wander nook" imageSrc={pricingBannerBg} />
        <Pricing />
        <FAQs isIconShow={false} />
        <ContactUs />
        <Footer />
      </div>
    </div>
  );
}
