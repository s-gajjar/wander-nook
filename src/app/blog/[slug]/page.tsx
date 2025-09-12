import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";

async function getPost(slug: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { 
        categories: { include: { category: true } },
        sections: { orderBy: { order: "asc" } }
      },
    });

    if (!post) return null;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      sections: post.sections,
      categories: post.categories.map((pc) => pc.category.name),
    };
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return null;
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

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

        {/* Cover Image Only */}
        {post.coverImage && (
          <div className="w-full mb-10 md:mb-14">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
              <img src={post.coverImage} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* Sections - Text Only */}
        <section className="space-y-8 md:space-y-12">
          {post.sections.map((section, index) => (
            <div key={section.id} className="w-full">
              <div className="space-y-4 md:space-y-6">
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
          ))}
        </section>
      </div>
    </main>
  );
}
