import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = "https://sumanthkm.com/aria";
const OG = `${SITE}/og.png`;
const DESC =
  "Aria is an open-source, macOS-style web desktop with a live multi-agent brain — real tools, live code execution, and a local LLM that runs in your browser via WebGPU. No server, no API key required.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sumanthkm.com"),
  title: {
    default: "Aria — the AI operating system in your browser",
    template: "%s · Aria",
  },
  description: DESC,
  applicationName: "Aria",
  authors: [{ name: "Sumanth Kumar M", url: "https://sumanthkm.com" }],
  creator: "Sumanth Kumar M",
  alternates: { canonical: `${SITE}/` },
  keywords: [
    "AI operating system",
    "multi-agent system",
    "AI agents",
    "web desktop",
    "local LLM",
    "WebGPU LLM",
    "in-browser AI",
    "open source",
    "agent orchestration",
    "Next.js",
  ],
  openGraph: {
    title: "Aria — the AI operating system in your browser",
    description: DESC,
    url: `${SITE}/`,
    siteName: "Aria",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "Aria — AI operating system" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aria — the AI operating system in your browser",
    description: DESC,
    images: [OG],
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Aria",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web (any modern browser)",
  description: DESC,
  url: `${SITE}/`,
  author: {
    "@type": "Person",
    name: "Sumanth Kumar M",
    url: "https://sumanthkm.com",
  },
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Multi-agent orchestration",
    "In-browser local LLM (WebGPU)",
    "Live web search",
    "Python & JavaScript code execution",
    "AI image generation",
    "Voice mode",
  ],
  softwareHelp: `${SITE}/about/`,
  codeRepository: "https://github.com/skmdroid/aria",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
