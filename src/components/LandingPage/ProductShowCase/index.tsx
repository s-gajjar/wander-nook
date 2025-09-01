// Next imports
import Image from "next/image";

// Images
import showcase1 from "@/public/svgs/showcase1.svg";
import showcase2 from "@/public/svgs/showcase2.svg";
import showcase3 from "@/public/svgs/showcase3.svg";

const ProductShowcase = () => {
  // Product showcase data array
  const productShowcaseData = [
    {
      id: 1,
      avatar: showcase1, // Using existing SVG for digital preview
      title: "Digital Preview: See the Pages Come to Life",
      description:
        "Step into our interactive world and get a feel for the Wander Nook experience before you subscribe. Flip through a sample issue online to see how we make learning exciting.",
    },
    {
      id: 2,
      avatar: showcase2, // Using existing SVG for physical product
      title: "Physical Product: The Magic of Print",
      description:
        "Holding a physical copy is a unique experience. Our printed newspaper, with its high-quality paper and vibrant colors, is a tangible piece of magic delivered to your door.",
    },
    {
      id: 3,
      avatar: showcase3, // Using existing SVG for content categories
      title: "Content Categories: Adventures for Every Child",
      description:
        "Every issue of Wander Nook is packed with a diverse mix of content to spark every child's curiosity. News, Stories, Games, Science, Sports.",
    },
  ];

  return (
    <div className="container mx-auto py-18 bg-[#FEC106] md:bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-[160px] h-[33px] flex items-center justify-center rounded-[50px] bg-[#FFFFFF63] md:bg-[#6A43D733]">
        <p className="text-sm font-normal text-black md:text-[var(--font-purple-shade-1)] leading-4">
          Product Showcase
        </p>
      </div>
      <div className="md:w-[700px] w-full max-w-full mt-4 px-4 relative">
        {/* Top left SVG - purple play button */}
        <div className="absolute top-4 -left-30 hidden md:block">
          <Image
            src="/svgs/youtubeVector.svg"
            alt="Decorative element"
            width={49}
            height={40}
            className="w-fit h-fit"
          />
        </div>

        {/* Top right SVG - yellow game controller */}
        <div className="absolute top-30 -right-40 hidden md:block">
          <Image
            src="/svgs/remoteVector.svg"
            alt="Decorative element"
            width={57}
            height={40}
            className="w-fit h-fit"
          />
        </div>

        <h2 className="md:text-[42px] text-[28px] text-center md:w-[664px] w-full md:leading-[50px] leading-[34px] text-white md:text-[var(--font-black-shade-1)] font-semibold ">
          A look at the magic we create, from the screen to your doorstep.
        </h2>
        <p className="mt-3 text-[var(--font-black-shade-1)] w-full text-[20px] font-normal leading-6 text-center ">
          Welcome to the heart of Wander Nook! Here&apos;s a glimpse into the magic we create, from
          the digital screen to the physical page.
        </p>
      </div>
      {/* Product Showcase Cards */}
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 mt-12">
        {productShowcaseData.map((item, index) => {
          const mobileBgColors = ["#FE5923", "#B022F2", "#A7D928"];
          return (
            <div
              key={item.id}
              className={`md:w-[365px] h-[410px] rounded-[20px] border border-[#D9D9D9] p-6 flex flex-col items-start text-center bg-white ${
                mobileBgColors[index % mobileBgColors.length]
              } md:bg-white`}
            >
              <div className="w-fit h-fit mb-8">
                <Image
                  src={item.avatar}
                  alt={item.title}
                  className="w-[137px] h-[137px] object-contain"
                  width={2000}
                  height={2000}
                />
              </div>
              <h3 className="text-[24px] font-semibold text-[var(--font-black-shade-1)] mb-8 leading-7 text-left">
                {item.title}
              </h3>
              <p className="text-base font-normal text-[var(--font-black-shade-3)] leading-[18px] text-left">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductShowcase;
