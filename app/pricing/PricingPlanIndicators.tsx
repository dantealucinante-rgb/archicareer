"use client";

import { useEffect, useState } from "react";
import styles from "./pricing.module.css";

const planNames = ["Free", "Pro", "Pro Plus"];

export default function PricingPlanIndicators({ trackId }: { trackId: string }) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const track = document.getElementById(trackId);
        if (!track) return;
        let frame = 0;

        const updateActive = () => {
            frame = 0;
            const trackRect = track.getBoundingClientRect();
            const trackStyle = window.getComputedStyle(track);
            const snapStart = trackRect.left + track.clientLeft + (Number.parseFloat(trackStyle.scrollPaddingLeft) || 0);
            const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-plan-slide]"));
            let closestIndex = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            slides.forEach((slide, index) => {
                const distance = Math.abs(slide.getBoundingClientRect().left - snapStart);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            setActiveIndex((current) => current === closestIndex ? current : closestIndex);
        };

        const onScroll = () => {
            if (frame === 0) frame = window.requestAnimationFrame(updateActive);
        };

        track.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        onScroll();

        return () => {
            track.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (frame !== 0) window.cancelAnimationFrame(frame);
        };
    }, [trackId]);

    function showPlan(index: number) {
        const track = document.getElementById(trackId);
        const slide = track?.querySelectorAll<HTMLElement>("[data-plan-slide]")[index];
        if (!track || !slide) return;

        const trackRect = track.getBoundingClientRect();
        const trackStyle = window.getComputedStyle(track);
        const snapStart = trackRect.left + track.clientLeft + (Number.parseFloat(trackStyle.scrollPaddingLeft) || 0);
        const left = track.scrollLeft + slide.getBoundingClientRect().left - snapStart;
        track.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    return <div className={styles.swipeFooter} role="group" aria-label="Choose a pricing plan">
        {planNames.map((name, index) => <button
            key={name}
            type="button"
            className={styles.indicatorButton}
            aria-label={`Show ${name} plan`}
            aria-current={activeIndex === index ? "step" : undefined}
            onClick={() => showPlan(index)}
        ><span className={activeIndex === index ? styles.indicatorActive : ""} /></button>)}
    </div>;
}
