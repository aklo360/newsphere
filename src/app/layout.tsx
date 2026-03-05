import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NewSphere — Agentic Creative Agency",
  description: "Automate your branding & marketing with our fully agentic creative agency.",
  keywords: ["branding", "marketing", "AI", "automation", "creative agency", "brand bible", "content generation"],
  authors: [{ name: "NewSphere" }],
  creator: "NewSphere",
  metadataBase: new URL("https://newsphere.xyz"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://newsphere.xyz",
    siteName: "NewSphere",
    title: "NewSphere — Agentic Creative Agency",
    description: "Automate your branding & marketing with our fully agentic creative agency.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1280,
        height: 675,
        alt: "NewSphere - Agentic Creative Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@newsphere_ai",
    creator: "@newsphere_ai",
    title: "NewSphere — Agentic Creative Agency",
    description: "Automate your branding & marketing with our fully agentic creative agency.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
