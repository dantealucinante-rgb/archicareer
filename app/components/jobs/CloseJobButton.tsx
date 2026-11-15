"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function CloseJobButton() {
	const router = useRouter();
	const pathname = usePathname();
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");

	async function closeListing() {
		setPending(true);
		setMessage("");
		try {
			const response = await fetch(pathname, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "closed" }),
			});
			if (!response.ok) throw new Error("Couldn’t close the listing. Try again.");
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Couldn’t close the listing. Try again.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="mt-12 border-t border-ink pt-8">
			<p className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-4">Listing controls</p>
			<div className="flex flex-wrap gap-4">
				<button onClick={closeListing} disabled={pending} className="inline-flex items-center justify-center gap-2 border border-ink bg-warm-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:border-redline hover:text-redline disabled:opacity-60">
					{pending ? "Closing…" : "Close listing"}
				</button>
			</div>
			{message && <p role="alert" aria-live="polite" className="mt-3 font-mono text-[10px] uppercase tracking-widest text-redline">{message}</p>}
		</div>
	);
}
