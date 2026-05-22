import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { VercelToolbar } from "@vercel/toolbar/next";
import "./globals.css";
import "@/lib/env"; // validates required env vars at startup
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BackgroundMusic } from "@/components/ui/BackgroundMusic";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drawlulu",
  description: "Multiplayer AI image guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <div className="riso-blobs">
          <div className="riso-blob riso-blob--teal" />
          <div className="riso-blob riso-blob--red" />
          <div className="riso-blob riso-blob--yellow" />
          <div className="riso-blob riso-blob--purple" />
        </div>
        {children}
        <BackgroundMusic />
        {shouldInjectToolbar && <VercelToolbar />}
        <Analytics />
        <SpeedInsights />
        <div className="riso-texture" />
      </body>
    </html>
  );
}
