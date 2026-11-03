"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./waitlist.module.css";

type Props = {
    children: ReactNode;
    className?: string;
    direction?: "left" | "right" | "up";
};

export default function WaitlistReveal({ children, className = "", direction = "up" }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            element.dataset.revealVisible = "true";
            return;
        }

        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            element.dataset.revealVisible = "true";
            return;
        }

        element.dataset.revealReady = "true";
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            element.dataset.revealVisible = "true";
            observer.disconnect();
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`${styles.reveal} ${className}`} data-direction={direction}>
            {children}
        </div>
    );
}
