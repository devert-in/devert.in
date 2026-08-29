import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MRCET Placements Hub",
  description:
    "MRCET Campus Placements Hub — placement dashboard, company directory, interview experiences, and practice resources for MRCET students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
