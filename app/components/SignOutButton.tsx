"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignOutButton({ mobile = false }: { mobile?: boolean }) {
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);
    const [confirming, setConfirming] = useState(false);

    async function signOut() {
        setSigningOut(true);
        const { error } = await createClient().auth.signOut();
        if (!error) {
            router.replace("/login");
            router.refresh();
        } else {
            setSigningOut(false);
        }
    }

    if (confirming) {
        return (
            <div className={`${mobile ? "rounded-xl bg-sand/40 p-3" : "hidden sm:block"}`} role="alertdialog" aria-label="Confirm sign out">
                <p className="text-sm leading-snug text-ink">Are you sure you want to sign out?</p>
                <div className="mt-3 flex items-center gap-3">
                    <button type="button" onClick={() => setConfirming(false)} disabled={signingOut} className="text-xs text-graphite transition-colors hover:text-ink disabled:opacity-60">Cancel</button>
                    <button type="button" onClick={signOut} disabled={signingOut} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                        {signingOut ? "Signing out..." : "Yes, sign out"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button type="button" onClick={() => setConfirming(true)} disabled={signingOut} className={`${mobile ? "text-red-600" : "hidden sm:inline text-red-600"} transition-colors hover:text-red-700 disabled:opacity-60`}>
            Sign out
        </button>
    );
}
