// Next imports
import Image from "next/image";

// Images
import logo from "@/public/svgs/logo.svg";
import logoInstagram from "@/public/svgs/logoInstagram.svg";
import logoLinkedIn from "@/public/svgs/logoLinkedIn.svg";
import logoYoutube from "@/public/svgs/logoYouTube.svg";
import octopusVector from "@/public/svgs/octopusVector.svg";
import XLogo from "@/public/svgs/XLogo.svg";

// Icons
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white pt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          {/* Left Side - Playful Octopus Character */}
          <Image src={octopusVector} alt="Octopus" width={600} height={600} />

          {/* Right Side - Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Section */}
            <div className="w-[250px]">
              <h3 className="text-[20px] leading-6 font-semibold text-black mb-2">
                Contact
              </h3>
              <p className="text-[#707070] text-[16px] leading-[18px] font-normal mb-6">
                Reach out, Connect, and Start your Path to growth
              </p>

              <h4 className="text-[20px] leading-6 font-semibold text-black mb-2">
                Looking for assitance?
              </h4>
              <div className="mb-6">
                <p className="text-[#707070] text-[16px] leading-[18px] font-normal">
                  contact@wandernook.in
                </p>
                <p className="text-[#707070] text-[16px] leading-[18px] font-normal">
                  +91 9820067074
                </p>
              </div>

              <p className="text-[20px] leading-6 font-semibold text-black mb-2">
                2025, All rights Reserved
              </p>

              {/* Social Media Icons */}
              <div className="flex space-x-4 mt-4">
              
                <Link href="https://www.instagram.com/wandernooknewspaper/">
                  <Image
                    src={logoInstagram}
                    alt="Instagram"
                    width={33}
                    height={33}
                  />
                </Link>
              </div>
            </div>

            {/* Explore Section */}
            <div className="relative mb-10">
              <h3 className="text-2xl font-bold text-black mb-4">Explore</h3>
              <div className="space-y-3 mb-48">
                <a
                  href="#"
                  className="block text-gray-600 hover:text-black transition-colors"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="block text-gray-600 hover:text-black transition-colors"
                >
                  Blogs
                </a>
                <a
                  href="#"
                  className="block text-gray-600 hover:text-black transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#"
                  className="block text-gray-600 hover:text-black transition-colors"
                >
                  Contact
                </a>
              </div>
              {/* Logo */}
              <Image
                src={logo}
                alt="Wander Nook"
                width={363}
                height={48}
                className="absolute bottom-0 md:-left-20"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
