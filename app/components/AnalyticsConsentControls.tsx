"use client";

import { useSyncExternalStore } from "react";
import { saveAnalyticsConsent } from "@/app/components/AnalyticsLoader";
import styles from "@/app/cookies/cookies.module.css";

const CONSENT_KEY = "archicareer_analytics_consent";
const CONSENT_EVENT = "archicareer:analytics-consent";

function subscribe(listener: () => void) {
    window.addEventListener(CONSENT_EVENT, listener);
    window.addEventListener("storage", listener);
    return () => {
        window.removeEventListener(CONSENT_EVENT, listener);
        window.removeEventListener("storage", listener);
    };
}

function getSnapshot(): "granted" | "denied" | null {
    const saved = localStorage.getItem(CONSENT_KEY);
    return saved === "granted" || saved === "denied" ? saved : null;
}

function getServerSnapshot(): null {
    return null;
}

export default function AnalyticsConsentControls() {
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    function update(granted: boolean) {
        saveAnalyticsConsent(granted);
    }

    return <div className={styles.consentControls}>
        <p aria-live="polite">{consent === "granted" ? "Optional analytics are enabled." : consent === "denied" ? "Optional analytics are disabled." : "Optional analytics are off unless you choose to enable them."}</p>
        <div>
            <button type="button" onClick={() => update(true)} aria-pressed={consent === "granted"}>Allow analytics</button>
            <button type="button" onClick={() => update(false)} aria-pressed={consent === "denied"}>Keep analytics off</button>
        </div>
    </div>;
}
