import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Header from "@/components/Header";

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
          <Header />
          {children}
        </ConvexClientProvider>
        <Script id="twitter-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('config','rbtn7');`}
        </Script>
      </body>
    </html>
  );
}
