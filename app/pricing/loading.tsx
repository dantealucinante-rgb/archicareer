export default function PricingLoading() {
    return (
        <main aria-label="Loading membership pricing" className="mx-auto min-h-screen w-full max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:px-12">
            <div className="h-3 w-48 animate-pulse bg-sand" />
            <div className="mt-8 h-24 max-w-4xl animate-pulse bg-sand sm:h-32" />
            <div className="mt-5 h-12 max-w-2xl animate-pulse bg-sand/70" />
            <div className="mt-16 grid gap-4 md:grid-cols-3">
                {["free", "pro", "pro-plus"].map((plan) => <div key={plan} className="h-[30rem] animate-pulse border border-line bg-white" />)}
            </div>
        </main>
    );
}
