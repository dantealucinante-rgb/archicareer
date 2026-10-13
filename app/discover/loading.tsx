export default function DiscoverLoading() {
    return <div className="min-h-screen bg-paper px-5 py-10 sm:px-8 sm:py-16"><main className="mx-auto max-w-7xl"><div className="h-16 max-w-xl animate-pulse rounded bg-line/50" /><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-60 animate-pulse rounded-2xl border border-line bg-warm-white" />)}</div></main></div>;
}
