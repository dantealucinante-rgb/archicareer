"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps children in an IntersectionObserver trigger that adds the
 * `is-shown` class when the element scrolls into view, activating
 * the existing `t-stagger` animation system.
 */
export default function ScrollReveal({
    children,
    className = "",
    threshold = 0.15,
}: {
    children: React.ReactNode;
    className?: string;
    threshold?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        /* respect reduced motion — show immediately */
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setShown(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div ref={ref} className={`t-stagger ${shown ? "is-shown" : ""} ${className}`}>
            {children}
        </div>
    );
}
