"use client";

import { useRouter } from "next/navigation";

export default function SettingsBackButton() {
    const router = useRouter();

    return <button type="button" onClick={() => router.back()} className="interactive inline-flex min-h-10 shrink-0 items-center rounded-full border border-line bg-warm-white px-4 font-mono text-[10px] uppercase tracking-widest text-ink hover:border-[#1D70E8] hover:text-[#1D70E8]">← Back</button>;
}
