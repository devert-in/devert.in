import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";

import { AuthProvider } from "@/context/AuthContext";

import { Navbar } from "@/components/navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "DeVert | The 1% Dev Roadmap & Coding Community",
  description: "DeVert is the ultimate platform for developers to build real-world projects, join squads, and master the full stack. From logic to hosting - this is the DeVert way.",
  keywords: ["DeVert", "Devert.in", "Devert Community", "Coding Roadmap", "Dev Squad", "Hackathons", "Full Stack Developer", "Coding Challenges"],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'DeVert | The 1% Dev Roadmap',
    description: 'Join the DeVert squad. Build real projects. Master the stack.',
    url: 'https://devert.in',
    siteName: 'DeVert',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-[#050505] text-white selection:bg-[#00FF41] selection:text-black overflow-x-hidden`}
      >
        <AuthProvider>
          <IntroProvider>
            <Navbar />
            {children}
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
