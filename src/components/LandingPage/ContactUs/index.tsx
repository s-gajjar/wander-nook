// Next imports
import Image from "next/image";

// Images
import carrotVector from "@/public/svgs/carrotVector.svg";
import footballVector from "@/public/svgs/footballVector.svg";
import purpleVector from "@/public/svgs/purpleVector.svg";
import remoteVector from "@/public/svgs/remoteVector.svg";

const ContactUs = () => {
  return (
    <div id="contact" className="container mx-auto py-12 bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <Image
        src={carrotVector}
        alt=""
        width={53}
        height={59}
        className="absolute top-5 left-65 md:block hidden"
      />
      <Image
        src={remoteVector}
        alt=""
        width={49}
        height={34}
        className="absolute bottom-0 left-70 md:block hidden"
      />
      <Image
        src={footballVector}
        alt=""
        width={39}
        height={39}
        className="absolute top-15 right-65 md:block hidden"
      />
      <Image
        src={purpleVector}
        alt=""
        width={59}
        height={47}
        className="absolute bottom-10 right-80 md:block hidden"
      />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        {/* <div className="text-center mb-16">
          <h1 className="text-[42px] font-semibold text-[var(--font-black-shade-1)] mb-1">
            Ready to Start the Adventure?
          </h1>
          <p className="text-xl text-gray-600">
            Join thousands of families who make learning about the world a daily adventure!
          </p>
        </div>
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <input
              placeholder="you@example.com"
              className="w-[300px] h-[50px] rounded-[20px] border border-[#D9D9D9] p-4"
            />
            <button
              disabled
              className="bg-[var(--font-orange-main-color)] text-[var(--font-white-shade-1)] text-[20px] leading-6 px-5 py-3 rounded-[20px] transition-colors duration-300"
            >
              Submit
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ContactUs;
