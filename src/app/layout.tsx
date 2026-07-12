import type { Metadata, Viewport } from "next";
import { Edu_TAS_Beginner, Nunito, Playfair_Display } from "next/font/google";
import { DemoPanel } from "@/components/demo/demo-panel";
import { PaperTextureLayer } from "@/components/wednesday/paper-texture-layer";
import { AppBootstrap } from "@/lib/app/app-bootstrap";
import "./globals.css";

// Self-hosted via next/font: no render-blocking Google CSS, no FOUT on iOS.
const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const eduTas = Edu_TAS_Beginner({ subsets: ["latin"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  title: "Wednesday — thoughtful introductions, every Wednesday",
  description:
    "A dating concept that replaces endless swiping with one considered weekly cycle: rank the people who truly fit, meet your match on Wednesday, and introduce yourself with a letter.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wednesday"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FEF9EE"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunito.variable} ${playfair.variable} ${eduTas.variable}`}>
      <body className="font-sans antialiased">
        <AppBootstrap />
        <PaperTextureLayer />
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
