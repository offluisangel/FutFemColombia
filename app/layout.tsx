import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";

const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const _playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  themeColor: "#3a0835",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Liga Femenina de Colombia",
    template: "%s | Liga Femenina de Colombia",
  },
  description:
    "Calendario, resultados, tabla de posiciones y goleadoras de la Liga Femenina Colombiana de Fútbol. Sigue la clasificación, los resultados en vivo y el calendario completo de la liga.",
  openGraph: {
    title: "Liga Femenina de Colombia",
    description:
      "Calendario, resultados, tabla de posiciones y goleadoras de la Liga Femenina Colombiana de Fútbol.",
    url: SITE_URL,
    siteName: "Liga Femenina Colombia",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Liga Femenina de Colombia",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liga Femenina de Colombia",
    description:
      "Calendario, resultados, tabla de posiciones y goleadoras de la Liga Femenina Colombiana de Fútbol.",
    images: [
      { url: `${SITE_URL}/og-image.png`, alt: "Liga Femenina de Colombia" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${_geistMono.variable} ${_playfair.variable}`}>
      <body className="font-mono antialiased overflow-x-hidden">
        {children}
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
