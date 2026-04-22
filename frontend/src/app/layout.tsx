import type { Metadata } from "next";
import { Manrope, Nunito } from "next/font/google";
import { ChatWidget } from "@/components/chat/ChatWidget";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetAI - AI Powered Pet Care and Adoption",
  description: "AI-powered pet adoption and care portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#2f66ff] focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex min-h-full flex-col">
          {children}
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
