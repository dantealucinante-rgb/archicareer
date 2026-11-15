import { useEffect, useRef, useState } from "react";

export function useSlidingNavIndicator({
  containerRef,
  linkRefs,
  activeHref,
  orientation = "horizontal",
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  linkRefs: React.RefObject<Record<string, HTMLElement | null>>;
  activeHref?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const initialized = useRef(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    return () => mq.removeEventListener("change", () => {});
  }, []);

  useEffect(() => {
    initialized.current = true;

    const measure = () => {
      const container = containerRef.current;
      const link = activeHref ? (linkRefs.current[activeHref] ?? null) : null;
      if (!container || !link) {
        setStyle({ visibility: "hidden" });
        return;
      }
      const cr = container.getBoundingClientRect();
      const lr = link.getBoundingClientRect();
      const transition = reducedMotion.current || !initialized.current
        ? "none"
        : "left 300ms cubic-bezier(0.22, 1, 0.36, 1), width 300ms cubic-bezier(0.22, 1, 0.36, 1), top 300ms cubic-bezier(0.22, 1, 0.36, 1), height 300ms cubic-bezier(0.22, 1, 0.36, 1)";
      if (orientation === "vertical") {
        setStyle({
          position: "absolute",
          left: 0,
          top: Math.round(lr.top - cr.top),
          width: 4,
          height: Math.round(lr.height),
          background: "var(--color-ink)",
          borderRadius: 2,
          zIndex: 2,
          visibility: "visible",
          transition,
        });
      } else {
        setStyle({
          position: "absolute",
          left: Math.round(lr.left - cr.left),
          bottom: 8,
          width: Math.round(lr.width),
          height: 4,
          background: "var(--color-ink)",
          borderRadius: "2px 2px 0 0",
          zIndex: 2,
          visibility: "visible",
          transition,
        });
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    const container = containerRef.current;
    if (container) ro.observe(container);
    Object.values(linkRefs.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [containerRef, linkRefs, activeHref, orientation]);

  return style;
}
