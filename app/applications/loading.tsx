export default function ApplicationsLoading() {
    return <main className="mx-auto max-w-5xl space-y-4 px-5 py-8" aria-label="Loading applications">
        <div className="h-8 w-56 animate-pulse rounded bg-sand" />
        {[0, 1, 2].map((item) => <article key={item} className="surface space-y-4 p-5" aria-hidden="true"><div className="h-3 w-24 animate-pulse rounded bg-sand" /><div className="h-7 w-2/3 animate-pulse rounded bg-sand" /><div className="h-4 w-1/2 animate-pulse rounded bg-sand" /></article>)}
    </main>;
}
