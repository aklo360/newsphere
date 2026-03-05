import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NewSphere — Where brands come to life",
  description: "AI-powered brand creation and content generation platform. Create your brand from scratch or import existing guidelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans antialiased bg-[#fafafa]`}>
        {children}
      </body>
    </html>
  );
}
