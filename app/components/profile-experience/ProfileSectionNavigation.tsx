"use client";

import { useEffect, useState } from "react";
import editorial from "@/app/components/editorial/editorial.module.css";
import styles from "./profile-experience.module.css";

export type ProfileSection = { id: string; label: string };

export default function ProfileSectionNavigation({ sections }: { sections: ProfileSection[] }) {
    const [active, setActive] = useState(sections[0]?.id ?? "");

    useEffect(() => {
        const elements = sections
            .map(({ id }) => document.getElementById(id))
            .filter((element): element is HTMLElement => Boolean(element));
        if (!elements.length || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(visible.target.id);
        }, { rootMargin: "-20% 0px -62% 0px", threshold: [0, 0.15, 0.35, 0.6] });

        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [sections]);

    if (sections.length < 2) return null;

    return <div className={styles.nav}>
        <div className={editorial.container}>
            <nav aria-label="Profile sections" className={styles.navInner}>
                {sections.map(({ id, label }) => <a
                    key={id}
                    href={`#${id}`}
                    aria-current={active === id ? "location" : undefined}
                    className={[styles.navLink, active === id ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
                >{label}</a>)}
            </nav>
        </div>
    </div>;
}
