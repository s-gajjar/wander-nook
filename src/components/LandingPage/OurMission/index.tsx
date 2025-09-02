"use client";
// React imports
import { useEffect, useRef, useState } from "react";

// Next imports
import Image from "next/image";

// Images
import abstractIcon from "@/public/svgs/abstractVector.svg";
import image1 from "@/public/svgs/ourMission1.svg";
import image2 from "@/public/svgs/ourMission2.svg";
import image3 from "@/public/svgs/ourMission3.svg";
import image4 from "@/public/svgs/ourMission4.svg";

const OurMission = () => {
  const [isInView, setIsInView] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  const [lastScrollY, setLastScrollY] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? "down" : "up";
      setScrollDirection(direction);
      setLastScrollY(currentScrollY);

      // Mark as scrolling
      setIsScrolling(true);

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to stop scrolling after 150ms of no scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setIsInView(isVisible);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY]);

  useEffect(() => {
    if (!isInView || !imagesRef.current || !isScrolling) return;

    let animationId: number;
    let currentPosition = 0;
    const imageWidth = 450; // Width of each image (w-[450px])
    const gap = 24; // Gap between images (gap-6 = 24px)
    const totalImages = 4;
    const totalWidth = (imageWidth + gap) * totalImages - gap; // Total width of all images + gaps
    const containerWidth = 1152; // Container width (max-w-7xl)
    const maxScrollLeft = 0; // Leftmost position (no scroll)
    const maxScrollRight = -(totalWidth - containerWidth); // Rightmost position

    // Get current position from transform
    const currentTransform = imagesRef.current.style.transform;
    if (currentTransform && currentTransform !== "none") {
      const match = currentTransform.match(/translateX\(([^)]+)px\)/);
      if (match) {
        currentPosition = parseFloat(match[1]);
      }
    }

    // Set boundaries
    if (currentPosition < maxScrollRight) currentPosition = maxScrollRight;
    if (currentPosition > maxScrollLeft) currentPosition = maxScrollLeft;

    const animate = () => {
      if (scrollDirection === "down") {
        // Scroll right to left
        currentPosition -= 3;
        if (currentPosition <= maxScrollRight) {
          currentPosition = maxScrollRight;
        }
      } else {
        // Scroll left to right
        currentPosition += 3;
        if (currentPosition >= maxScrollLeft) {
          currentPosition = maxScrollLeft;
        }
      }

      if (imagesRef.current) {
        imagesRef.current.style.transform = `translateX(${currentPosition}px)`;
      }

      // Continue animation only while scrolling
      if (isScrolling) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isInView, scrollDirection, isScrolling]);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 md:bg-white bg-[#8BFDEF] relative overflow-hidden"
    >
      <div className="md:max-w-7xl w-full pb-[330px] bg-[#F3F9FD] rounded-[20px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className=" rounded-3xl md:p-12 px-4 py-8 relative overflow-hidden">
          {/* Abstract Icon */}
          <Image
            src={abstractIcon}
            alt="abstractIcon"
            width={109}
            height={114}
            className="absolute top-10 right-5 md:block hidden"
          />

          {/* Content Section */}
          <div className="max-w-[740px]">
            {/* Tag */}
            <div className="inline-block bg-[#3EFBE433] text-[#022C40] px-4 py-2 rounded-full text-sm font-medium mb-6">
              About Our Mission
            </div>

            {/* Headline */}
            <h2 className="text-[28px] md:text-4xl font-semibold leading-[32px] md:leading-11 text-[#022C40] mb-6">
              Welcome to Wander Nook, a newspaper made just for kids! We believe
              that curiosity is the spark that leads to learning.
            </h2>

            {/* Body Text */}
            <p className="text-lg text-[#635D71] font-normal mb-8 leading-7">
              At Wander Nook, we reimagine news and learning to be positive,
              engaging, and age-appropriate for children aged 7 to 15. We
              carefully craft every issue to spark curiosity, encourage reading,
              and inspire young minds to think big. Our vision is simple: to
              raise a generation of readers, thinkers, and dreamers who look at
              the world with wonder and confidence.
            </p>

            {/* Contact Button */}
            <button
              onClick={scrollToContact}
              className="bg-[#3EFBE4] text-[#022C40] text-base px-6 py-2 rounded-[50px] font-semibold leading-6 transition-colors duration-200 md:absolute bottom-15 right-5"
            >
              Contact us
            </button>
          </div>

          {/* Images Section */}
        </div>
      </div>
      <div className="mt-12 absolute left-70  bottom-30">
        <div className="relative w-full">
          <div
            ref={imagesRef}
            className="flex gap-6 transition-transform duration-1000 ease-out"
            style={{
              transform: "translateX(0)",
              transition: isInView ? "none" : "transform 0.5s ease-out",
            }}
          >
            {/* Image 1 - Woman and boy with blocks */}
            <div className="flex-shrink-0 w-[450px] h-[295px] rounded-[20px] overflow-hidden">
              <Image src={image1} alt="image" width={450} height={295} />
            </div>

            {/* Image 2 - Woman and boy building tower */}
            <div className="flex-shrink-0 w-[450px] h-[295px] rounded-[20px] overflow-hidden">
              <Image src={image2} alt="image" width={450} height={295} />
            </div>

            {/* Image 3 - Woman and girls in park */}
            <div className="flex-shrink-0 w-[450px] h-[295px] rounded-[20px] overflow-hidden">
              <Image src={image3} alt="image" width={450} height={295} />
            </div>

            {/* Image 4 - Additional image for smooth loop */}
            <div className="flex-shrink-0 w-[450px] h-[295px] rounded-[20px] overflow-hidden">
              <Image src={image4} alt="image" width={450} height={295} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurMission;
