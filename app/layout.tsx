import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import "./globals.css";

// Adicione isto para corrigir o comportamento de zoom no iPhone
import type { Viewport } from "next";

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

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
    "Venha competir com amigos em rodízios e veja quem come mais em tempo real",
  applicationName: "Rodízio Race",
  openGraph: {
    title: "Rodizio Race",
    description:
      "Venha competir com amigos em rodizios e veja quem come mais em tempo real",
    images: [
      {
        url: "https://rodiziorace.mechama.eu/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Rodizio Race",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rodizio Race",
    description:
      "Venha competir com amigos em rodizios e veja quem come mais em tempo real",
    images: ["https://rodiziorace.mechama.eu/og-image.jpg"],
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
      <head>
        {/* O Script foi removido daqui para evitar o erro de hidratação */}
      </head>
      {/* Adicionei as variáveis das fontes aqui também para garantir que carreguem */}
      <body
        className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
        <Analytics />

        {/* O Script agora fica aqui, gerenciado pelo Next.js corretamente */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440388984648676"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
