import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { showWordmark?: boolean };

export default function BrandLogo({ showWordmark = true, className, ...props }: Props) {
    return (
        <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
            <svg viewBox="0 0 48 56" aria-hidden="true" className="h-8 w-[27px] shrink-0" {...props}>
                <path fill="currentColor" d="M4 4h40v48L24 40 4 52z" />
                <path fill="var(--color-paper)" d="m4 8 20 12L44 8v9L24 29 4 17z" />
                <path fill="var(--color-paper)" d="m4 25 20 12 20-12v9L24 46 4 34z" />
            </svg>
            {showWordmark && <span>ArchiCareer<span aria-hidden="true">.</span></span>}
        </span>
    );
}
