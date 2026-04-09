import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { SonnerProvider } from "@/components/sonner-provider";
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
  title: {
    default: "Contador de Pizzas e Competição de Rodízio | Rodízio Race",
    template: "%s | Rodízio Race",
  },
  description:
    "O melhor aplicativo para contar fatias em rodízios. Crie uma competição de comida com amigos, marque pizzas, sushis e hambúrgueres em tempo real e veja quem come mais.",
  keywords: [
    "contador de pizza",
    "contador de rodízio",
    "competição de comida",
    "marcador de fatias",
    "quem come mais",
    "app de rodízio",
    "rodízio de sushi",
    "corrida de comida",
    "rodízio race",
    "contador de sushi",
    "contador de hambúrguer",
    "app de competição",
    "contador de fatias",
    "competição entre amigos",
    "app para rodízio",
    "jogo de comer pizza",
    "desafio de comida",
    "aplicativo de rodízio",
    "marcador de rodízio",
    "competição de rodízio",
    "app para contar comida",
  ],
  applicationName: "Rodízio Race",
  openGraph: {
    title: "Contador de Rodízio - Quem come mais?",
    description:
      "Venha competir com amigos em rodízios de pizza, sushi e burger. Marque as fatias e veja a classificação em tempo real.",
    url: "https://rodiziorace.mechama.eu",
    siteName: "Rodízio Race",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://rodiziorace.mechama.eu/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Rodízio Race - Competição de quem come mais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rodízio Race - Contador de Pizzas",
    description:
      "App para competir em rodízios. Marque quantas fatias você comeu e ganhe dos seus amigos.",
    images: ["https://rodiziorace.mechama.eu/og-image.jpg"],
  },
  appleWebApp: {
    title: "Rodízio Race",
  },
  generator: "Next.js",
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
      <body
        className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <SonnerProvider />
        <Analytics />

        {/* Script JSON-LD para SEO (Dados Estruturados) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Rodízio Race",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
              },
              description:
                "Aplicativo contador de pizzas e sushi para competições de rodízio entre amigos.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                ratingCount: "100",
              },
            }),
          }}
        />

        {/* O Script agora fica aqui, gerenciado pelo Next.js corretamente */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1440388984648676"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "f4d52f5f10eb4e6da08483ab75f82e17"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
