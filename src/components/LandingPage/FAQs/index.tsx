"use client";

// React imports
import { useState } from "react";

// Next imports
import Image from "next/image";

// Icons
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

// Images
import arrowVector2 from "@/public/svgs/arrowVector2.svg";
import beanVector from "@/public/svgs/beanVector.svg";
import carrotVector from "@/public/svgs/carrotVector.svg";
import footballVector from "@/public/svgs/footballVector.svg";
import remoteVector from "@/public/svgs/remoteVector.svg";
import Link from "next/link";

// FAQ data array
const faqData = [
  {
    id: 1,
    title: "What is Wander Nook and who is it for?",
    answer: (
      <p>
        Wander Nook is a newspaper specifically designed for children aged <b>8 to 15 years</b>. We
        simplify world and India news in kid-friendly language, and include learning activities like
        puzzles, quizzes, interactive games, creative corners for young voices and art, plus life
        skills and values lessons. Our mission is to create a positive, age-appropriate, and
        engaging way for children to stay informed about the world while encouraging reading and
        curiosity.
      </p>
    ),
  },
  {
    id: 2,
    title: "What subscription plans do you offer and how much do they cost?",
    answer: (
      <div>
        <p>We offer two subscription options:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>
            <b>Print Edition:</b> INR 2,200 per year (originally INR 2,400)
            <ul className="list-disc ml-6">
              <li>24 newspapers delivered fortnightly</li>
              <li>Printables included</li>
              <li>1 travel journal</li>
            </ul>
          </li>
          <li className="mt-2">
            <b>Digital Edition:</b> INR 1,500 per year
            <ul className="list-disc ml-6">
              <li>24 newspapers emailed fortnightly</li>
              <li>Printables included</li>
              <li>1 travel journal</li>
            </ul>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 3,
    title: "When will my subscription start and how is it delivered?",
    answer: (
      <div>
        <p>
          <b>It takes up to 4 weeks for your subscription to commence.</b>
        </p>
        <p className="mt-2">
          For print subscriptions, copies are dispatched on the <b>1st and 16th of every month</b>
          via courier/registered post. Delivery usually takes <b>up to 7 working days</b> from the
          dispatch date. Digital subscriptions are emailed on the same schedule. Both subscriptions
          are set to auto-renew monthly for your convenience.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: "Can I get a sample before subscribing?",
    answer: (
      <p>
        Yes! You can request a sample of our <b>print edition</b> by filling out a form that
        requires your name, email address, contact number, school name, and city. This will give you
        a preview of what Wander Nook offers before you commit to a subscription.
      </p>
    ),
  },
  {
    id: 5,
    title: "What is your refund and cancellation policy?",
    answer: (
      <div>
        <p>
          <b>Print Subscriptions:</b> Once payment has been processed, subscriptions{" "}
          <b>cannot be cancelled or refunded</b>.
        </p>
        <p className="mt-2">
          <b>Digital Subscriptions:</b> To change or cancel your digital subscription, email us at{" "}
          <b>contact@wandernook.in</b>.
        </p>
        <p className="mt-2">
          Both subscription types are set to auto-renew every month for convenience.
        </p>
      </div>
    ),
  },
  {
    id: 6,
    title: "How can I contact you for support or track my delivery?",
    answer: (
      <div>
        <p>For subscription-related queries and tracking details:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>
            WhatsApp us at <b>9820067074</b> (Monday–Friday, 10:00 AM to 6:00 PM)
          </li>
          <li>
            Email: <Link href="mailto:contact@wandernook.in">contact@wandernook.in</Link>
          </li>
        </ul>
        <p className="mt-4">Our office address is:</p>
        <p className="mt-2">
          <b>Wander Nook</b>
          <br />
          Wander Stamps, 4A, Radha Blocks, 1st Floor,
          <br />
          Shastri Hall, Nana Chowk, J. D. Marg,
          <br />
          Grant Road (W), Mumbai 400007, India
        </p>
      </div>
    ),
  },
];

const FAQs = () => {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(1); // First FAQ is open by default

  const toggleFAQ = (id: number) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  return (
    <div className="bg-white py-16 px-4 relative overflow-hidden">
      {/* Decorative Icons */}
      <Image
        src={beanVector}
        alt=""
        width={60}
        height={60}
        className="absolute top-15 md:left-88 left-0"
      />
      <Image
        src={remoteVector}
        alt=""
        width={61}
        height={43}
        className="absolute top-0 md:right-90 right-0"
      />
      <Image
        src={arrowVector2}
        alt=""
        width={45}
        height={40}
        className="absolute top-105 left-60"
      />
      <Image
        src={footballVector}
        alt=""
        width={49}
        height={49}
        className="absolute top-50 right-50 md:block hidden"
      />
      <Image
        src={carrotVector}
        alt=""
        width={67}
        height={74}
        className="absolute bottom-40 right-50"
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-[42px] font-semibold text-[var(--font-black-shade-1)] mb-2">FAQs</h1>
          <p className="text-xl text-gray-600">
            answers to your most common questions about Wander Nook
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqData.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
            >
              {/* FAQ Header */}
              <button
                onClick={() => toggleFAQ(faq.id)}
                className={`w-full px-6 py-4 text-left flex items-center justify-between transition-all duration-300 ease-in-out ${
                  activeFAQ === faq.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="font-medium text-lg">{faq.title}</span>
                {activeFAQ === faq.id ? (
                  <IoChevronUp className="w-5 h-5 transition-transform duration-300" />
                ) : (
                  <IoChevronDown className="w-5 h-5 transition-transform duration-300" />
                )}
              </button>

              {/* FAQ Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeFAQ === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 py-4 bg-white text-gray-700">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQs;
