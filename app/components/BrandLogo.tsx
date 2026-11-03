import type { SVGProps } from "react";
import BrandMark from "./BrandMark";

type Props = SVGProps<SVGSVGElement> & { showWordmark?: boolean };

export default function BrandLogo({ showWordmark = true, className, ...props }: Props) {
    return (
        <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
            <BrandMark className="h-8 w-8 shrink-0" {...props} />
            {showWordmark && <span>ArchiCareer<span aria-hidden="true">.</span></span>}
        </span>
    );
}
