"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignOutButton({ mobile = false }: { mobile?: boolean }) {
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

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

    return (
        <button type="button" onClick={signOut} disabled={signingOut} className={`${mobile ? "text-ink" : "hidden sm:inline"} text-graphite transition-colors hover:text-ink disabled:opacity-60`}>
            {signingOut ? "Signing out..." : "Sign out"}
        </button>
    );
}
