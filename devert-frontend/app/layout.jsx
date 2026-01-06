import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";

import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "Devert.in | The 1% Dev Roadmap",
  description: "From Logic to Hosting. Join the squad building the future.",
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
            {children}
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
