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
        className="w-full h-auto max-h-72 md:max-h-96 object-cover"
      />
      <p className="text-white text-4xl md:text-7xl font-medium absolute left-1/3 bottom-1/3 md:left-2/5 md:top-2/5">
        {text}
      </p>
    </div>
  );
};

export default Banner;
