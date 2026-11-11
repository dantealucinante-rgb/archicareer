"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./profile-experience.module.css";

const sections = [
    ["overview", "Overview"],
    ["projects", "Projects"],
    ["communities", "Communities"],
    ["about", "About"],
    ["contact", "Contact"],
    ["posts", "Posts"],
] as const;

export default function ProfileSectionNavigation({ hasCommunities = false }: { hasCommunities?: boolean }) {
    const [active, setActive] = useState<string>("overview");
    const visibleSections = useMemo(() => hasCommunities ? sections : sections.filter(([id]) => id !== "communities"), [hasCommunities]);

    useEffect(() => {
        const elements = visibleSections
            .map(([id]) => document.getElementById(id))
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
    }, [visibleSections]);

    return <nav className={styles.editorialNav} aria-label="Profile sections">
        {visibleSections.map(([id, label], index) => <a
            href={`#${id}`}
            key={id}
            aria-current={active === id ? "location" : undefined}
            className={active === id ? styles.activeSection : ""}
        ><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}
    </nav>;
}
