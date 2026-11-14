import type { Profile } from "@/types";
import { createClient, createPublicClient } from "@/lib/supabase/server";

export type DirectMessage = {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    read_at: string | null;
    created_at: string;
};

export type MessagePerson = Pick<Profile, "id" | "user_id" | "name" | "slug" | "role" | "avatar_url">;

export type ConversationSummary = {
    userId: string;
    person: MessagePerson | null;
    lastMessage: DirectMessage;
    unreadCount: number;
};

type QueryResult<T> = { data: T | null; error: Error | null };

const MESSAGE_COLUMNS = "id, sender_id, recipient_id, content, read_at, created_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserId(value: string) {
    return UUID.test(value);
}

async function peopleByUserId(userIds: string[]): Promise<Map<string, MessagePerson>> {
    if (userIds.length === 0) return new Map();
    const { data } = await createPublicClient()
        .from("profiles")
        .select("id, user_id, name, slug, role, avatar_url")
        .in("user_id", userIds);
    return new Map((data ?? []).map((person) => [person.user_id, person as MessagePerson]));
}

export async function getPerson(userId: string): Promise<MessagePerson | null> {
    if (!isUserId(userId)) return null;
    const { data } = await createPublicClient()
        .from("profiles")
        .select("id, user_id, name, slug, role, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
    return (data as MessagePerson) ?? null;
}

/** Every conversation the person is part of, most recent first. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
    const client = await createClient();
    const { data, error } = await client
        .from("messages")
        .select(MESSAGE_COLUMNS)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(400);
    if (error || !data) return [];

    const byCounterpart = new Map<string, ConversationSummary>();
    for (const message of data as DirectMessage[]) {
        const other = message.sender_id === userId ? message.recipient_id : message.sender_id;
        const unread = message.recipient_id === userId && !message.read_at;
        const existing = byCounterpart.get(other);
        if (existing) {
            if (unread) existing.unreadCount += 1;
        } else {
            byCounterpart.set(other, { userId: other, person: null, lastMessage: message, unreadCount: unread ? 1 : 0 });
        }
    }

    const people = await peopleByUserId([...byCounterpart.keys()]);
    for (const [id, conversation] of byCounterpart) conversation.person = people.get(id) ?? null;
    return [...byCounterpart.values()];
}

/** The messages between two people, oldest first. */
export async function getThread(userId: string, otherUserId: string, limit = 200): Promise<DirectMessage[]> {
    if (!isUserId(otherUserId)) return [];
    const client = await createClient();
    const { data, error } = await client
        .from("messages")
        .select(MESSAGE_COLUMNS)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true })
        .limit(Math.min(Math.max(limit, 1), 400));
    if (error || !data) return [];
    return data as DirectMessage[];
}

export async function sendMessage(recipientId: string, content: string): Promise<QueryResult<DirectMessage>> {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { data: null, error: new Error("Unauthenticated") };
    if (!isUserId(recipientId)) return { data: null, error: new Error("That person could not be found.") };
    if (recipientId === user.id) return { data: null, error: new Error("You can’t message yourself.") };
    const trimmed = content.trim();
    if (!trimmed) return { data: null, error: new Error("Write a message first.") };
    if (trimmed.length > 4000) return { data: null, error: new Error("That message is too long.") };

    // Insert, then read back: asking for the inserted row re-checks the SELECT
    // policy inside the INSERT, which this project's policies reject.
    const id = crypto.randomUUID();
    const { error } = await client.from("messages").insert({ id, sender_id: user.id, recipient_id: recipientId, content: trimmed });
    if (error) return { data: null, error: new Error("We couldn’t send that message just now. Please try again.") };
    const { data, error: readError } = await client.from("messages").select(MESSAGE_COLUMNS).eq("id", id).maybeSingle();
    if (readError || !data) return { data: null, error: new Error("We couldn’t send that message just now. Please try again.") };
    return { data: data as DirectMessage, error: null };
}

export async function markThreadRead(otherUserId: string): Promise<void> {
    if (!isUserId(otherUserId)) return;
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    await client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", user.id)
        .eq("sender_id", otherUserId)
        .is("read_at", null);
}
