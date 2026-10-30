"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const IMAGES = [
    "/hero/amir-hosseini-3cl6impBd_8-unsplash.jpg",
    "/hero/dapo-abideen-mqzmjt_4T1w-unsplash.jpg",
    "/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg",
    "/hero/joel-filipe-RFDP7_80v5A-unsplash.jpg",
    "/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg",
    "/hero/tobias-keller-2ecH5Lw3zSk-unsplash.jpg",
    "/hero/tope-a-asokere-AftbId8-N_w-unsplash.jpg",
];

const CARD_COUNT = IMAGES.length;
const SLICE_DEG = 360 / CARD_COUNT;
const ROTATION_DURATION_MS = 40_000;
const DEG_PER_MS = 360 / ROTATION_DURATION_MS;

/* Blur range: front card gets a soft 1px base blur (masks low-res),
   back cards ramp up to 5px. Opacity: front 1 → back 0.4. */
const BASE_BLUR = 1;
const MAX_BLUR = 5;
const MIN_OPACITY = 0.4;

export default function HeroRing() {
    const ringRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const angleRef = useRef(0);
    const lastTimeRef = useRef(0);
    const pausedRef = useRef(false);
    const rafRef = useRef(0);
    const reducedMotionRef = useRef(false);

    const setCardRef = useCallback(
        (index: number) => (el: HTMLDivElement | null) => {
            cardRefs.current[index] = el;
        },
        [],
    );

    useEffect(() => {
        const ring = ringRef.current;
        if (!ring) return;

        /* ── reduced motion ─────────────────────────────── */
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const applyMotionPref = () => {
            reducedMotionRef.current = mq.matches;
            if (mq.matches) {
                ring.style.transform = `rotateY(${angleRef.current}deg)`;
                cardRefs.current.forEach((card) => {
                    if (!card) return;
                    card.style.filter = "none";
                    card.style.opacity = "1";
                });
            }
        };
        applyMotionPref();
        mq.addEventListener("change", applyMotionPref);

        /* ── animation loop ─────────────────────────────── */
        const tick = (now: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = now;
            const dt = now - lastTimeRef.current;
            lastTimeRef.current = now;

            if (!pausedRef.current && !reducedMotionRef.current) {
                angleRef.current = (angleRef.current + DEG_PER_MS * dt) % 360;
                ring.style.transform = `rotateY(${angleRef.current}deg)`;

                /* per-card depth blur & opacity */
                cardRefs.current.forEach((card, i) => {
                    if (!card) return;
                    const cardAngle = (SLICE_DEG * i + angleRef.current) % 360;
                    const norm = cardAngle > 180 ? cardAngle - 360 : cardAngle;
                    const t = Math.abs(norm) / 180; /* 0 at front, 1 at back */
                    const blur = BASE_BLUR + t * (MAX_BLUR - BASE_BLUR);
                    const opacity = 1 - t * (1 - MIN_OPACITY);
                    card.style.filter = `blur(${blur.toFixed(2)}px)`;
                    card.style.opacity = opacity.toFixed(3);
                });
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            mq.removeEventListener("change", applyMotionPref);
        };
    }, []);

    /* ── pause handlers (pointer-events re-enabled on the viewport via prop) */
    const pause = useCallback(() => {
        pausedRef.current = true;
    }, []);
    const resume = useCallback(() => {
        pausedRef.current = false;
        lastTimeRef.current = 0;
    }, []);

    return (
        <div
            className="hero-ring-viewport"
            style={{ pointerEvents: "auto" }}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
        >
            <div ref={ringRef} className="hero-ring">
                {IMAGES.map((src, i) => (
                    <div
                        key={src}
                        ref={setCardRef(i)}
                        className="hero-ring-card"
                        style={{
                            transform: `rotateY(${SLICE_DEG * i}deg) translateZ(var(--ring-radius))`,
                        }}
                    >
                        <Image
                            src={src}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 36vw, (max-width: 1024px) 18vw, 280px"
                            className="hero-ring-img"
                            priority={i < 2}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
