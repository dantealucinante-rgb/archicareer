"use client";

import { useEffect } from "react";

export default function WaitlistParallax() {
    useEffect(() => {
        const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
        if (!layers.length) return;

        const active = new Set<HTMLElement>();
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const frameQuery = window.matchMedia("(max-width: 760px)");
        let frame = 0;

        const render = () => {
            frame = 0;
            if (reducedMotion.matches) {
                layers.forEach((layer) => { layer.style.transform = ""; });
                return;
            }
            const viewportCenter = window.innerHeight / 2;
            const mobileScale = frameQuery.matches ? 0.42 : 1;
            const limit = frameQuery.matches ? 24 : 72;

            active.forEach((layer) => {
                const frameElement = layer.parentElement;
                if (!frameElement) return;
                const bounds = frameElement.getBoundingClientRect();
                const relativeCenter = bounds.top + bounds.height / 2 - viewportCenter;
                const speed = Number(layer.dataset.parallaxSpeed ?? 0.1);
                const offset = Math.max(-limit, Math.min(limit, -relativeCenter * speed * mobileScale));
                layer.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
            });
        };

        const scheduleRender = () => {
            if (!frame) frame = window.requestAnimationFrame(render);
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const layer = entry.target as HTMLElement;
                if (entry.isIntersecting) active.add(layer);
                else active.delete(layer);
            });
            scheduleRender();
        }, { rootMargin: "100% 0px 100% 0px" });

        layers.forEach((layer) => observer.observe(layer));
        window.addEventListener("scroll", scheduleRender, { passive: true });
        window.addEventListener("resize", scheduleRender, { passive: true });
        reducedMotion.addEventListener("change", scheduleRender);
        frameQuery.addEventListener("change", scheduleRender);
        scheduleRender();

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("scroll", scheduleRender);
            window.removeEventListener("resize", scheduleRender);
            reducedMotion.removeEventListener("change", scheduleRender);
            frameQuery.removeEventListener("change", scheduleRender);
            layers.forEach((layer) => { layer.style.transform = ""; });
        };
    }, []);

    return null;
}
