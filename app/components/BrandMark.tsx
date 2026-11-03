import type { SVGProps } from "react";

export default function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 87 88"
            fill="#356DE3"
            aria-hidden="true"
            className={className}
            {...props}
        >
            <path d="M0 0H87V29L43.5 4L0 29Z" />
            <path d="M0 0H87V29L43.5 4L0 29Z" transform="translate(0 29.5)" />
            <path d="M0 0H87V29L43.5 4L0 29Z" transform="translate(0 59)" />
        </svg>
    );
}
