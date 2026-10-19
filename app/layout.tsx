import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

// Self-hosted by next/font at build time; the browser never calls Google. Latin only, minimal weights.
const displayFont = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const sansFont = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const SITE_NAME = "Backtickk";
const SITE_DESCRIPTION =
  "Backtickk is where developers join communities, publish technical posts and discover what to learn next.";

// Must not call auth(), cookies() or headers() here: that would make every route dynamic and defeat ISR.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="min-h-dvh bg-bg text-fg font-sans antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
