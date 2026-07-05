import type { Metadata, Viewport } from "next";
import { DemoPanel } from "@/components/demo/demo-panel";
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
      <body className="font-sans antialiased">
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
