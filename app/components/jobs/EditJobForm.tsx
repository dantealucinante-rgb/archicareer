"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JobListing, JobPayType, JobType } from "@/types";

const TYPES: { value: JobType; label: string }[] = [
	{ value: "internship", label: "Internship" },
	{ value: "job", label: "Job" },
	{ value: "competition", label: "Competition" },
];

const PAY_TYPES: { value: JobPayType; label: string }[] = [
	{ value: "paid", label: "Paid" },
	{ value: "unpaid", label: "Unpaid" },
	{ value: "not_disclosed", label: "Pay not disclosed" },
];

interface EditJobFormProps {
	job: JobListing;
	onSaved: () => void;
}

export default function EditJobForm({ job, onSaved }: EditJobFormProps) {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		title: job.title,
		firm_name: job.firm_name,
		description: job.description,
		location: job.location,
		type: job.type,
		pay_type: job.pay_type,
		apply_link_or_email: job.apply_link_or_email ?? "",
		status: job.status,
	});

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setPending(true);
		setMessage("");
		setError("");
		try {
			const response = await fetch(`/api/jobs/${job.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: form.title.trim(),
					firm_name: form.firm_name.trim(),
					description: form.description.trim(),
					location: form.location.trim() || "Nigeria",
					type: form.type,
					pay_type: form.pay_type,
					apply_link_or_email: form.apply_link_or_email.trim() || null,
					status: form.status,
				}),
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error ?? "Unable to save changes");
			setMessage("Listing updated.");
			onSaved();
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to save changes");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="max-w-2xl">
			<Link href={`/jobs/${job.id}`} className="mb-4 inline-block font-mono text-[10px] uppercase tracking-widest text-graphite hover:text-ink">
				← Back to listing
			</Link>
			<p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-coral">Edit listing</p>
			<h1 className="mb-8 font-display text-3xl font-semibold leading-[1.04] tracking-[-0.04em]">Edit “{job.title}”</h1>
			<form onSubmit={submit} className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Job title</label>
						<input
							name="title"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
							required
						/>
					</div>
					<div>
						<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Firm name</label>
						<input
							name="firm_name"
							value={form.firm_name}
							onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
							className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
							required
						/>
					</div>
				</div>
				<div>
					<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Description</label>
					<textarea
						name="description"
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						rows={6}
						className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
						required
					/>
				</div>
				<div className="grid gap-4 sm:grid-cols-3">
					<div>
						<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Location</label>
						<input
							name="location"
							value={form.location}
							onChange={(e) => setForm({ ...form, location: e.target.value })}
							className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
						/>
					</div>
					<div>
						<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Category</label>
						<select
							name="type"
							value={form.type}
							onChange={(e) => setForm({ ...form, type: e.target.value as JobType })}
							className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
						>
							{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>
					<div>
						<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Pay</label>
						<select
							name="pay_type"
							value={form.pay_type}
							onChange={(e) => setForm({ ...form, pay_type: e.target.value as JobPayType })}
							className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
						>
							{PAY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>
				</div>
				<div>
					<label className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-1.5 block">Apply link or email</label>
					<input
						name="apply_link_or_email"
						value={form.apply_link_or_email}
						onChange={(e) => setForm({ ...form, apply_link_or_email: e.target.value })}
						placeholder="https://firm.example/careers or jobs@firm.example.ng"
						className="w-full border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
					/>
				</div>
				<div className="flex items-center gap-3">
					<label className="font-mono text-[10px] uppercase tracking-widest text-graphite flex-1">Status</label>
					<select
						name="status"
						value={form.status}
						onChange={(e) => setForm({ ...form, status: e.target.value as "open" | "closed" })}
						className="border border-ink rounded-none bg-warm-white text-ink font-sans text-sm px-3 py-2 focus:border-redline focus:outline-none shadow-[4px_4px_0_var(--ink)]"
					>
						<option value="open">Open</option>
						<option value="closed">Closed</option>
					</select>
				</div>
				<div className="flex gap-3">
					<button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper transition-colors hover:border-redline hover:bg-redline disabled:opacity-60 shadow-[4px_4px_0_var(--ink)] hover:shadow-[2px_2px_0_var(--ink)] active:shadow-none active:translate-[4px_4px] hover:translate-[2px_2px]">
						{pending ? "Saving…" : "Save changes"}
					</button>
					<button type="button" onClick={() => router.refresh()} className="inline-flex items-center justify-center rounded-full border border-ink bg-warm-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:border-redline hover:text-redline shadow-[4px_4px_0_var(--ink)] hover:shadow-[2px_2px_0_var(--ink)] active:shadow-none active:translate-[4px_4px] hover:translate-[2px_2px]">
						Cancel
					</button>
				</div>
			</form>
			{error && <p role="alert" aria-live="polite" className="mt-4 font-mono text-[10px] uppercase tracking-widest text-coral">{error}</p>}
			{message && <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-sage">{message}</p>}
		</div>
	);
}
