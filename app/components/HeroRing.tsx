"use client";

import { useState } from "react";
import Image from "next/image";

const IMAGES = [
    "/hero/archicareer-modern-facade.jpg",
    "/hero/archicareer-material-samples.jpg",
    "/hero/archicareer-public-plaza.jpg",
    "/hero/archicareer-cultural-pavilion.jpg",
    "/hero/jimmy-chang-ACt8ycSzpdE-unsplash.jpg",
    "/hero/lance-anderson-QdAAasrZhdk-unsplash.jpg",
    "/hero/tobias-keller-2ecH5Lw3zSk-unsplash.jpg",
    "/hero/amir-hosseini-3cl6impBd_8-unsplash.jpg",
    "/hero/joel-filipe-RFDP7_80v5A-unsplash.jpg",
];

const SLICE_DEG = 360 / IMAGES.length;

export default function HeroRing() {
    const [paused, setPaused] = useState(false);

    return (
        <div
            className="hero-ring-viewport"
            style={{ pointerEvents: "auto" }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onTouchCancel={() => setPaused(false)}
        >
            <div className={`hero-ring ${paused ? "hero-ring--paused" : ""}`}>
                {IMAGES.map((src, index) => (
                    <div
                        key={src}
                        className="hero-ring-card"
                        style={{ transform: `rotateY(${SLICE_DEG * index}deg) translateZ(var(--ring-radius))` }}
                    >
                        <Image
                            src={src}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 36vw, (max-width: 1024px) 18vw, 280px"
                            className="hero-ring-img"
                            priority={index === 0}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
