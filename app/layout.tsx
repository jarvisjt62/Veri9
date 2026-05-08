import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Veri9 — Verify Any Product, Anywhere in the World",
    template: "%s — Veri9",
  },
  description:
    "Scan any barcode to instantly verify product authenticity. Protect yourself from counterfeit goods with Veri9's AI-powered verification across 9+ global databases.",
  keywords: ["product verification", "barcode scanner", "counterfeit detection", "product authentication"],
  authors: [{ name: "Veri9" }],
  creator: "Veri9",
  metadataBase: new URL("https://veri9.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://veri9.com",
    title: "Veri9 — Verify Any Product, Anywhere in the World",
    description: "Scan any barcode to instantly verify product authenticity.",
    siteName: "Veri9",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
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
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}