import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";

import { AuthProvider } from "@/context/AuthContext";

import { Navbar } from "@/components/navbar";

import { Footer } from "@/components/footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "DeVert — Not a Platform. The Execution System.",
  description:
    "DeVert is an execution-first system focused on getting real work done. Built for real-world execution, not tutorials or noise.",
  keywords: [
    // Core Brand
    "DeVert",
    "DeVert.in",
    "devert",
    "de vert",
    "devert platform",
    "devert system",

    // Common Misspellings / Typos (SAFE)
    "deverti",
    "devvert",
    "devert app",
    "devert website",
    "devert execution",

    // Intent-based
    "execution system",
    "get work done",
    "real work execution",
    "project execution system",
    "startup execution",
    "execution over learning",

    // Association (without exposing)
    "work execution",
    "delivery system",
    "managed execution",
    "idea to reality system"
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DeVert — Not a Platform. The Execution System.",
    description:
      "An execution-first system built to turn ideas into real outcomes.",
    url: "https://devert.in",
    siteName: "DeVert",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground selection:bg-neon-green selection:text-black overflow-x-hidden`}
      >
        <AuthProvider>
          <IntroProvider>
            <Navbar />
            {children}
            <Footer />
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
