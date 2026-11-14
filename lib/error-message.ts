/**
 * Client-facing error text.
 *
 * Query helpers return plain sentences for the cases a person can act on. Anything
 * that leaks database or transport detail (RLS violations, constraint names, schema
 * cache misses) is replaced with the caller's fallback so the UI only ever shows a
 * sentence someone can read.
 */
const TECHNICAL = /row-level security|violates|permission denied|duplicate key|foreign key|null value in column|invalid input syntax|schema cache|does not exist|PGRST|JWT|syntax error|relation "|column "|operator does not exist|timeout|ECONN|fetch failed/i;

export function safeMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
    if (!message.trim()) return fallback;
    if (TECHNICAL.test(message)) return fallback;
    return message;
}
