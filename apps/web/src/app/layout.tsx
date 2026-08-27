import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SmoothScroll } from "@/components/SmoothScroll";
import { MotionProvider } from "@/components/MotionProvider";
import { ScrollRail } from "@/components/ScrollRail";
import { firm } from "@/content/site";
import "./globals.css";

/**
 * Display face. Instrument Serif ships a single weight by design — it is a
 * display cut, and at the sizes we set it the stroke contrast does the work a
 * weight axis normally would. Carrying one weight also keeps the added webfont
 * cost to a single file.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Banking panel advocates in Thane and Mumbai MMR. Notice of Intimation filing under Section 89B, mortgage registration, and statutory public notices for banks, HFCs, and NBFCs.";

export const metadata: Metadata = {
  metadataBase: new URL(firm.url),
  title: {
    default: `${firm.name} — Banking Panel Advocates, Thane`,
    template: `%s — ${firm.name}`,
  },
  description,
  keywords: [
    "banking panel advocate",
    "Notice of Intimation",
    "Section 89B",
    "mortgage registration Thane",
    "title search report",
    "public notice advocate",
    "Sub-Registrar Thane",
  ],
  authors: [{ name: firm.name }],
  openGraph: {
    title: `${firm.name} — Banking Panel Advocates, Thane`,
    description,
    url: firm.url,
    siteName: firm.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${firm.name} — Banking Panel Advocates, Thane`,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables must live on <html>, not <body>. `--font-display` and
    // `--font-mono` are declared in @theme (which lands on :root) and reference
    // these; a custom property resolves against the element it is declared on,
    // so scoping them to <body> leaves the @theme tokens invalid and the whole
    // page silently falls back to the system stack.
    <html
      lang="en-IN"
      className={`${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Motion writes its `initial` state into the server-rendered markup,
            so the hero ships as opacity:0 and would stay that way with
            scripting off. Everything carrying an entrance animation is tagged
            `data-enter` and forced visible here. The scroll-linked rigs need no
            equivalent: their resting state is already the readable one. */}
        <noscript>
          <style>{`[data-enter]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
        >
          Skip to content
        </a>
        <MotionProvider>
          <ScrollRail />
          {children}
        </MotionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
