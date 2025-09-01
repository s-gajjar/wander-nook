import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistPlusJakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wander Nook",
  description: "Get your hands on the latest edition of Wander Nook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistPlusJakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
