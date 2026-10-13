"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface OrbitTile {
    id: string;
    code: string;
    title: string;
    category: string;
    imageUrl?: string;
    href?: string;
    accentColor?: string;
    renderIllustration: () => React.ReactNode;
}

const DEFAULT_TILES: OrbitTile[] = [
    {
        id: "axon-frame",
        code: "01 // AXON",
        title: "Timber Space Frame",
        category: "Mass Timber Structural Bay",
        href: "/discover?category=timber",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Structural grid lines */}
                <path d="M10 52 L80 18 L150 52" stroke="#5E6875" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
                <path d="M80 18 V62" stroke="#1D70E8" strokeWidth="1" opacity="0.8" />
                {/* Isometric bay */}
                <path d="M30 45 L80 20 L130 45 L80 65 Z" stroke="#17191D" strokeWidth="1.2" className="stroke-ink" />
                <path d="M30 45 V30 L80 5 L130 30 V45" stroke="#17191D" strokeWidth="1.2" className="stroke-ink" />
                <path d="M80 65 V25" stroke="#17191D" strokeWidth="1.2" className="stroke-ink" />
                <path d="M80 5 V25" stroke="#1D70E8" strokeWidth="1" />
                {/* Diagonal bracing */}
                <path d="M30 30 L80 25 M130 30 L80 25" stroke="#1D70E8" strokeWidth="0.75" strokeDasharray="3 2" />
                {/* Architectural dimension annotation */}
                <line x1="26" y1="52" x2="134" y2="52" stroke="#5E6875" strokeWidth="0.5" />
                <path d="M26 49 V55 M134 49 V55" stroke="#5E6875" strokeWidth="0.8" />
                <text x="80" y="58" textAnchor="middle" fill="#5E6875" fontSize="6" fontFamily="monospace">6.00 m</text>
            </svg>
        ),
    },
    {
        id: "cast-concrete",
        code: "02 // CAST",
        title: "Fluted Facade",
        category: "In-Situ Concrete Relief",
        href: "/discover?category=facade",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fluted concrete vertical rhythm with subtle shading */}
                <defs>
                    <linearGradient id="flute-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#17191D" stopOpacity="0.12" />
                        <stop offset="45%" stopColor="#F7F9FC" stopOpacity="0.8" />
                        <stop offset="90%" stopColor="#17191D" stopOpacity="0.25" />
                    </linearGradient>
                </defs>
                <rect x="15" y="8" width="130" height="54" fill="#F0F4F8" stroke="#DCE2EA" strokeWidth="0.8" rx="2" />
                {[25, 43, 61, 79, 97, 115].map((x, idx) => (
                    <g key={idx}>
                        <rect x={x} y="10" width="14" height="50" fill="url(#flute-grad)" />
                        <line x1={x} y1="10" x2={x} y2="60" stroke="#5E6875" strokeWidth="0.5" opacity="0.5" />
                        <line x1={x + 14} y1="10" x2={x + 14} y2="60" stroke="#17191D" strokeWidth="0.75" opacity="0.6" />
                    </g>
                ))}
                {/* Formwork tie hole dots */}
                {[20, 140].map((x, i) => (
                    <g key={i}>
                        <circle cx={x} cy="18" r="1.5" fill="#1D70E8" />
                        <circle cx={x} cy="52" r="1.5" fill="#1D70E8" />
                    </g>
                ))}
                <text x="80" y="66" textAnchor="middle" fill="#5E6875" fontSize="5.5" fontFamily="monospace">ELEVATION 1:50</text>
            </svg>
        ),
    },
    {
        id: "atrium-void",
        code: "03 // VOID",
        title: "Helical Atrium",
        category: "Circulation & Daylighting",
        href: "/discover?category=interior",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Spiral stair plan arcs */}
                <circle cx="80" cy="35" r="26" stroke="#DCE2EA" strokeWidth="0.8" strokeDasharray="3 3" />
                <circle cx="80" cy="35" r="9" stroke="#17191D" strokeWidth="1" />
                {/* Precomputed static radial steps to avoid SSR/client float precision hydration mismatch */}
                {[
                    { x1: 89, y1: 35, x2: 106, y2: 35, highlight: false },
                    { x1: 87.79, y1: 39.5, x2: 102.52, y2: 48, highlight: false },
                    { x1: 84.5, y1: 42.79, x2: 93, y2: 57.52, highlight: false },
                    { x1: 80, y1: 44, x2: 80, y2: 61, highlight: true },
                    { x1: 75.5, y1: 42.79, x2: 67, y2: 57.52, highlight: false },
                    { x1: 72.21, y1: 39.5, x2: 57.48, y2: 48, highlight: false },
                    { x1: 71, y1: 35, x2: 54, y2: 35, highlight: false },
                    { x1: 72.21, y1: 30.5, x2: 57.48, y2: 22, highlight: false },
                    { x1: 75.5, y1: 27.21, x2: 67, y2: 12.48, highlight: false },
                    { x1: 80, y1: 26, x2: 80, y2: 9, highlight: false },
                    { x1: 84.5, y1: 27.21, x2: 93, y2: 12.48, highlight: false },
                    { x1: 87.79, y1: 30.5, x2: 102.52, y2: 22, highlight: false },
                ].map((step, i) => (
                    <line
                        key={i}
                        x1={step.x1}
                        y1={step.y1}
                        x2={step.x2}
                        y2={step.y2}
                        stroke={step.highlight ? "#1D70E8" : "#5E6875"}
                        strokeWidth={step.highlight ? "1.2" : "0.75"}
                    />
                ))}
                {/* Center crosshair */}
                <line x1="74" y1="35" x2="86" y2="35" stroke="#1D70E8" strokeWidth="0.8" />
                <line x1="80" y1="29" x2="80" y2="41" stroke="#1D70E8" strokeWidth="0.8" />
                {/* Up direction arrow */}
                <path d="M96 22 A 20 20 0 0 1 104 35" stroke="#1D70E8" strokeWidth="1" strokeDasharray="2 2" />
                <polygon points="105,37 102,32 107,32" fill="#1D70E8" />
                <text x="135" y="42" fill="#5E6875" fontSize="5.5" fontFamily="monospace">UP 24R</text>
            </svg>
        ),
    },
    {
        id: "curtain-wall",
        code: "04 // ENVELOPE",
        title: "Glazed Assembly",
        category: "Thermally Broken Mullion",
        href: "/discover?category=detail",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Architectural construction detail */}
                <rect x="25" y="16" width="110" height="8" fill="#E7F0FF" stroke="#1D70E8" strokeWidth="0.8" />
                <rect x="25" y="46" width="110" height="8" fill="#E7F0FF" stroke="#1D70E8" strokeWidth="0.8" />
                {/* Central mullion bracket */}
                <rect x="70" y="24" width="20" height="22" fill="#17191D" stroke="#17191D" strokeWidth="1" />
                <rect x="74" y="28" width="12" height="14" fill="#F7F9FC" stroke="#5E6875" strokeWidth="0.75" />
                {/* Insulation thermal break */}
                <line x1="72" y1="35" x2="88" y2="35" stroke="#1D70E8" strokeWidth="1.5" strokeDasharray="1 2" />
                {/* Fasteners */}
                <circle cx="80" cy="31" r="1.5" fill="#1D70E8" />
                <circle cx="80" cy="39" r="1.5" fill="#1D70E8" />
                {/* Dimension callouts */}
                <path d="M18 16 H22 M18 24 H22 M20 16 V24" stroke="#5E6875" strokeWidth="0.6" />
                <text x="15" y="22" textAnchor="end" fill="#5E6875" fontSize="5" fontFamily="monospace">28mm</text>
                <text x="122" y="38" fill="#5E6875" fontSize="5.5" fontFamily="monospace">DGU SECTION</text>
            </svg>
        ),
    },
    {
        id: "cantilever-mass",
        code: "05 // MASS",
        title: "Cantilever Volume",
        category: "Post-Tensioned Massing",
        href: "/discover?category=massing",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ground plane */}
                <line x1="10" y1="56" x2="150" y2="56" stroke="#DCE2EA" strokeWidth="1" />
                {/* Ground hatching */}
                {[20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140].map((x, i) => (
                    <line key={i} x1={x} y1="56" x2={x - 6} y2="62" stroke="#DCE2EA" strokeWidth="0.75" />
                ))}
                {/* Base podium */}
                <rect x="35" y="32" width="40" height="24" fill="#17191D" />
                {/* Cantilever upper volume */}
                <polygon points="25,14 125,14 135,28 35,28" fill="#E7F0FF" stroke="#17191D" strokeWidth="1" />
                <polygon points="35,28 135,28 135,36 35,36" fill="#17191D" stroke="#17191D" strokeWidth="1" />
                {/* Cast shadow under 8m cantilever */}
                <polygon points="75,36 135,36 142,56 75,56" fill="#17191D" opacity="0.18" />
                {/* Tension arrow */}
                <path d="M125 10 L135 10" stroke="#1D70E8" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="80" y="24" textAnchor="middle" fill="#1D70E8" fontSize="5.5" fontFamily="monospace">+8.50m OVERHANG</text>
            </svg>
        ),
    },
    {
        id: "topo-site",
        code: "06 // TOPO",
        title: "Site Contours",
        category: "1:200 Topographic Survey",
        href: "/discover?category=site",
        renderIllustration: () => (
            <svg viewBox="0 0 160 70" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Contour isohypses */}
                <path d="M15 15 C45 22 75 10 145 20" stroke="#6F806C" strokeWidth="0.8" />
                <path d="M15 28 C50 36 85 24 145 34" stroke="#6F806C" strokeWidth="1" />
                <path d="M15 42 C60 52 95 38 145 48" stroke="#17191D" strokeWidth="1.2" />
                <path d="M15 56 C70 64 110 50 145 60" stroke="#6F806C" strokeWidth="0.8" />
                {/* Elevation marks */}
                <text x="110" y="21" fill="#6F806C" fontSize="5" fontFamily="monospace">+12.0</text>
                <text x="115" y="35" fill="#6F806C" fontSize="5" fontFamily="monospace">+13.0</text>
                <text x="120" y="49" fill="#1D70E8" fontSize="5" fontFamily="monospace" fontWeight="bold">+14.0</text>
                {/* Benchmark triangle */}
                <polygon points="35,42 39,47 31,47" fill="#1D70E8" />
                <text x="44" y="46" fill="#1D70E8" fontSize="5.5" fontFamily="monospace">BM 14.00</text>
            </svg>
        ),
    },
];

interface ArchitectureOrbitBandProps {
    children?: React.ReactNode;
    tiles?: OrbitTile[];
    className?: string;
}

export function ArchitectureOrbitBand({
    children,
    tiles = DEFAULT_TILES,
    className = "",
}: ArchitectureOrbitBandProps) {
    const [isPaused, setIsPaused] = useState(false);

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ isolation: "isolate" }}
        >
            {/* Architectural Hairline Ellipse Guide Ring */}
            <div
                className="pointer-events-none absolute inset-0 -m-10 flex items-center justify-center opacity-40 sm:opacity-60"
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 680 320"
                    className="h-full w-full max-w-[700px] overflow-visible"
                    fill="none"
                >
                    {/* Tilted orbital guide ring */}
                    <g transform="rotate(-11 340 160)">
                        <ellipse
                            cx="340"
                            cy="160"
                            rx="275"
                            ry="105"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="3 6"
                            className="text-line"
                        />
                        {/* Major axis crosshair ticks */}
                        <line x1="65" y1="160" x2="75" y2="160" stroke="#1D70E8" strokeWidth="1.2" />
                        <line x1="605" y1="160" x2="615" y2="160" stroke="#1D70E8" strokeWidth="1.2" />
                        <line x1="340" y1="55" x2="340" y2="65" stroke="#1D70E8" strokeWidth="1.2" />
                        <line x1="340" y1="255" x2="340" y2="265" stroke="#1D70E8" strokeWidth="1.2" />
                        {/* Technical coordinates and orientation labels */}
                        <text x="65" y="152" fill="#5E6875" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
                            SEC 270°
                        </text>
                        <text x="575" y="152" fill="#5E6875" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
                            SEC 090°
                        </text>
                        <text x="345" y="52" fill="#1D70E8" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
                            AXIS N
                        </text>
                    </g>
                </svg>
            </div>

            {/* Orbiting Image Tiles Track */}
            <div
                className={`orbit-track pointer-events-none absolute inset-0 flex items-center justify-center ${
                    isPaused ? "orbit-track--paused" : ""
                }`}
            >
                {/* Scaled Responsive Wrapper to keep the orbital path within bounds on mobile & desktop */}
                <div className="relative h-0 w-0 scale-[0.62] xs:scale-[0.72] sm:scale-[0.84] md:scale-95 lg:scale-100 transition-transform">
                    {tiles.slice(0, 6).map((tile, idx) => (
                        <div
                            key={tile.id}
                            className={`orbit-card-anim orbit-card-anim--${idx} absolute left-0 top-0`}
                            style={{
                                width: "164px",
                                height: "92px",
                                marginLeft: "-82px",
                                marginTop: "-46px",
                            }}
                        >
                            <Link
                                href={tile.href || "/discover"}
                                aria-label={`${tile.title} — ${tile.category}`}
                                className="orbit-card-item group pointer-events-auto block h-full w-full overflow-hidden rounded-xl border border-line bg-paper/95 p-2 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-redline hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redline"
                            >
                                {/* Header Strip: Monospace Code & Arrow */}
                                <div className="mb-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-graphite">
                                    <span className="font-semibold text-redline group-hover:underline">
                                        {tile.code}
                                    </span>
                                    <span className="text-[9px] text-graphite/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink">
                                        ↗
                                    </span>
                                </div>

                                {/* Architectural Visual Container */}
                                <div className="relative h-[48px] w-full overflow-hidden rounded-md border border-line/50 bg-warm-white">
                                    {tile.imageUrl ? (
                                        <Image
                                            src={tile.imageUrl}
                                            alt={tile.title}
                                            fill
                                            sizes="164px"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                                            {tile.renderIllustration()}
                                        </div>
                                    )}
                                </div>

                                {/* Tile Title */}
                                <div className="mt-1 truncate font-sans text-[10px] font-medium leading-tight text-ink group-hover:text-redline">
                                    {tile.title}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Central Anchor / Hero Visual Monolith (z-index 10) */}
            <div className="relative z-10 w-full">{children}</div>

            {/* Accessible Live Orbit Status / Pause-Resume Control (WCAG 2.2.2) */}
            <div className="absolute -bottom-7 right-2 z-30 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-line/50 bg-paper/65 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-graphite/75 backdrop-blur-sm transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-redline"
                    title={isPaused ? "Resume architectural orbit" : "Pause architectural orbit"}
                    aria-label={isPaused ? "Resume orbit animation" : "Pause orbit animation"}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            isPaused ? "bg-graphite" : "bg-redline animate-pulse"
                        }`}
                        aria-hidden="true"
                    />
                    <span>{isPaused ? "Orbit Paused" : "Live Orbit"}</span>
                </button>
            </div>
        </div>
    );
}
