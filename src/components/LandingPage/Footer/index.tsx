"use client";

// Next imports
import Image from "next/image";

// Images
import footerImage from "@/public/svgs/footerImage.svg";
import footerImageMobile from "@/public/svgs/footerImageMobile.svg";
import logoInstagram from "@/public/svgs/logoInstagram.svg";
import logoLinkedIn from "@/public/svgs/logoLinkedIn.svg";
import logoYouTube from "@/public/svgs/logoYouTube.svg";
import XLogo from "@/public/svgs/XLogo.svg";
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
    <footer className="bg-white border-t-2 border-b-2 border-l-2 border-dotted border-blue-300">
      <div className="mx-auto px-4 py-8">
        <div className="flex md:flex-row flex-col w-full justify-between items-start">
          {/* Left Side - Octopus Character */}
          <div className="flex justify-center md:justify-start mb-8 md:mb-0">
            <Image
              src={footerImage}
              alt="Footer Octopus Character"
              width={200}
              height={200}
              className="w-48 h-48 object-contain"
            />
          </div>

          {/* Center - Contact and Info */}
          <div className="flex-1 px-8">
            <div className="space-y-6">
              {/* Contact Section */}
              <div>
                <h3 className="text-xl font-bold text-black mb-2">Contact</h3>
                <p className="text-gray-600 mb-4">Reach out, Connect, and Start your Path to home</p>
              </div>

              {/* Looking for assistance */}
              <div>
                <h4 className="text-lg font-semibold text-black mb-2">Looking for assistance?</h4>
                <p className="text-gray-600">email@realestate.ca</p>
                <p className="text-gray-600">+62 986 098 9867</p>
              </div>

              {/* Copyright */}
              <div>
                <p className="text-gray-500 text-sm">2024, All rights Reserved</p>
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <Link href="#" className="text-black hover:text-gray-600 transition-colors">
                  <Image
                    src={XLogo}
                    alt="X (Twitter)"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
                <Link href="#" className="text-black hover:text-gray-600 transition-colors">
                  <Image
                    src={logoInstagram}
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
                <Link href="#" className="text-black hover:text-gray-600 transition-colors">
                  <Image
                    src={logoYouTube}
                    alt="YouTube"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
                <Link href="#" className="text-black hover:text-gray-600 transition-colors">
                  <Image
                    src={logoLinkedIn}
                    alt="LinkedIn"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Explore Links */}
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-black mb-4">Explore</h3>
            <div className="space-y-3">
              <button
                onClick={() => scrollToSection("home")}
                className="block text-gray-600 hover:text-black transition-colors text-left w-full"
              >
                Home
              </button>
              <button
                onClick={() => router?.push("/blog")}
                className="block text-gray-600 hover:text-black transition-colors text-left w-full"
              >
                Blogs
              </button>
              <button
                onClick={() => router?.push("/pricing")}
                className="block text-gray-600 hover:text-black transition-colors text-left w-full"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block text-gray-600 hover:text-black transition-colors text-left w-full"
              >
                Contact
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="flex justify-end mt-8">
          <div className="text-right">
            <div className="text-2xl font-bold">
              <span className="text-blue-800">WANDER</span>
              <span className="text-yellow-500 ml-2">NOOK</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
