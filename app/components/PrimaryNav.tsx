"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: { href: string; label: string; icon: "home" | "network" | "jobs" }[] = [
    { href: "/feed", label: "Feed", icon: "home" },
    { href: "/discover", label: "Discover", icon: "network" },
    { href: "/jobs", label: "Jobs", icon: "jobs" },
];

function NavIcon({ name }: { name: "home" | "network" | "jobs" }) {
    if (name === "home") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (name === "network") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]"><circle cx="9" cy="8" r="3" /><circle cx="17.5" cy="10" r="2.25" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 20a3.5 3.5 0 0 1 5.5-2.9" strokeLinecap="round" /></svg>;
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function PrimaryNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Primary navigation" className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        aria-label={link.label}
                        title={link.label}
                        className={`grid h-9 w-9 place-items-center border-b-2 transition-colors ${active ? "border-redline text-ink" : "border-transparent text-graphite hover:border-line hover:text-ink"}`}
                    >
                        <NavIcon name={link.icon} /><span className="sr-only">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
