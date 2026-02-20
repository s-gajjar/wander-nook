import Image from "next/image";
import Link from "next/link";
import previewOne from "@/public/svgs/newsBlog1.jpg";
import previewTwo from "@/public/svgs/newsBlog2.jpg";
import previewThree from "@/public/svgs/newsBlog3.jpg";

const items = [
  {
    title: "Adventure Stories",
    description: "Nature explorations, travel snippets, and curiosity-led storytelling.",
    image: previewOne,
  },
  {
    title: "Creative Activities",
    description: "Printable projects and hands-on challenges for every issue theme.",
    image: previewTwo,
  },
  {
    title: "Mindful Learning",
    description: "Age-appropriate insights that make learning joyful and practical.",
    image: previewThree,
  },
];

export default function SampleIssuePreview() {
  return (
    <section id="sample-issue" className="bg-[#F8F4EA] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#885E2E]">
              Sample Issue Preview
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1A1208] sm:text-4xl">
              Peek Inside Wander Nook Before You Subscribe
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#4A3B2A]">
              Explore the kind of stories, activities, and learning experiences your child receives in
              every edition.
            </p>
          </div>

          <Link
            href="#pricing"
            className="inline-flex rounded-full border border-[#D7B98A] bg-white px-5 py-2.5 text-sm font-semibold text-[#50300C] shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            Request Sample + Subscribe
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-[#E6D6BC] bg-white shadow-[0_16px_24px_rgba(51,32,11,0.08)]"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#1E1408]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5E4A33]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
