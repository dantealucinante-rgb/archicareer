import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import SiteChrome from "@/app/components/SiteChrome";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://archicareer.ng"),
  title: {
    default: "ArchiCareer — Architecture Careers in Nigeria",
    template: "%s | ArchiCareer",
  },
  description: "A community for architecture students, architects, studios, and companies building the future of architecture in Nigeria.",
  keywords: ["architecture jobs Nigeria", "architecture internships Nigeria", "Nigerian architects", "architecture portfolio", "architecture firms Nigeria"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "ArchiCareer",
    title: "ArchiCareer — Architecture Careers in Nigeria",
    description: "Find the work, people, and opportunities shaping architecture in Nigeria.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchiCareer — Architecture Careers in Nigeria",
    description: "A community for Nigeria's architecture students, architects, studios, and companies.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <body className="min-h-full bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
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
