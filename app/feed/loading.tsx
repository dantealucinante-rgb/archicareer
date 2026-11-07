export default function FeedLoading() {
    return <main className="mx-auto w-full max-w-[var(--content-max)] space-y-4 px-5 py-6" aria-label="Loading feed">
        <div className="h-7 w-40 animate-pulse rounded bg-sand" />
        {[0, 1, 2].map((item) => <article key={item} className="feed-post space-y-5 bg-warm-white p-5 sm:p-6" aria-hidden="true">
            <div className="flex items-center gap-3"><div className="h-12 w-12 animate-pulse rounded-xl bg-sand" /><div className="flex-1 space-y-2"><div className="h-4 w-40 animate-pulse rounded bg-sand" /><div className="h-3 w-56 max-w-full animate-pulse rounded bg-sand" /></div></div>
            <div className="space-y-2"><div className="h-3 w-full animate-pulse rounded bg-sand" /><div className="h-3 w-4/5 animate-pulse rounded bg-sand" /></div>
            {item === 0 && <div className="aspect-[4/3] animate-pulse rounded-xl bg-sand" />}
        </article>)}
    </main>;
}
