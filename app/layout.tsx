import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context"; // <--- Importante
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Adicione isto para corrigir o comportamento de zoom no iPhone
import type { Viewport } from "next";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rodiziorace.mechama.eu"),
  title: "Rodízio Race",
  description:
    "Compete com amigos em rodízios e veja quem come mais em tempo real",
  applicationName: "Rodízio Race",
  openGraph: {
    title: "Rodizio Race",
    description:
      "Compete com amigos em rodizios e veja quem come mais em tempo real",
    images: [
      {
        url: "https://rodiziorace.mechama.eu/logo-big-light.png",
        width: 1200,
        height: 630,
        alt: "Rodizio Race",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rodizio Race",
    description:
      "Compete com amigos em rodizios e veja quem come mais em tempo real",
    images: ["https://rodiziorace.mechama.eu/logo-big-light.png"],
  },
  appleWebApp: {
    title: "Rodízio Race",
  },
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon-light.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
      },
      {
        url: "/icon-dark.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
