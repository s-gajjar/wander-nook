"use client";

// Next imports
import Image from "next/image";

// Images
import footerImage from "@/public/svgs/footerImage.svg";
import footerImageMobile from "@/public/svgs/footerImageMobile.svg";
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
      <div className="mx-auto md:pl-40 pl-4 md:pr-0 pr-4">
        <div className="flex md:flex-row flex-col w-full justify-between mt-12">
          {/* Right Side - Content */}
          <div className="flex items-start justify-start md:flex-row flex-col-reverse md:pt-52">
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
                className="sm:w-[400px] w-[300px] mt-10 mb-10 sm:h-[52px] h-[35px] object-cover"
              />
            </div>

            {/* Explore Section */}
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-black mb-4">Explore</h3>
              <div className="space-y-3 mb-12">
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
                  About us
                </button>
              </div>
            </div>
          </div>

          {/* Left Side - Playful Octopus Character */}
          <div className="flex justify-center lg:justify-end">
            <Image
              src={footerImage}
              alt="Footer Image"
              width={754}
              height={754}
              className="md:block hidden"
            />
            <Image
              src={footerImageMobile}
              alt="Footer Image"
              width={754}
              height={754}
              className="md:hidden block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
