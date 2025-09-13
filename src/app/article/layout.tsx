import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/LandingPage/Footer";

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <div className="pt-16 lg:pt-24">
        {children}
      </div>
      <Footer />
    </div>
  );
}
