"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/discover", label: "Discover" },
    { href: "/jobs", label: "Jobs" },
    { href: "/feed", label: "Feed" },
    { href: "/pricing", label: "Pricing" },
];

function NavIcon({ href }: { href: string }) {
    const common = { "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, className: "h-[18px] w-[18px] shrink-0" };
    if (href === "/feed") return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (href === "/jobs") return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (href === "/pricing") return <svg {...common}><path d="M12 3v18M17 7.5c0-1.7-2-3-5-3S7 5 7 7s2 3 5 3 5 1.3 5 3-2 3.5-5 3.5-5-1.3-5-3" strokeLinecap="round" /></svg>;
    if (href === "/discover") return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17.5" cy="10" r="2.25" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 20a3.5 3.5 0 0 1 5.5-2.9" strokeLinecap="round" /></svg>;
    return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg>;
}

export default function PrimaryNav({ orientation = "horizontal", profileHref }: { orientation?: "horizontal" | "vertical"; profileHref?: string }) {
    const pathname = usePathname();
    const items = profileHref ? [...links, { href: profileHref, label: "Profile" }] : links;

    return (
        <nav aria-label={orientation === "vertical" ? "Feed navigation" : "Primary navigation"} className={orientation === "vertical" ? "hidden flex-col items-stretch gap-1 font-sans text-sm lg:flex" : "hidden flex-1 items-center justify-center gap-2 font-sans text-sm sm:flex"}>
            {items.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={orientation === "vertical"
                            ? `flex min-h-11 items-center gap-3 rounded-r-xl border-l-2 px-3 py-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${active ? "border-redline bg-sand text-ink" : "border-transparent text-graphite hover:bg-sand/60 hover:text-ink"}`
                            : `rounded-full px-3 py-2 transition-colors ${active ? "bg-sand/60 text-ink" : "text-graphite hover:bg-sand/40 hover:text-ink"}`}
                    >
                        {orientation === "vertical" && <NavIcon href={link.href} />}
                        <span>{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
