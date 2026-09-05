import type { Metadata, Viewport } from "next";
import { Montserrat, Space_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ExperienceProvider } from "@/components/experience-provider";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "YOMSDAY IS COMING — Cumpleaños de Yonsito",
  description:
    "26 de septiembre de 2026 · 10:00 p. m. · Cruz de Motupe, San Juan de Lurigancho.",
  applicationName: "YOMSDAY",
  keywords: ["YOMSDAY", "Yonsito", "cumpleaños", "invitación"],
  openGraph: {
    type: "website",
    locale: "es_PE",
    title: "YOMSDAY IS COMING — Cumpleaños de Yonsito",
    description:
      "La cuenta regresiva ha comenzado. 26 de septiembre de 2026 a las 10:00 p. m.",
    siteName: "YOMSDAY",
  },
  twitter: {
    card: "summary_large_image",
    title: "YOMSDAY IS COMING — Cumpleaños de Yonsito",
    description:
      "La cuenta regresiva ha comenzado. 26 de septiembre de 2026 a las 10:00 p. m.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030806",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${spaceMono.variable}`}>
      <body>
        <ExperienceProvider>{children}</ExperienceProvider>
      </body>
    </html>
  );
}
