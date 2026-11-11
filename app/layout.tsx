import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import SiteChrome from "@/app/components/SiteChrome";
import AnalyticsLoader from "@/app/components/AnalyticsLoader";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, DEFAULT_TITLE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: "normal",
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["architecture jobs Nigeria", "architecture internships Nigeria", "Nigerian architects", "architecture portfolio", "architecture firms Nigeria"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: "Archicareer — Good Work Deserves to Be Seen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: "Archicareer — Good Work Deserves to Be Seen" }],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
        <AnalyticsLoader />
        <a href="#main-content" className="sr-only absolute left-4 top-4 z-[100] rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper focus:not-sr-only">Skip to content</a>
        <div className="flex min-h-screen flex-col">
          <SiteChrome>
            <SiteHeader />
          </SiteChrome>
          <div id="main-content" className="flex flex-1 flex-col">{children}</div>
          <SiteChrome>
            <SiteFooter />
          </SiteChrome>
        </div>
      </body>
    </html>
  );
}
