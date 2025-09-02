"use client";

// Next imports
import Image from "next/image";

// Images
import footerImage from "@/public/svgs/footerImage.svg";
import logoInstagram from "@/public/svgs/logoInstagram.svg";
import logo from "@/public/svgs/logoPng.png";

// Icons
import Link from "next/link";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <footer className="bg-white">
      <div className="mx-auto pl-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          {/* Right Side - Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Section */}
            <div className="">
              <h3 className="text-[20px] leading-6 font-semibold text-black mb-4">
                Contact
              </h3>
              <p className="text-[#707070] text-[16px] w-[250px] leading-[18px] font-normal mb-8">
                Reach out, Connect, and Start your Path to growth
              </p>

              <h4 className="text-[20px] leading-6 font-semibold text-black mb-4">
                Looking for assistance?
              </h4>
              <div className="mb-8">
                <p className="text-[#707070] text-[16px] leading-[18px] font-normal">
                  contact@wandernook.in
                </p>
                <p className="text-[#707070] text-[16px] leading-[18px] font-normal">
                  +91 9820067074
                </p>
              </div>

              <p className="text-[20px] leading-6 font-semibold text-black mb-4">
                2025, All rights Reserved
              </p>

              {/* Social Media Icons */}
              <div className="flex space-x-4 ">
                <Link href="https://www.instagram.com/wandernooknewspaper/">
                  <Image
                    src={logoInstagram}
                    alt="Instagram"
                    width={33}
                    height={33}
                  />
                </Link>
              </div>
              {/* Logo */}
              <Image
                src={logo}
                alt="Wander Nook"
                width={2000}
                height={2000}
                className="w-[450px] mt-10 mb-10 h-[45px] object-cover"
              />
            </div>

            {/* Explore Section */}
            <div className="relative mb-10">
              <h3 className="text-2xl font-bold text-black mb-4">Explore</h3>
              <div className="space-y-3 mb-48">
                <button
                  onClick={() => scrollToSection("home")}
                  className="block text-gray-600 hover:text-black transition-colors text-left w-full"
                >
                  Home
                </button>
                <button
                  onClick={() => router?.push("/subscription")}
                  className="block text-gray-600 hover:text-black transition-colors text-left w-full"
                >
                  Subscription
                </button>
                <button
                  onClick={() => router?.push("/about-us")}
                  className="block text-gray-600 hover:text-black transition-colors text-left w-full"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Left Side - Playful Octopus Character */}
          <div className="flex justify-center lg:justify-end">
            <Image src={footerImage} alt="Octopus" width={754} height={754} />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
