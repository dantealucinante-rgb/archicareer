"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PROFESSIONS = ["Architects", "Engineers", "Designers", "Planners", "Creatives", "Professionals"] as const;
const INTERVAL_MS = 3000;
const TRANSITION_MS = 520;
const wrap = (index: number) => (index + PROFESSIONS.length) % PROFESSIONS.length;

export default function ProfessionWheel() {
    const [active, setActive] = useState(0);
    const [moving, setMoving] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const activeRef = useRef(0);
    const movingRef = useRef(false);
    const trackRef = useRef<HTMLSpanElement>(null);
    const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const queuedDirection = useRef<1 | -1 | null>(null);
    const touchStartY = useRef<number | null>(null);
    const moveRef = useRef<(direction: 1 | -1, manual?: boolean) => void>(() => {});

    const clearTimer = (timer: typeof autoTimer) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const scheduleAuto = useCallback(() => {
        clearTimer(autoTimer);
        if (reducedMotion) return;
        autoTimer.current = setTimeout(() => moveRef.current(1, false), INTERVAL_MS);
    }, [reducedMotion]);

    const move = useCallback((direction: 1 | -1, manual = true) => {
        if (movingRef.current || reducedMotion) return;
        if (manual) {
            clearTimer(autoTimer);
            clearTimer(resumeTimer);
            resumeTimer.current = setTimeout(() => {
                resumeTimer.current = null;
                moveRef.current(1, false);
            }, 4000);
        }
        movingRef.current = true;
        setMoving(true);
        queuedDirection.current = direction;
        requestAnimationFrame(() => {
            if (trackRef.current) trackRef.current.style.transform = `translateY(${direction > 0 ? "-2" : "0"}em)`;
        });
        resetTimer.current = setTimeout(() => {
            activeRef.current = wrap(activeRef.current + direction);
            setActive(activeRef.current);
            movingRef.current = false;
            setMoving(false);
            queuedDirection.current = null;
            if (trackRef.current) {
                trackRef.current.style.transition = "none";
                trackRef.current.style.transform = "translateY(-1em)";
                void trackRef.current.offsetHeight;
                trackRef.current.style.transition = "";
            }
            if (!manual && !resumeTimer.current) scheduleAuto();
        }, TRANSITION_MS);
    }, [reducedMotion, scheduleAuto]);
    useEffect(() => {
        moveRef.current = move;
    }, [move]);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(query.matches);
        update();
        query.addEventListener("change", update);
        return () => {
            query.removeEventListener("change", update);
            clearTimer(autoTimer);
            clearTimer(resumeTimer);
            clearTimer(resetTimer);
        };
    }, []);

    useEffect(() => {
        if (reducedMotion) {
            clearTimer(autoTimer);
            clearTimer(resumeTimer);
        } else if (!movingRef.current) scheduleAuto();
        return () => clearTimer(autoTimer);
    }, [reducedMotion, scheduleAuto]);

    const onWheel = (event: React.WheelEvent<HTMLSpanElement>) => {
        if (Math.abs(event.deltaY) < 8) return;
        event.preventDefault();
        move(event.deltaY > 0 ? 1 : -1);
    };

    const startTouch = (event: React.TouchEvent<HTMLSpanElement>) => { touchStartY.current = event.touches[0]?.clientY ?? null; };
    const endTouch = (event: React.TouchEvent<HTMLSpanElement>) => {
        const start = touchStartY.current;
        const end = event.changedTouches[0]?.clientY;
        touchStartY.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < 18) return;
        move(end < start ? 1 : -1);
    };

    const indexes = [wrap(active - 1), active, wrap(active + 1)];
    const visibleText = `For ${PROFESSIONS[active]}, by architects.`;

    return <span className="profession-sentence" aria-label={visibleText}>
        <span aria-hidden="true">For&nbsp;</span>
        <span className={`profession-wheel${reducedMotion ? " profession-wheel-static" : ""}`} onWheel={onWheel} onTouchStart={startTouch} onTouchEnd={endTouch}>
            <span className="profession-wheel-window">
                <span ref={trackRef} className={`profession-wheel-track${moving ? " profession-wheel-moving" : ""}`}>
                    {indexes.map((index, position) => <span key={`${index}-${position}`} className={`profession-option profession-option-${position}`}>{PROFESSIONS[index]}</span>)}
                </span>
            </span>
            <span className="sr-only">{visibleText}</span>
        </span>
        <span aria-hidden="true">,&nbsp;by architects.</span>
    </span>;
}
