import Image from "next/image";
import breakingNewsImage from "@/public/svgs/breakingNews.svg";

const OurStory = () => {
  return (
    <section className="bg-white container mx-auto py-20 relative">
      <div className="max-w-6xl mx-auto px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-16 mb-8">
          <div className="flex-1 max-w-lg lg:text-left">
            <h2 className="md:text-[36px] mb-6 text-[32px] leading-[36px] md:leading-12 text-[var(--font-blue-shade-2)] font-medium">
              Welcome to Our Story
            </h2>
            {/* <p className="text-[20px] leading-6 text-[#757575] mb-6">[WIREFRAME PLACEHOLDER]</p> */}
            <div className="space-y-4">
              <p className="text-xl font-normal text-[var(--font-blue-shade-2)]">
                Welcome to Wander Nook, a newspaper made just for kids! We
                believe that curiosity is the spark that leads to learning. Our
                mission is to provide children aged 8 to 15 with a positive,
                age-appropriate, and engaging newspaper that simplifies the
                world and sparks a passion for discovery.
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <Image
              src={breakingNewsImage}
              alt="Sarah Johnson presenting"
              width={500}
              height={500}
              className="w-full max-w-md h-auto rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurStory;
