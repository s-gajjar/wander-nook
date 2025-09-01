"use client";

// Next imports
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Images
import logo from "@/public/wander-logo.png";

const Navbar = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100/50" 
        : "bg-white"
    }`}>
      <div className="container mx-auto px-6 py-4 lg:py-6">
        <div className="mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="flex cursor-pointer items-center space-x-2"
            >
              <div className="relative">
                <Image
                  src={logo}
                  alt="Wander Nook Logo"
                  width={2000}
                  height={2000}
                  className="rounded-lg w-[260px] h-[35px] object-contain transition-all duration-300"
                />
                {/* Stroke effect using box-shadow */}
                <div className="absolute inset-0 rounded-lg w-[260px] h-[35px] bg-transparent border-2 border-gray-200/30 pointer-events-none"></div>
              </div>
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center space-x-6 lg:space-x-8">
            <Link
              href="/"
              className="text-[#F0624F] font-medium hover:text-[#d54a3a] transition-colors duration-200 text-sm lg:text-base"
            >
              Home
            </Link>
            <Link
              href="/blogs"
              className="text-[#555555] font-medium hidden hover:text-[#3a3a3a] transition-colors duration-200 text-sm lg:text-base"
            >
              Blogs
            </Link>
            <Link
              href="/pricing"
              className="text-[#555555] font-medium hidden hover:text-[#3a3a3a] transition-colors duration-200 text-sm lg:text-base"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-[#555555] font-medium hidden hover:text-[#3a3a3a] transition-colors duration-200 text-sm lg:text-base"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
