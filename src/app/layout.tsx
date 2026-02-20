import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteUrl } from "@/src/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistPlusJakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-plus-jakarta",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wander Nook",
    template: "%s | Wander Nook",
  },
  description:
    "Wander Nook is an inspiring print and digital magazine for curious young minds. Subscribe monthly or yearly and explore every issue.",
  keywords: [
    "Wander Nook",
    "kids magazine",
    "children monthly magazine",
    "subscription",
    "education",
    "stories",
  ],
  openGraph: {
    type: "website",
    title: "Wander Nook",
    description:
      "Subscribe to Wander Nook and discover new stories, activities, and learning experiences for children.",
    siteName: "Wander Nook",
    url: siteUrl,
    images: [
      {
        url: "/svgs/heroSection.png",
        width: 1200,
        height: 630,
        alt: "Wander Nook",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wander Nook",
    description:
      "Subscribe to Wander Nook and discover new stories, activities, and learning experiences for children.",
    images: ["/svgs/heroSection.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Wander Nook",
    url: siteUrl,
    logo: `${siteUrl}/svgs/logo.svg`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "contact@wandernook.in",
        contactType: "customer support",
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistPlusJakarta.variable} antialiased`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
