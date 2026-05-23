import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { 
      images: true, 
      categories: { include: { category: true } },
      sections: { orderBy: { order: "asc" } }
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      images: post.images,
      sections: post.sections,
      categories: post.categories.map((pc) => pc.category.name),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminRequest(req)) return adminUnauthorizedJson();

  const { slug } = await params;
  const deleted = await prisma.post.delete({ where: { slug } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
