"use client";

import { useEffect, useState } from "react";
import { useUploadThing } from "@/src/utils/uploadthing";

export default function NewBlogAdminPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [sections, setSections] = useState<Array<{
    type: "image-left" | "image-right";
    heading?: string;
    subheading?: string;
    content?: string;
    imageUrl?: string;
    imageAlt?: string;
  }>>([]);
  const [categories, setCategories] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [sectionUploadingIndex, setSectionUploadingIndex] = useState<number | null>(null);
  const [coverProgress, setCoverProgress] = useState<number>(0);
  const [sectionProgressByIndex, setSectionProgressByIndex] = useState<Record<number, number>>({});

  const coverUploader = useUploadThing("blogImage", {
    onUploadProgress: ({ progress }) => setCoverProgress(Math.round(progress || 0)),
  });
  const sectionUploader = useUploadThing("blogImage", {
    onUploadProgress: ({ progress }) => {
      // handled inline per index when called
    },
  });

  // Client-side admin check (fallback if middleware not applied yet)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();
        if (mounted && !data?.isAdmin) {
          const next = encodeURIComponent("/admin/blog/new");
          window.location.replace(`/admin/login?next=${next}`);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
    if (!file.type.startsWith("image")) return file;
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const type = file.type.includes("png") ? "image/webp" : "image/jpeg";
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), type, quality));
    URL.revokeObjectURL(url);
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, type === "image/webp" ? ".webp" : ".jpg"), { type });
  }

  async function uploadWithProgress(file: File, setPct: (v: number) => void) {
    const compressed = await compressImage(file);
    const res = await coverUploader.startUpload([compressed]).catch(() => null);
    const first = res?.[0] as any;
    const url = first?.serverData?.url || first?.url;
    if (!url) throw new Error("No URL returned from upload endpoint");
    setPct(100);
    return url as string;
  }

  function addSection(type: "image-left" | "image-right") {
    setSections([...sections, { type }]);
  }

  function updateSection(index: number, field: string, value: string) {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title,
        slug,
        excerpt,
        coverImage,
        sections,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        publish: true,
      };
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/blog/${data.slug}`;
      } else {
        alert(data.error || "Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Create New Blog</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCoverUploading(true);
                setCoverProgress(0);
                try {
                  const url = await uploadWithProgress(file, setCoverProgress);
                  if (url) setCoverImage(url);
                } finally {
                  setCoverUploading(false);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {coverUploading && (
            <div className="text-sm text-gray-500 mt-1">Uploading cover… {coverProgress}%</div>
          )}
          {coverImage && (
            <img src={coverImage} alt="cover" className="mt-2 w-full h-32 object-cover rounded" />
          )}
        </div>

        <div>
          <label className="block font-medium mb-2">Content Sections</label>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="border p-4 rounded bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">
                    Section {index + 1} - {section.type === "image-left" ? "Image Left" : "Image Right"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove Section
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heading</label>
                    <input
                      type="text"
                      value={section.heading || ""}
                      onChange={(e) => updateSection(index, "heading", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subheading</label>
                    <input
                      type="text"
                      value={section.subheading || ""}
                      onChange={(e) => updateSection(index, "subheading", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={section.content || ""}
                    onChange={(e) => updateSection(index, "content", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Section Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSectionUploadingIndex(index);
                        setSectionProgressByIndex((p) => ({ ...p, [index]: 0 }));
                        try {
                          const compressed = await compressImage(file);
                          const res = await sectionUploader.startUpload([compressed]);
                          const first = res?.[0] as any;
                          const url = first?.serverData?.url || first?.url;
                          if (!url) throw new Error("No URL returned from upload endpoint");
                          updateSection(index, "imageUrl", url);
                          setSectionProgressByIndex((p) => ({ ...p, [index]: 100 }));
                        } finally {
                          setSectionUploadingIndex(null);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {sectionUploadingIndex === index && (
                    <div className="text-sm text-gray-500 mt-1">Uploading… {sectionProgressByIndex[index] || 0}%</div>
                  )}
                  {section.imageUrl && (
                    <img src={section.imageUrl} alt="section" className="mt-2 w-full h-32 object-cover rounded" />
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => addSection("image-left")}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                + Add Image Left Section
              </button>
              <button
                type="button"
                onClick={() => addSection("image-right")}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                + Add Image Right Section
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2">Categories (comma-separated)</label>
          <input
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Technology, Design, Business"
          />
        </div>

        <button
          disabled={loading || coverUploading || sectionUploadingIndex !== null}
          className="bg-purple-600 text-white px-6 py-3 rounded disabled:opacity-50 hover:bg-purple-700"
        >
          {loading ? "Publishing..." : coverUploading || sectionUploadingIndex !== null ? "Wait for uploads..." : "Publish Blog"}
        </button>
      </form>
    </main>
  );
}
