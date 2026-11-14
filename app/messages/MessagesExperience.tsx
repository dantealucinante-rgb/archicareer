"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { formatCommunityDate } from "@/lib/date-format";
import type { ConversationSummary, DirectMessage, MessagePerson } from "@/lib/queries/messages";
import styles from "./messages.module.css";

type Props = {
    currentUserId: string;
    conversations: ConversationSummary[];
    activeUserId: string | null;
    activePerson: MessagePerson | null;
    initialMessages: DirectMessage[];
};

function roleLabel(role: string) {
    if (role === "student") return "Architecture student";
    if (role === "architect") return "Architect";
    if (role === "firm") return "Architecture practice";
    return "Built environment professional";
}

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function MessagesExperience({ currentUserId, conversations, activeUserId, activePerson, initialMessages }: Props) {
    const [messages, setMessages] = useState<DirectMessage[]>(initialMessages);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const threadEnd = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!activeUserId) return;
        void fetch("/api/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ with: activeUserId }),
        }).catch(() => undefined);
    }, [activeUserId]);

    useEffect(() => {
        threadEnd.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    async function send(event: React.FormEvent) {
        event.preventDefault();
        if (!activeUserId || sending) return;
        const content = body.trim();
        if (!content) return;
        setSending(true);
        setError("");
        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient_id: activeUserId, content }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.message) {
                setError(payload.error ?? "We couldn’t send that message just now. Please try again.");
                return;
            }
            setMessages((current) => [...current, payload.message as DirectMessage]);
            setBody("");
        } catch {
            setError("We couldn’t send that message just now. Please try again.");
        } finally {
            setSending(false);
        }
    }

    return <div className={styles.layout}>
        <section className={styles.listPane} aria-label="Conversations">
            <header className={styles.listHeader}>
                <h2>Conversations</h2>
                <span className={styles.count}>{conversations.length}</span>
            </header>
            {conversations.length === 0
                ? <p className={styles.listEmpty}>No conversations yet. Open someone’s profile and send them a message.</p>
                : <ul className={styles.list}>
                    {conversations.map((conversation) => {
                        const active = conversation.userId === activeUserId;
                        const name = conversation.person?.name ?? "Community member";
                        return <li key={conversation.userId}>
                            <Link href={`/messages?with=${conversation.userId}`} className={`${styles.listItem} ${active ? styles.listItemActive : ""}`} aria-current={active ? "true" : undefined}>
                                <span className={styles.listAvatar}>
                                    {conversation.person?.avatar_url
                                        ? <ProfileAvatar profile={conversation.person} size={44} />
                                        : <span className={styles.initials}>{initials(name)}</span>}
                                </span>
                                <span className={styles.listBody}>
                                    <span className={styles.listTop}>
                                        <strong>{name}</strong>
                                        <time dateTime={conversation.lastMessage.created_at}>{formatCommunityDate(conversation.lastMessage.created_at)}</time>
                                    </span>
                                    <span className={styles.listPreview}>{conversation.lastMessage.sender_id === currentUserId ? "You: " : ""}{conversation.lastMessage.content}</span>
                                </span>
                                {conversation.unreadCount > 0 && <span className={styles.unread} aria-label={`${conversation.unreadCount} unread`}>{conversation.unreadCount}</span>}
                            </Link>
                        </li>;
                    })}
                </ul>}
        </section>

        <section className={styles.threadPane} aria-label="Conversation">
            {!activePerson
                ? <div className={styles.threadEmpty}>
                    <p className={styles.threadEmptyTitle}>Pick a conversation</p>
                    <p className={styles.threadEmptyCopy}>Your messages stay between you and the person you’re writing to.</p>
                </div>
                : <>
                    <header className={styles.threadHeader}>
                        <Link href={`/p/${activePerson.slug}`} className={styles.threadPerson}>
                            {activePerson.avatar_url ? <ProfileAvatar profile={activePerson} size={44} /> : <span className={styles.initials}>{initials(activePerson.name)}</span>}
                            <span>
                                <strong>{activePerson.name}</strong>
                                <small>{roleLabel(activePerson.role)}</small>
                            </span>
                        </Link>
                        <Link href={`/p/${activePerson.slug}`} className={styles.profileLink}>View profile</Link>
                    </header>

                    <div className={styles.threadScroll}>
                        {messages.length === 0
                            ? <p className={styles.threadStart}>This is the start of your conversation with {activePerson.name}.</p>
                            : messages.map((message) => {
                                const mine = message.sender_id === currentUserId;
                                return <div key={message.id} className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ""}`}>
                                    <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ""}`}>
                                        <p>{message.content}</p>
                                        <time dateTime={message.created_at}>{formatCommunityDate(message.created_at)}</time>
                                    </div>
                                </div>;
                            })}
                        <div ref={threadEnd} />
                    </div>

                    <form onSubmit={send} className={styles.composer}>
                        <label htmlFor="message-body" className={styles.srOnly}>Write a message</label>
                        <textarea
                            id="message-body"
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    void send(event);
                                }
                            }}
                            placeholder={`Message ${activePerson.name}`}
                            maxLength={4000}
                            rows={2}
                            disabled={sending}
                        />
                        <button type="submit" className={styles.sendButton} disabled={sending || !body.trim()}>{sending ? "Sending…" : "Send"}</button>
                    </form>
                    {error && <p role="alert" className={styles.error}>{error}</p>}
                </>}
        </section>
    </div>;
}
