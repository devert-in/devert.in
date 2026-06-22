import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "DeVert — Builder's OS",
  description: "Not for learners. For builders. The 1% Dev Roadmap.",
  keywords: ["DeVert", "Builders", "Developers", "DSA", "Hackathons", "Projects", "Arena", "Missions"],
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "DeVert — Builder's OS",
    description: "Not for learners. For builders. The command center for the top 1% of developers.",
    url: "https://devert.in",
    siteName: "DeVert",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background text-foreground overflow-x-hidden`}
      >
        <AuthProvider>
          <IntroProvider>
            <CommandPalette />
            <Navbar />
            {children}
            <Footer />
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
