import Image from "next/image";

type BannerProps = {
  text: string;
  imageSrc: string;
};

const Banner = ({ text, imageSrc }: BannerProps) => {
  return (
    <div className="relative">
      <Image
        src={imageSrc}
        alt="Banner Image"
        width={2000}
        height={2000}
        className="w-full h-[240px] md:h-[335px] object-cover"
      />
      <p className="text-white text-4xl md:text-6xl font-medium absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        {text}
      </p>
    </div>
  );
};

export default Banner;
