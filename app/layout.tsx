import type { Metadata } from "next";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArchiCareer",
  description: "Architectural Careers, Built in Nigeria",
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
