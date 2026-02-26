import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

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
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${spaceGrotesk.variable} font-sans antialiased`}
        >
          <div className="riso-blobs">
            <div className="riso-blob riso-blob--teal" />
            <div className="riso-blob riso-blob--red" />
            <div className="riso-blob riso-blob--yellow" />
            <div className="riso-blob riso-blob--purple" />
          </div>
          {children}
          <div className="riso-texture" />
        </body>
      </html>
    </ClerkProvider>
  );
}
