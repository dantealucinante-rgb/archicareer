"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
    resource: "user" | "post" | "comment" | "showcase" | "job" | "report" | "role";
    id: string;
    action: string;
    label: string;
    tone?: "danger" | "default" | "primary";
    resourceTitle?: string;
};

export default function AdminActionButton({
    resource,
    id,
    action,
    label,
    tone = "default",
    resourceTitle,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setIsOpen(false);
                    setErrorMsg("");
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen]);

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();
        const trimmed = reason.trim();
        if (trimmed.length < 3 || saving) return;

        setSaving(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/admin", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resource, id, action, reason: trimmed }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error ?? "Failed to perform administrative action");
            }

            setIsOpen(false);
            setReason("");
            router.refresh();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    }

    const buttonClass =
        tone === "danger"
            ? "border-redline/30 text-redline hover:bg-redline hover:text-white"
            : tone === "primary"
            ? "border-ink bg-ink text-paper hover:bg-night"
            : "border-line text-graphite hover:border-ink hover:text-ink hover:bg-sand/40";

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all duration-150 active:scale-[0.97] cursor-pointer ${buttonClass}`}
            >
                {label}
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-opacity duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                            setErrorMsg("");
                        }
                    }}
                >
                    <div className="relative w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl transition-all duration-200 transform scale-100">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                                    Administrative Confirmation
                                </span>
                                <h3 id="modal-title" className="mt-1 font-display text-lg font-semibold text-ink">
                                    {label} {resource}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setErrorMsg("");
                                }}
                                className="rounded p-1 text-graphite hover:bg-sand hover:text-ink cursor-pointer"
                                aria-label="Close dialog"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {resourceTitle && (
                            <p className="mt-2 text-xs text-graphite truncate font-mono">
                                Target: {resourceTitle}
                            </p>
                        )}

                        <p className="mt-2 text-xs text-graphite leading-relaxed">
                            This operation will be recorded in the permanent audit trail with your administrator ID and timestamp.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-4">
                            <label className="block text-xs font-medium text-ink">
                                Reason for action <span className="text-redline">*</span>
                            </label>
                            <textarea
                                ref={inputRef}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this action is being taken (e.g. Terms violation, reported spam, approved appeal)..."
                                rows={3}
                                required
                                minLength={3}
                                maxLength={1000}
                                className="mt-1.5 w-full rounded-lg border border-line bg-warm-white p-2.5 text-xs text-ink placeholder:text-graphite/60 focus:border-redline focus:outline-none focus:ring-1 focus:ring-redline"
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-graphite">
                                <span>Minimum 3 characters</span>
                                <span>{reason.length}/1000</span>
                            </div>

                            {errorMsg && (
                                <div role="alert" className="mt-3 rounded-md border border-redline/30 bg-redline/5 p-2.5 text-xs text-redline">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setErrorMsg("");
                                    }}
                                    disabled={saving}
                                    className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-graphite hover:bg-sand hover:text-ink transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || reason.trim().length < 3}
                                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                                        tone === "danger"
                                            ? "bg-redline text-white hover:bg-redline/90"
                                            : "bg-ink text-paper hover:bg-night"
                                    }`}
                                >
                                    {saving ? "Recording..." : `Confirm ${action}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
