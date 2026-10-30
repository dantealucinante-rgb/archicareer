"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application route failed to render", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center bg-paper px-5 py-16 text-ink sm:px-8">
      <section className="mx-auto w-full max-w-xl border-l-2 border-redline pl-6 sm:pl-8" aria-labelledby="route-error-title">
        <p className="text-sm font-medium text-redline">Something went wrong</p>
        <h1 id="route-error-title" className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          We couldn’t load this page.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-graphite">
          Try loading it again, or return to a familiar part of ArchiCareer.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button type="button" onClick={unstable_retry} className="interactive rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-redline">
            Try again
          </button>
          <Link href="/feed" className="inline-flex items-center px-1 text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:text-redline">
            Go to the feed
          </Link>
        </div>
      </section>
    </main>
  );
}
