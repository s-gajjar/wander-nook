"use client";

// React imports
import { useState, useEffect } from "react";

// Next imports
import Image from "next/image";
import Link from "next/link";

// Images
import teddyBearVector from "@/public/svgs/teddyBearVector.svg";
import youtubeVector from "@/public/svgs/youtubeVector.svg";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  thumbnail?: string;
  publishedAt?: string;
  categories?: string[];
};

const NewsBlogs = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/article');
        const data = await res.json();
        // Get the first 3 articles for the homepage
        setArticles((data?.posts || []).slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div
      id="articles"
      className="bg-white flex flex-col items-center justify-center container mx-auto py-16 px-4 overflow-hidden"
    >
      <div className="max-w-6xl w-full mx-auto">
        {/* Header Section */}
        <div className="flex px-4 items-center justify-start gap-4 mb-12 ">
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
              Latest Articles & Sample Content
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
          {loading ? (
            // Loading state
            <div className="text-center text-gray-500">
              <p>Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            // No articles state
            <div className="text-center text-gray-500">
              <p>No articles available at the moment.</p>
            </div>
          ) : (
            // Render articles
            articles.map((article) => (
              <div
                key={article.id}
                className="bg-white w-[290px] md:w-[337px] rounded-[20px] border border-[#D9D9D9] px-6 py-6 overflow-hidden flex-shrink-0"
              >
                {/* Article Image */}
                <div className="w-full md:w-[289px] h-[250px] flex items-center justify-center rounded-[8px] overflow-hidden bg-gray-100 mb-4">
                  {article.thumbnail || article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.thumbnail || article.coverImage!}
                      alt={article.title}
                      className="w-full h-full rounded-[8px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>📄</span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="space-y-3">
                  <h3 className="text-[20px] md:text-[24px] leading-6 md:leading-7 font-semibold text-[var(--font-black-shade-1)] line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {article.excerpt && (
                    <p className="text-sm md:text-base text-gray-600 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  {article.categories && article.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.categories.slice(0, 2).map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/article/${article.slug}`}
                    className="inline-block bg-[#B794F4] text-white text-sm px-4 py-2 rounded-full hover:bg-[#A57BEF] transition-colors"
                  >
                    Read More!
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Articles Link */}
        <div className="text-center mb-8">
          <Link
            href="/article"
            className="inline-block text-[#7F56D9] hover:text-[#6B46C1] font-semibold text-lg underline"
          >
            View All Articles →
          </Link>
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
