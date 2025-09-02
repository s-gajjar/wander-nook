"use client";

// Next imports
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Images
import logo from "@/public/wander-logo.png";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenuAndNavigate = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  return (
    <nav
      className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100/50"
          : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 lg:py-6">
        <div className="mx-auto w-full flex items-center justify-between relative">
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
                  className="rounded-lg w-[160px] h-[22px] sm:w-[200px] sm:h-[28px] md:w-[240px] md:h-[32px] object-contain transition-all duration-300"
                />
                {/* Stroke effect using box-shadow */}
                <div className="absolute inset-0 rounded-lg w-[160px] h-[22px] sm:w-[200px] sm:h-[28px] md:w-[240px] md:h-[32px] bg-transparent border-2 border-gray-200/30 pointer-events-none"></div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              href="/"
              className={`${
                pathname === "/" ? "text-[#F0624F]" : "text-[#555555]"
              } font-medium hover:text-[#d54a3a] transition-colors duration-200 text-sm lg:text-base`}
            >
              Home
            </Link>
            <Link
              href="/about-us"
              className={`${
                pathname === "/about-us" ? "text-[#F0624F]" : "text-[#555555]"
              } font-medium hover:text-[#d54a3a] transition-colors duration-200 text-sm lg:text-base`}
            >
              About Us
            </Link>
            <Link
              href="/pricing"
              className={`${
                pathname === "/pricing" ? "text-[#F0624F]" : "text-[#555555]"
              } font-medium hover:text-[#d54a3a] transition-colors duration-200 text-sm lg:text-base`}
            >
              Pricing
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              aria-label="Toggle navigation menu"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#555555] hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              {isMenuOpen ? (
                // Close (X) icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel with Animation */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="md:hidden fixed inset-0 bg-black/20"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden
              />

              {/* Dropdown panel */}
              <motion.div
                key="menu"
                id="mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="md:hidden absolute left-0 right-0 mt-2 px-4"
              >
                <div className="rounded-lg shadow-md border border-gray-100 bg-white overflow-hidden">
                  <button
                    onClick={() => closeMenuAndNavigate("/")}
                    className={`w-full text-left px-4 py-3 ${
                      pathname === "/" ? "text-[#F0624F]" : "text-[#555555]"
                    } hover:bg-gray-50`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => closeMenuAndNavigate("/about-us")}
                    className={`w-full text-left px-4 py-3 ${
                      pathname === "/about-us" ? "text-[#F0624F]" : "text-[#555555]"
                    } hover:bg-gray-50`}
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => closeMenuAndNavigate("/pricing")}
                    className={`w-full text-left px-4 py-3 ${
                      pathname === "/pricing" ? "text-[#F0624F]" : "text-[#555555]"
                    } hover:bg-gray-50`}
                  >
                    Pricing
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
