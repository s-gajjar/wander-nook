import LandingPage from "@/src/components/LandingPage";
import Navbar from "@/src/components/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="pt-16 lg:pt-24">
        <LandingPage />
      </div>
    </div>
  );
}
