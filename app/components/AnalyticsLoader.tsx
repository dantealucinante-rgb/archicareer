"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "archicareer_analytics_consent";
const CONSENT_EVENT = "archicareer:analytics-consent";
const PRIVATE_PATHS = ["/admin", "/applications", "/auth", "/login", "/signup", "/join", "/onboarding", "/profile", "/settings", "/reset-password", "/business/signup", "/firms/login", "/firms/signup", "/firms/onboarding"];

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

function isPrivatePath(pathname: string) {
    return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function trackPage(pathname: string, measurementId: string) {
    if (!window.gtag || isPrivatePath(pathname)) return;
    window.gtag("event", "page_view", { page_path: pathname, page_title: document.title, send_to: measurementId });
}

export function saveAnalyticsConsent(granted: boolean) {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

export default function AnalyticsLoader() {
    const pathname = usePathname();
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    useEffect(() => {
        if (!measurementId) return;

        const initialize = () => {
            const granted = localStorage.getItem(CONSENT_KEY) === "granted";
            if (!granted) {
                window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
                return;
            }

            if (!window.gtag) {
                const dataLayer = window.dataLayer = window.dataLayer || [];
                window.gtag = (...args: unknown[]) => dataLayer.push(args);
                window.gtag("js", new Date());
                window.gtag("config", measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
                const script = document.createElement("script");
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
                document.head.appendChild(script);
            }
            window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
            trackPage(pathname, measurementId);
        };

        initialize();
        window.addEventListener(CONSENT_EVENT, initialize);
        window.addEventListener("storage", initialize);
        return () => {
            window.removeEventListener(CONSENT_EVENT, initialize);
            window.removeEventListener("storage", initialize);
        };
    }, [measurementId, pathname]);

    return null;
}
