import ContactUs from "./ContactUs";
import FAQs from "./FAQs";
import Footer from "./Footer";
import FounderSection from "./FounderSection";
import HomePage from "./HomePage";
import KeyBenefits from "./KeyBenefits";
import NewsBlogs from "./NewsBlogs";
import NewsletterAutomation from "./NewsletterAutomation";
import Pricing from "./Pricing";
import SampleIssuePreview from "./SampleIssuePreview";

const LandingPage = () => {
  return (
    <>
      <HomePage />
      <KeyBenefits />
      <Pricing />
      <SampleIssuePreview />
      <NewsletterAutomation />
      <FounderSection />
      <NewsBlogs />
      {/* <ProductShowcase /> */}
      {/* <OurMission /> */}
      <FAQs />
      <ContactUs />
      <Footer />
    </>
  );
};

export default LandingPage;
