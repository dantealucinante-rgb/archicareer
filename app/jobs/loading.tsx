export default function JobsLoading() {
    return <main className="mx-auto max-w-6xl space-y-5 px-5 py-8" aria-label="Loading opportunities">
        <div className="h-8 w-52 animate-pulse rounded bg-sand" />
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <article key={item} className="surface space-y-4 p-5" aria-hidden="true"><div className="h-3 w-28 animate-pulse rounded bg-sand" /><div className="h-6 w-3/4 animate-pulse rounded bg-sand" /><div className="space-y-2"><div className="h-3 w-full animate-pulse rounded bg-sand" /><div className="h-3 w-4/5 animate-pulse rounded bg-sand" /></div></article>)}</div>
    </main>;
}
