export default function DashboardLoading() {
    return <main className="mx-auto max-w-6xl space-y-6 px-5 py-8" aria-label="Loading your workspace">
        <div className="h-8 w-56 animate-pulse rounded bg-sand" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]"><section className="surface space-y-5 p-5 sm:p-7" aria-hidden="true"><div className="h-5 w-40 animate-pulse rounded bg-sand" /><div className="h-12 w-full animate-pulse rounded-xl bg-sand" /><div className="h-28 w-full animate-pulse rounded-xl bg-sand" /></section><aside className="surface min-h-48 animate-pulse p-5" aria-hidden="true" /></div>
    </main>;
}
