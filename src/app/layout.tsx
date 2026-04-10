import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { getSiteUrl } from "@/src/lib/site-url";
import { PostHogProvider } from "@/src/components/PostHogProvider";
import { MetaPixelPageViewTracker } from "@/src/components/MetaPixelPageViewTracker";
import { META_PIXEL_ID } from "@/src/lib/meta-pixel";

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
  const metaPixelId = META_PIXEL_ID.trim();
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
        telephone: "+91 9820067074",
        contactType: "customer support",
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistPlusJakarta.variable} antialiased`}>
        {metaPixelId ? (
          <>
            <Script id="meta-pixel-base" strategy="beforeInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${metaPixelId}');fbq('track', 'PageView');`}
            </Script>
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" alt="" />`,
              }}
            />
          </>
        ) : null}
        <Suspense fallback={null}>
          <MetaPixelPageViewTracker />
        </Suspense>
        <PostHogProvider>
          {children}
        </PostHogProvider>
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
