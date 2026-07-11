import type { Metadata, Viewport } from "next";
import { DemoPanel } from "@/components/demo/demo-panel";
import { PaperTextureLayer } from "@/components/wednesday/paper-texture-layer";
import { AppBootstrap } from "@/lib/app/app-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wednesday — thoughtful introductions, every Wednesday",
  description:
    "A dating concept that replaces endless swiping with one considered weekly cycle: rank the people who truly fit, meet your match on Wednesday, and introduce yourself with a letter."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Edu+TAS+Beginner:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <AppBootstrap />
        <PaperTextureLayer />
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
