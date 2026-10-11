"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type FallingItem = {
    id: number;
    kind: "blueprint" | "glitch";
    x: number;
    y: number;
    size: number;
    speed: number;
    driftSeed: number;
};

type Notice = {
    text: string;
    tone: "neutral" | "good" | "bad";
};

const TARGET_SCORE = 10;
const INITIAL_LIVES = 3;
const STORAGE_KEY = "archicareer-404-best";

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function buildItem(id: number, width: number, score: number, reduceMotion: boolean): FallingItem {
    const kind = Math.random() < 0.22 ? "glitch" : "blueprint";
    const size = kind === "glitch" ? (reduceMotion ? 38 : 34) : (reduceMotion ? 46 : 40);
    const speedBase = reduceMotion ? 72 : 116;
    const speed = speedBase + score * (reduceMotion ? 3 : 6) + (kind === "glitch" ? 14 : 0);
    const x = clamp(Math.random() * Math.max(1, width - size), 0, Math.max(0, width - size));

    return {
        id,
        kind,
        x,
        y: -size - 8,
        size,
        speed,
        driftSeed: Math.random() * Math.PI * 2,
    };
}

export default function NotFoundGame() {
    const boardRef = useRef<HTMLDivElement>(null);
    const lastFrameRef = useRef(0);
    const nextSpawnRef = useRef(0);
    const nextNoticeRef = useRef<number | null>(null);
    const itemIdRef = useRef(1);
    const paddleXRef = useRef(0);
    const stateRef = useRef({
        score: 0,
        lives: INITIAL_LIVES,
        gameState: "playing" as "playing" | "won" | "lost",
        reduceMotion: false,
    });

    const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
    const [items, setItems] = useState<FallingItem[]>([]);
    const [paddleX, setPaddleX] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [best, setBest] = useState(0);
    const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
    const [notice, setNotice] = useState<Notice>({
        text: "Catch the blueprints. Avoid the redline glitches.",
        tone: "neutral",
    });
    const [reduceMotion, setReduceMotion] = useState(false);

    const paddleWidth = boardSize.width
        ? clamp(boardSize.width * 0.24, 96, 190)
        : 120;
    const paddleHeight = 18;
    const paddleY = Math.max(0, boardSize.height - 58);

    useEffect(() => {
        let frame = 0;

        try {
            const savedBest = window.localStorage.getItem(STORAGE_KEY);
            const parsedBest = savedBest ? Number(savedBest) : 0;
            if (Number.isFinite(parsedBest)) {
                frame = window.requestAnimationFrame(() => {
                    setBest(parsedBest);
                });
            }
        } catch {
            // Ignore storage failures and keep the in-memory score only.
        }

        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotionPreference = () => {
            const next = media.matches;
            setReduceMotion(next);
            stateRef.current.reduceMotion = next;
        };

        updateMotionPreference();
        media.addEventListener("change", updateMotionPreference);
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            media.removeEventListener("change", updateMotionPreference);
        };
    }, []);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        const updateSize = () => {
            const rect = board.getBoundingClientRect();
            setBoardSize({
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(board);
        window.addEventListener("resize", updateSize);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameState !== "playing" || boardSize.width === 0) return;
            if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", "Home", "End"].includes(event.key)) {
                event.preventDefault();
            }

            const step = event.shiftKey ? 36 : 22;
            const maxX = Math.max(0, boardSize.width - paddleWidth);

            if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
                setPaddleX((current) => {
                    const next = clamp(current - step, 0, maxX);
                    paddleXRef.current = next;
                    return next;
                });
            }

            if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
                setPaddleX((current) => {
                    const next = clamp(current + step, 0, maxX);
                    paddleXRef.current = next;
                    return next;
                });
            }

            if (event.key === "Home") {
                paddleXRef.current = 0;
                setPaddleX(0);
            }

            if (event.key === "End") {
                paddleXRef.current = maxX;
                setPaddleX(maxX);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [boardSize.width, gameState, paddleWidth]);

    useEffect(() => {
        if (!best || typeof window === "undefined") return;
        window.localStorage.setItem(STORAGE_KEY, String(best));
    }, [best]);

    function resetGame() {
        if (!boardSize.width) return;

        const startingX = clamp(boardSize.width * 0.38, 0, Math.max(0, boardSize.width - paddleWidth));
        paddleXRef.current = startingX;
        lastFrameRef.current = 0;
        nextSpawnRef.current = 0;
        itemIdRef.current = 1;
        stateRef.current.score = 0;
        stateRef.current.lives = INITIAL_LIVES;
        stateRef.current.gameState = "playing";

        setPaddleX(startingX);
        setItems([]);
        setScore(0);
        setLives(INITIAL_LIVES);
        setGameState("playing");
        setNotice({
            text: "Catch the blueprints. Avoid the redline glitches.",
            tone: "neutral",
        });
    }

    useEffect(() => {
        if (boardSize.width === 0 || boardSize.height === 0) return;
        if (paddleX !== 0) return;

        const frame = window.requestAnimationFrame(() => {
            const startingX = clamp(boardSize.width * 0.38, 0, Math.max(0, boardSize.width - paddleWidth));
            paddleXRef.current = startingX;
            setPaddleX(startingX);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [boardSize.height, boardSize.width, paddleWidth, paddleX]);

    useEffect(() => {
        if (gameState !== "playing") return;

        let frame = 0;
        const tick = (now: number) => {
            if (!lastFrameRef.current) {
                lastFrameRef.current = now;
            }

            const delta = Math.min(32, now - lastFrameRef.current);
            lastFrameRef.current = now;

            if (boardSize.width > 0 && boardSize.height > 0 && stateRef.current.gameState === "playing") {
                const nextSpawnAt = nextSpawnRef.current || now + 300;
                if (now >= nextSpawnAt) {
                    const nextId = itemIdRef.current++;
                    const currentScore = stateRef.current.score;
                    const item = buildItem(nextId, boardSize.width, currentScore, stateRef.current.reduceMotion);
                    setItems((current) => [...current, item].slice(-18));
                    const interval = stateRef.current.reduceMotion
                        ? Math.max(650, 1050 - currentScore * 20)
                        : Math.max(480, 920 - currentScore * 26);
                    nextSpawnRef.current = now + interval;
                }

                const paddleLeft = paddleXRef.current;
                const paddleRight = paddleLeft + paddleWidth;
                const paddleTop = paddleY;

                setItems((current) => {
                    const next: FallingItem[] = [];

                    for (const item of current) {
                        const drift = item.kind === "glitch"
                            ? Math.sin((now / 260) + item.driftSeed) * (stateRef.current.reduceMotion ? 0.5 : 1.2)
                            : Math.sin((now / 320) + item.driftSeed) * (stateRef.current.reduceMotion ? 0.25 : 0.7);
                        const nextX = clamp(item.x + drift, 0, Math.max(0, boardSize.width - item.size));
                        const nextY = item.y + (item.speed * delta) / 1000;

                        const overlapsPaddle = nextY + item.size >= paddleTop && nextY <= paddleTop + paddleHeight;
                        const intersects = nextX + item.size >= paddleLeft && nextX <= paddleRight;

                        if (overlapsPaddle && intersects) {
                            if (item.kind === "blueprint") {
                                const nextScore = stateRef.current.score + 1;
                                stateRef.current.score = nextScore;
                                setScore(nextScore);
                                setNotice({
                                    text: `Blueprint secured. ${TARGET_SCORE - nextScore > 0 ? `${TARGET_SCORE - nextScore} to rebuild.` : "Page recovered."}`,
                                    tone: "good",
                                });
                                if (nextScore > best) {
                                    setBest(nextScore);
                                }
                                if (nextScore >= TARGET_SCORE) {
                                    stateRef.current.gameState = "won";
                                    setGameState("won");
                                    setNotice({
                                        text: "Recovered. The missing page is back together.",
                                        tone: "good",
                                    });
                                    setItems([]);
                                    return [];
                                }
                            } else {
                                const nextLives = stateRef.current.lives - 1;
                                stateRef.current.lives = nextLives;
                                setLives(nextLives);
                                setNotice({
                                    text: nextLives > 0 ? "Redline glitch caught. Keep moving." : "The draft collapsed. Hit restart.",
                                    tone: nextLives > 0 ? "bad" : "bad",
                                });
                                if (nextLives <= 0) {
                                    stateRef.current.gameState = "lost";
                                    setGameState("lost");
                                    setItems([]);
                                    return [];
                                }
                            }
                            continue;
                        }

                        if (nextY <= boardSize.height + item.size) {
                            next.push({
                                ...item,
                                x: nextX,
                                y: nextY,
                            });
                        }
                    }

                    return next;
                });
            }

            frame = window.requestAnimationFrame(tick);
        };

        frame = window.requestAnimationFrame(tick);

        return () => window.cancelAnimationFrame(frame);
    }, [best, boardSize.height, boardSize.width, gameState, paddleHeight, paddleWidth, paddleY]);

    useEffect(() => {
        if (nextNoticeRef.current) {
            window.clearTimeout(nextNoticeRef.current);
        }
        nextNoticeRef.current = window.setTimeout(() => {
            setNotice((current) => current.tone === "neutral"
                ? current
                : {
                    text: gameState === "won"
                        ? "Recovered. The missing page is back together."
                        : gameState === "lost"
                            ? "The draft collapsed. Hit restart."
                            : "Catch the blueprints. Avoid the redline glitches.",
                    tone: "neutral",
                });
        }, 1200);

        return () => {
            if (nextNoticeRef.current) window.clearTimeout(nextNoticeRef.current);
        };
    }, [gameState, notice.text, notice.tone]);

    function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
        if (gameState !== "playing" || boardSize.width === 0) return;
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const updateFromClientX = (clientX: number) => {
            const next = clamp(clientX - rect.left - paddleWidth / 2, 0, Math.max(0, rect.width - paddleWidth));
            paddleXRef.current = next;
            setPaddleX(next);
        };

        updateFromClientX(event.clientX);
        event.currentTarget.setPointerCapture(event.pointerId);

        const move = (pointerEvent: PointerEvent) => {
            updateFromClientX(pointerEvent.clientX);
        };

        const end = () => {
            event.currentTarget.removeEventListener("pointermove", move);
            event.currentTarget.removeEventListener("pointerup", end);
            event.currentTarget.removeEventListener("pointercancel", end);
        };

        event.currentTarget.addEventListener("pointermove", move);
        event.currentTarget.addEventListener("pointerup", end);
        event.currentTarget.addEventListener("pointercancel", end);
    }

    const stateBadge =
        gameState === "won"
            ? "Recovered"
            : gameState === "lost"
                ? "Game over"
                : "Live round";

    return (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="surface-dark relative overflow-hidden p-4 text-paper sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="eyebrow font-mono text-sand">A-404 / LOST SHEET</p>
                        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-paper sm:text-4xl">
                            Catch the missing drawings.
                        </h1>
                    </div>
                    <div className="rounded-full border border-paper/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper/70">
                        {stateBadge}
                    </div>
                </div>

                <div
                    ref={boardRef}
                    tabIndex={0}
                    aria-label="404 recovery game board"
                    onPointerDown={handlePointer}
                    className="relative isolate h-[min(72vh,680px)] min-h-[420px] w-full overflow-hidden rounded-[28px] border border-paper/15 bg-paper/5 outline-none touch-none"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(231,216,196,0.12),transparent_33%),radial-gradient(circle_at_80%_20%,rgba(201,85,53,0.18),transparent_24%),linear-gradient(180deg,rgba(29,44,47,0.9),rgba(29,44,47,0.98))]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(244,241,234,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(244,241,234,0.07)_1px,transparent_1px)] bg-[size:26px_26px] opacity-30" />

                    <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                        <div className="rounded-full border border-paper/20 bg-night/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper/70">
                            Score {score}
                        </div>
                        <div className="rounded-full border border-paper/20 bg-night/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper/70">
                            Lives {lives}
                        </div>
                        <div className="rounded-full border border-paper/20 bg-night/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper/70">
                            Best {best}
                        </div>
                    </div>

                    <div
                        className={`absolute left-4 top-16 z-10 max-w-[18rem] rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md sm:left-6 sm:top-20 ${
                            notice.tone === "good"
                                ? "border-sand/30 bg-sand/10 text-sand"
                                : notice.tone === "bad"
                                    ? "border-redline/40 bg-redline/10 text-redline"
                                    : "border-paper/20 bg-night/60 text-paper/75"
                        }`}
                    >
                        {notice.text}
                    </div>

                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper/10 to-transparent" />

                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="absolute left-0 top-0 will-change-transform"
                            style={{
                                transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
                                width: item.size,
                                height: item.size,
                            }}
                        >
                            <div
                                className={`grid h-full w-full place-items-center rounded-2xl border text-center shadow-lg ${
                                    item.kind === "blueprint"
                                        ? "border-paper/35 bg-paper text-ink"
                                        : "border-redline/50 bg-redline text-paper"
                                }`}
                            >
                                {item.kind === "blueprint" ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full border border-redline" />
                                        <span className="font-mono text-[9px] uppercase tracking-wider">Plan</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-lg leading-none">×</span>
                                        <span className="font-mono text-[9px] uppercase tracking-wider">Glitch</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div
                        className="absolute bottom-7 z-10 h-[18px] rounded-full border border-paper/35 bg-paper/90 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                        style={{
                            width: paddleWidth,
                            transform: `translate3d(${paddleX}px, 0, 0)`,
                            left: 0,
                            bottom: 28,
                        }}
                    >
                        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-ink/15" />
                    </div>

                    {(gameState === "won" || gameState === "lost") && (
                        <div className="absolute inset-0 z-20 grid place-items-center bg-night/45 p-6 backdrop-blur-sm">
                            <div className="surface-dark max-w-md rounded-[28px] p-6 text-paper">
                                <p className="eyebrow font-mono text-sand">{gameState === "won" ? "PAGE RECOVERED" : "RELOAD REQUIRED"}</p>
                                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">
                                    {gameState === "won" ? "The missing page is back." : "The draft needs another pass."}
                                </h2>
                                <p className="mt-3 text-sm leading-relaxed text-paper/75">
                                    {gameState === "won"
                                        ? "You caught the last blueprint. Use the home link below or replay for a better score."
                                        : "Restart and keep the blueprints centered. The layout will give you another run."}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={resetGame}
                                        className="interactive inline-flex items-center justify-center rounded-full border border-paper/20 bg-paper/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-paper hover:text-ink"
                                    >
                                        Play again
                                    </button>
                                    <Link
                                        href="/"
                                        className="interactive inline-flex items-center justify-center rounded-full border border-sand bg-sand px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink hover:bg-paper"
                                    >
                                        Go home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3 sm:inset-x-6">
                        <div className="max-w-[18rem] rounded-2xl border border-paper/15 bg-night/65 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper/65">
                            Drag, tap, or use arrow keys and A / D.
                        </div>
                        {reduceMotion && (
                            <div className="rounded-2xl border border-paper/15 bg-night/65 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper/65">
                                Reduced motion mode
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <aside className="surface p-5 sm:p-6">
                <p className="eyebrow font-mono text-redline">WHY THIS EXISTS</p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-ink">
                    A small recovery game for a missing route.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-graphite">
                    The page is missing, but the detour should still feel like part of ArchiCareer. Catch blueprints to rebuild the page and avoid the broken-link glitches.
                </p>

                <div className="mt-6 space-y-3 border-t border-line pt-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">Goal</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink">10 blueprints</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">Penalty</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink">3 glitches</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">Controls</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink">Drag, tap, arrows</span>
                    </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-line bg-warm-white p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-redline">FIELD NOTES</p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-graphite">
                        <li>Works with touch, mouse, and keyboard.</li>
                        <li>Uses a reduced-motion mode for users who prefer less movement.</li>
                        <li>Never traps the user here. The home link is always available.</li>
                    </ul>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={resetGame}
                        className="interactive inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-paper hover:border-redline hover:bg-redline"
                    >
                        Restart round
                    </button>
                    <Link
                        href="/discover"
                        className="inline-flex items-center justify-center rounded-full border border-line bg-paper px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink hover:border-ink hover:bg-warm-white"
                    >
                        Browse the network
                    </Link>
                </div>
            </aside>
        </div>
    );
}
