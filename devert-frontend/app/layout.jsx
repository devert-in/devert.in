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
  title: "DeVert - For Builders",
  description:
    "DeVert is not for learners, it's for builders. A definitive community that turns developers into builders.",
  keywords: [
    "DeVert",
    "Builders",
    "Developers",
    "DSA",
    "Backend",
    "Projects",
    "Startups",
    "Placements"
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "DeVert - For Builders",
    description:
      "A definitive community that turns developers into builders. Master DSA, ship real-world projects, crack hackathons, and land your dream product-based company.",
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background text-foreground selection:bg-neon-green selection:text-black overflow-x-hidden`}
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
