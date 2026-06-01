import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import UpdateChecker from "@/components/UpdateChecker";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#635bff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Veri9 — Verify Any Product, Anywhere in the World",
    template: "%s | Veri9",
  },
  description:
    "Scan any barcode to instantly verify product authenticity. Protect yourself from counterfeit goods with Veri9's real-time verification across advanced intelligence and global product records.",
  keywords: [
    "product verification",
    "barcode scanner",
    "counterfeit detection",
    "product authentication",
    "barcode lookup",
    "fake product checker",
    "verify product authenticity",
    "barcode verification",
    "counterfeit checker",
    "product scanner app",
    "Barcode lookup",
    "UPC checker",
    "EAN verification",
    "anti-counterfeit",
    "product safety",
  ],
  authors: [{ name: "Veri9", url: "https://veri9.com" }],
  creator: "Veri9",
  publisher: "Veri9",
  metadataBase: new URL("https://veri9.com"),
  alternates: {
    canonical: "https://veri9.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://veri9.com",
    title: "Veri9 — Verify Any Product, Anywhere in the World",
    description:
      "Scan any barcode to instantly verify product authenticity. Cross-reference global intelligence sources to detect counterfeits in seconds.",
    siteName: "Veri9",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Veri9 Product Verification" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veri9 — Verify Any Product, Anywhere",
    description: "Scan any barcode to instantly verify product authenticity. Free, no sign-up required.",
    images: ["/icon-512.png"],
  },
  verification: {
    // Uncomment and add your verification codes after signing up for:
    //   Google Search Console: https://search.google.com/search-console
    //   Bing Webmaster Tools:  https://www.bing.com/webmasters
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
    // other: { "msvalidate.01": "YOUR_BING_VERIFICATION_CODE" },
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/favicon.svg?v=4", type: "image/svg+xml" },
      { url: "/favicon-16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=4", sizes: "48x48", type: "image/png" },
      { url: "/favicon-64.png?v=4", sizes: "64x64", type: "image/png" },
      { url: "/favicon-96.png?v=4", sizes: "96x96", type: "image/png" },
      { url: "/favicon-128.png?v=4", sizes: "128x128", type: "image/png" },
      { url: "/favicon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png?v=4", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=4", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico?v=4",
  },
  manifest: "/manifest.json?v=4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        {/* Force-refresh favicon cache in all browsers — Brave/IE/Firefox fix */}
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <meta name="msapplication-TileImage" content="/favicon-192.png?v=4" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        {/* JSON-LD structured data — Organization + WebSite schemas for Google/Bing rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AuthProvider>
          {children}
          <UpdateChecker />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 2000,
              style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              },
              success: {
                duration: 2000,
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                duration: 2500,
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}