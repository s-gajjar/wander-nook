import ContactUs from "./ContactUs";
import FAQs from "./FAQs";
import Footer from "./Footer";
import HomePage from "./HomePage";
import KeyBenefits from "./KeyBenefits";
import NewsBlogs from "./NewsBlogs";
import Pricing from "./Pricing";

const LandingPage = () => {
  return (
    <>
      <HomePage />
      <NewsBlogs />
      <Pricing />
      <KeyBenefits />
      <FAQs />
      <ContactUs />
      <Footer />
    </>
  );
};

export default LandingPage;
