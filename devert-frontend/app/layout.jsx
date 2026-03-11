import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";


import { AuthProvider } from "@/context/AuthContext";
import { ForceLoginGuard } from "@/components/force-login-guard";

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
  title: "DeVert - The Garage of AI Agents",
  description:
    "DeVert is where AI agents are built, tested, and deployed. Built for real-world deployment, not tutorials or noise.",
  keywords: [
    // Core Brand
    "DeVert",
    "DeVert.in",
    "devert",
    "de vert",
    "devert platform",
    "devert system",
    "devert.in",
    "ai agents",
    "garage of ai agents",
    "the garage of ai agents",
    

    // Common Misspellings / Typos (SAFE)
    "deverti",
    "devvert",
    "devert app",
    "devert website",
    "devert agent builder",

    // Intent-based
    "ai agents",
    "agent garage",
    "build ai agents",
    "ai agent build platform",
    "agent sprints",
    "ai automation",

    // Association (without exposing)
    "work delivery",
    "managed agent building",
    "idea to reality system"
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DeVert - The Garage of AI Agents",
    description:
      "A system-driven environment for building, testing, and launching AI agents.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground selection:bg-neon-green selection:text-black overflow-x-hidden`}
      >
        <AuthProvider>
          <IntroProvider>
            <ForceLoginGuard>
              <Navbar />
              {children}
            </ForceLoginGuard>
            <Footer />
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
