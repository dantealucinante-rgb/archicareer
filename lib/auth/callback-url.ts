import { SITE_URL } from "@/lib/seo";

type CallbackOptions = {
    next?: string;
    signInType?: string;
};

/** Build every browser auth callback on the canonical production origin. */
export function authCallbackUrl({ next, signInType }: CallbackOptions = {}) {
    const origin = process.env.NODE_ENV === "production" ? SITE_URL : window.location.origin;
    const callback = new URL("/auth/callback", origin);
    if (next) callback.searchParams.set("next", next);
    if (signInType) callback.searchParams.set("signin_type", signInType);
    return callback.toString();
}
