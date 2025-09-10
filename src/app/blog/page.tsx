"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  thumbnail?: string;
  publishedAt?: string;
  categories?: string[];
};

export default function BlogListPage() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/blog`, { cache: "no-store" });
        const data = await res.json();
        if (!isMounted) return;
        setPosts((data?.posts || []) as PostListItem[]);
      } catch (e) {
        console.error("Failed to load posts", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => (p.categories || []).forEach((c) => set.add(c)));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCategory =
        activeCategory === "All" || (p.categories || []).includes(activeCategory);
      const text = `${p.title} ${p.excerpt ?? ""}`.toLowerCase();
      const matchQuery = q === "" || text.includes(q);
      return matchCategory && matchQuery;
    });
  }, [posts, query, activeCategory]);

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3E9FF] text-[#7F56D9]">✦</span>
        <h1 className="text-3xl md:text-4xl font-semibold">Free Sample Articles</h1>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-gray-200 pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#7F56D9]"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm transition border ${
              activeCategory === cat
                ? "bg-[#7F56D9] text-white border-[#7F56D9]"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post) => {
            const img = post.thumbnail || post.coverImage;
            return (
              <div
                key={post.id}
                className="rounded-2xl border border-[#E5E7EB] p-4 md:p-6 hover:shadow-sm transition bg-white"
              >
                <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={post.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt ?? ""}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-block rounded-full bg-[#B794F4] text-white text-sm px-4 py-2 hover:bg-[#A57BEF]"
                >
                  Read More!
                </Link>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-gray-500">No articles found.</p>
          )}
        </div>
      )}
    </main>
  );
}
