"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const focusedRoutes = [
    "/login",
    "/signup",
    "/firms/login",
    "/firms/signup",
];

export default function SiteChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isFocusedRoute = focusedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

    return isFocusedRoute ? null : children;
}
