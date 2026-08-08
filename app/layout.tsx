import type { Metadata } from "next";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-paper text-ink font-sans selection:bg-redline selection:text-paper">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
