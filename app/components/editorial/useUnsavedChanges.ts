"use client";

import { useEffect } from "react";

/**
 * Warns before a full page unload while there are unsaved edits.
 * In-app navigation is covered by the sticky SaveBar, which stays visible for
 * as long as anything is dirty.
 */
export function useUnsavedChanges(dirty: boolean) {
    useEffect(() => {
        if (!dirty) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);
}
