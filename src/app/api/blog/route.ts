import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: { 
      sections: { orderBy: { order: "asc" } },
      categories: { include: { category: true } } 
    },
  });

  const mapped = posts.map((p) => {
    const sectionThumb = p.sections?.find((s) => !!s.imageUrl)?.imageUrl ?? undefined;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      thumbnail: p.coverImage || sectionThumb,
      publishedAt: p.publishedAt,
      categories: p.categories.map((pc) => pc.category.name),
    };
  });

  return NextResponse.json({ posts: mapped });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      coverImage,
      sections = [],
      categories = [],
      publish = true,
    } = body as {
      title: string;
      slug: string;
      excerpt?: string;
      coverImage?: string;
      sections?: Array<{
        type: "image-left" | "image-right";
        heading?: string;
        subheading?: string;
        content?: string;
        imageUrl?: string;
        imageAlt?: string;
      }>;
      categories?: string[];
      publish?: boolean;
    };

    // Normalize and deduplicate categories to avoid unique constraint errors on PostCategory
    const categoryNames = Array.from(
      new Set((categories || []).map((n) => n?.trim()).filter((n): n is string => !!n))
    );

    const categoryConnectOrCreate = categoryNames.map((name) => ({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    }));

    const firstSectionImage = sections.find((s) => !!s.imageUrl)?.imageUrl;

    const created = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage: coverImage || firstSectionImage,
        published: publish,
        publishedAt: publish ? new Date() : null,
        sections: {
          create: sections.map((section, index) => ({
            order: index,
            type: section.type,
            heading: section.heading,
            subheading: section.subheading,
            content: section.content,
            imageUrl: section.imageUrl,
            imageAlt: section.imageAlt,
          })),
        },
        categories: {
          create: categoryConnectOrCreate.map((c) => ({
            category: { connectOrCreate: c },
          })),
        },
      },
    });

    return NextResponse.json({ id: created.id, slug: created.slug });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
