import { notFound } from "next/navigation";

async function getPost(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/blog/${slug}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  const data = await res.json();
  return data.post as {
    title: string;
    excerpt?: string;
    coverImage?: string;
    images: Array<{ id: string; url: string; alt?: string }>;
    sections: Array<{
      id: string;
      order: number;
      type: "image-left" | "image-right";
      heading?: string;
      subheading?: string;
      content?: string;
      imageUrl?: string;
      imageAlt?: string;
    }>;
    publishedAt?: string;
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  const heroImg = post.coverImage || post.sections.find((s) => !!s.imageUrl)?.imageUrl;

  return (
    <main className="min-h-screen overflow-x-hidden blog-content">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Title + Excerpt */}
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-2 md:mb-3 blog-heading">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="text-base md:text-lg text-gray-600 leading-relaxed blog-text">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {/* Hero */}
        <div className="w-full mb-10 md:mb-14">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
            {heroImg ? (
              <img src={heroImg} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>
        </div>

        {/* Sections */}
        <section className="space-y-12 md:space-y-16">
          {post.sections.map((section, index) => (
            <div
              key={section.id}
              className={`grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-14 ${
                section.type === "image-right" ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              {/* Image */}
              <div className="w-full">
                {section.imageUrl && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                    <img
                      src={section.imageUrl}
                      alt={section.imageAlt || section.heading || "Section image"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="w-full">
                <div className="space-y-4 md:space-y-5">
                  {section.heading && (
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight blog-heading">
                      {section.heading}
                    </h2>
                  )}
                  {section.subheading && (
                    <h3 className="text-lg md:text-xl font-medium text-gray-700 leading-normal blog-heading">
                      {section.subheading}
                    </h3>
                  )}
                  {section.content && (
                    <div className="text-base md:text-lg leading-relaxed text-gray-700 blog-text">
                      {section.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Gallery */}
        {post.images?.length ? (
          <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {post.images.map((img) => (
              <div key={img.id} className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                <img src={img.url} alt={img.alt ?? "image"} className="absolute inset-0 h-full w-full object-cover" />
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
