import ContactUs from "./ContactUs";
import FAQs from "./FAQs";
import Footer from "./Footer";
import FounderSection from "./FounderSection";
import HomePage from "./HomePage";
import KeyBenefits from "./KeyBenefits";
import NewsBlogs from "./NewsBlogs";
import Pricing from "./Pricing";
import ProductShowcase from "./ProductShowCase";

const LandingPage = () => {
  return (
    <>
      <HomePage />
      <KeyBenefits />
      <ProductShowcase />
      <Pricing />
      {/* <OurMission /> */}
      <FounderSection />
      <NewsBlogs />
      <FAQs />
      <ContactUs />
      <Footer />
    </>
  );
};

export default LandingPage;
