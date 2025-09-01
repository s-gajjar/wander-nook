"use client";

// Next imports
import Image from "next/image";

// Images
import teddyBearVector from "@/public/svgs/teddyBearVector.svg";
import youtubeVector from "@/public/svgs/youtubeVector.svg";

const NewsBlogs = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Array of JSON data for the article cards
  const articles = [
    {
      id: 1,
      image: "/svgs/newsBlog1.svg", // Using existing SVG as placeholder
      title: "The Butterfly Migration",
      description: "Follow millions of butterflies on their incredible journey...",
      readMoreText: "Read More!",
    },
    {
      id: 2,
      image: "/svgs/newsBlog2.svg", // Using existing SVG as placeholder
      title: "The Butterfly Migration",
      description: "Follow millions of butterflies on their incredible journey...",
      readMoreText: "Read More!",
    },
    {
      id: 3,
      image: "/svgs/newsBlog3.svg", // Using existing SVG as placeholder
      title: "The Butterfly Migration",
      description: "Follow millions of butterflies on their incredible journey...",
      readMoreText: "Read More!",
    },
  ];

  return (
    <div className="bg-white flex flex-col items-center justify-center container mx-auto py-16 px-4 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto">
        {/* Header Section */}
        <div className="flex px-4 items-center justify-start gap-4 mb-12 ">
          {/* Left Icon - Purple rounded square with play triangle */}

          {/* Main Title */}
          <div className="relative">
            <Image
              src={youtubeVector}
              alt="Player-Vector"
              width={35}
              height={28}
              className="absolute top-5 -left-25"
            />
            <h2 className="md:text-4xl text-[28px] font-bold text-gray-800 text-left">
              Peek Inside This Month&apos;s Issue
            </h2>
            <Image
              src={teddyBearVector}
              alt="TeddyBear-Vector"
              width={30}
              height={30}
              className="absolute top-0 md:-top-3 right-0 md:-right-25"
            />
          </div>
        </div>

        {/* Article Cards Section */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white w-[290px] md:w-[337px] rounded-[20px] border border-[#D9D9D9] px-6 py-6 overflow-hidden flex-shrink-0"
            >
              {/* Article Image */}
              <div className="w-full md:w-[289px] h-[160px] flex items-center justify-center rounded-[8px] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  width={289}
                  height={160}
                  className="w-[250px] md:w-[289px] h-[160px] rounded-[8px] object-contain"
                />
              </div>

              {/* Article Content */}
              <div className="pt-6">
                <h3 className="text-[24px] leading-7 font-semibold text-[var(--font-black-shade-1)] mb-3">
                  {article.title}
                </h3>
                <p className="text-[#757575] font-normal text-sm mb-4">{article.description}</p>
                <button className="w-[120px] bg-[#6A43D799] text-sm font-normal text-[var(--font-white-shade-1)] py-3 px-4 rounded-[22px] hover:bg-purple-500 cursor-pointer transition-colors">
                  {article.readMoreText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <button 
            onClick={scrollToPricing}
            className="w-[290px] md:w-[340px] bg-[#FBCE3E] text-white py-4 px-8 leading-6 font-semibold rounded-[20px] text-[16px] md:text-[20px]  hover:bg-yellow-400 cursor-pointer transition-colors"
          >
            Want More? Subscribe Now!
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsBlogs;
