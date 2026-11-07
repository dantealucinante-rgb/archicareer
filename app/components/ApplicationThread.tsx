"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApplicationMessage } from "@/types";
import { formatCommunityDate } from "@/lib/date-format";

export default function ApplicationThread({ applicationId, currentUserId }: { applicationId: string; currentUserId: string }) {
    const [messages, setMessages] = useState<ApplicationMessage[]>([]);
    const [body, setBody] = useState("");
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [failedIds, setFailedIds] = useState<string[]>([]);
    const sendingRef = useRef(false);
    const loadingRef = useRef(false);

    const loadMessages = useCallback(async (signal?: AbortSignal, showLoading = true) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        if (showLoading) setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/applications/${applicationId}/messages`, { signal });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Unable to load conversation");
            setMessages((current) => [...(payload.messages ?? []), ...current.filter((message) => message.id.startsWith("temp-"))]);
        } catch (loadError) {
            if (loadError instanceof Error && loadError.name === "AbortError") return;
            setError(loadError instanceof Error ? loadError.message : "Unable to load conversation");
        } finally {
            loadingRef.current = false;
            if (!signal?.aborted && showLoading) setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        const initialLoad = window.setTimeout(() => void loadMessages(controller.signal), 0);
        const refresh = window.setInterval(() => void loadMessages(controller.signal, false), 15000);
        return () => {
            controller.abort();
            window.clearTimeout(initialLoad);
            window.clearInterval(refresh);
        };
    }, [loadMessages, open]);

    async function send(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!body.trim() || sendingRef.current) return;
        await sendMessage(body.trim());
    }

    async function sendMessage(text: string, id = `temp-${crypto.randomUUID()}`) {
        if (sendingRef.current) return;
        sendingRef.current = true;
        setStatus("Sending...");
        setError("");
        setFailedIds((current) => current.filter((failedId) => failedId !== id));
        const optimistic: ApplicationMessage = { id, application_id: applicationId, sender_id: currentUserId, body: text, created_at: new Date().toISOString() };
        if (!messages.some((message) => message.id === id)) setMessages((current) => [...current, optimistic]);
        try {
            const response = await fetch(`/api/applications/${applicationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error ?? "Couldn’t send message. Try again.");
            setMessages((current) => current.map((message) => message.id === id ? payload.message : message));
            setBody("");
            setStatus("");
        } catch {
            setFailedIds((current) => current.includes(id) ? current : [...current, id]);
            setError("Couldn’t send message. Try again.");
            setStatus("");
        } finally {
            sendingRef.current = false;
        }
    }

    return <div className="mt-4 border-t border-line pt-4"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="font-mono text-[10px] uppercase tracking-widest text-redline hover:text-ink">{open ? "Hide conversation" : "Open conversation"}</button>{open && <div className="mt-3 space-y-3" aria-busy={loading}><div className="max-h-64 space-y-2 overflow-y-auto">{loading ? <p className="text-sm text-graphite">Loading conversation...</p> : error && messages.length === 0 ? <div className="space-y-2"><p role="alert" className="text-sm text-redline">{error}</p><button type="button" onClick={() => void loadMessages()} className="font-mono text-[10px] uppercase tracking-widest text-redline underline">Try again</button></div> : messages.length === 0 ? <p className="text-sm text-graphite">No messages yet. Start the conversation.</p> : messages.map((message) => <div key={message.id} className={`max-w-[90%] border border-line px-3 py-2 text-sm ${message.sender_id === currentUserId ? "ml-auto bg-ink text-paper" : "bg-paper text-ink"}`}><p className="whitespace-pre-wrap">{message.body}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-widest opacity-60">{formatCommunityDate(message.created_at)}</p>{message.id.startsWith("temp-") && <p className="mt-1 text-[9px] uppercase tracking-wider">{failedIds.includes(message.id) ? <>Not sent. <button type="button" onClick={() => void sendMessage(message.body, message.id)} className="underline">Retry</button></> : "Sending…"}</p>}</div>)}</div><form onSubmit={send} className="flex flex-col gap-2 sm:flex-row"><input value={body} onChange={(event) => setBody(event.target.value)} className="field-input text-sm" placeholder="Write a message" maxLength={4000} disabled={loading} /><button type="submit" disabled={loading || status === "Sending..."} className="inline-flex shrink-0 items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-redline disabled:cursor-not-allowed disabled:opacity-60">{status === "Sending..." ? "Sending..." : "Send"}</button></form>{error && messages.length > 0 && <p role="alert" className="font-mono text-[10px] uppercase tracking-widest text-redline">{error}</p>}</div>}</div>;
}
