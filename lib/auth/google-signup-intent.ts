import { createHmac, timingSafeEqual } from "node:crypto";

export const GOOGLE_SIGNUP_INTENT_COOKIE = "archicareer_google_signup";
const INTENT_MAX_AGE_SECONDS = 30 * 60;

export type GoogleSignupIntent = {
    account_type: "student" | "professional" | "firm" | "business";
    role: "student" | "architect" | "firm";
    user_metadata: Record<string, unknown>;
    issued_at?: number;
};

function secret() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("Google sign-up intent signing is not configured.");
    return key;
}

export function signGoogleSignupIntent(intent: GoogleSignupIntent) {
    const payload = Buffer.from(JSON.stringify({ ...intent, issued_at: Date.now() })).toString("base64url");
    const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyGoogleSignupIntent(value: string | undefined): GoogleSignupIntent | null {
    if (!value || value.length > 7000) return null;
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    try {
        const expected = createHmac("sha256", secret()).update(payload).digest();
        const supplied = Buffer.from(signature, "base64url");
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
        const issuedAt = parsed.issued_at;
        if (typeof issuedAt !== "number" || Date.now() - issuedAt < 0 || Date.now() - issuedAt > INTENT_MAX_AGE_SECONDS * 1000) return null;
        if (!["student", "professional", "firm", "business"].includes(String(parsed.account_type))) return null;
        if (!["student", "architect", "firm"].includes(String(parsed.role))) return null;
        if (!parsed.user_metadata || typeof parsed.user_metadata !== "object" || Array.isArray(parsed.user_metadata)) return null;
        return parsed as unknown as GoogleSignupIntent;
    } catch {
        return null;
    }
}

export { INTENT_MAX_AGE_SECONDS };
