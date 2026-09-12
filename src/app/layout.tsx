import type { Metadata } from "next";
import { Space_Grotesk, Manrope, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Yaazh VR — Spatial Audio Photo Editor",
  description:
    "Turn a single photo into an immersive spatial-audio memory. Drag sounds onto your image and export as MP4.",
  keywords: ["spatial audio", "photo editor", "soundscape", "memory", "binaural", "yaazhvr"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable} ${inter.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body>{children}</body>
    </html>
  );
}
