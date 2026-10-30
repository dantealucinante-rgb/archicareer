import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
    AdminAccessError,
    getAdminAnalytics,
    getAdminAuditLogs,
    getAdminContent,
    getAdminJobs,
    getAdminOverview,
    getAdminReports,
    getAdminSystemHealth,
    getAdminUsers,
    requireAdmin,
} from "@/lib/admin";
import AdminActionButton from "./AdminActionButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Administrative Control Center | ArchiCareer",
    robots: { index: false, follow: false },
};

type View = "overview" | "users" | "content" | "jobs" | "reports" | "analytics" | "audit" | "health";

const navigationItems: { value: View; label: string; icon: string }[] = [
    { value: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { value: "users", label: "Users & Roles", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { value: "content", label: "Content Moderation", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { value: "jobs", label: "Job Postings", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { value: "reports", label: "Moderation Queue", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    { value: "analytics", label: "Platform Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { value: "audit", label: "Audit Log", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { value: "health", label: "System Health", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
];

function formatNum(value: number | null | undefined): string {
    if (value === null || value === undefined) return "Unavailable";
    return new Intl.NumberFormat("en-NG").format(value);
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(iso));
}

function Pagination({
    page,
    pages,
    baseQuery,
}: {
    page: number;
    pages: number;
    baseQuery: string;
}) {
    if (pages <= 1) return null;
    return (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs">
            <span className="text-graphite font-mono">
                Page {page} of {pages}
            </span>
            <div className="flex gap-2">
                {page > 1 && (
                    <Link
                        href={`${baseQuery}&page=${page - 1}`}
                        className="rounded-md border border-line bg-paper px-3 py-1.5 font-medium text-graphite hover:text-ink hover:border-ink transition-colors"
                    >
                        Previous
                    </Link>
                )}
                {page < pages && (
                    <Link
                        href={`${baseQuery}&page=${page + 1}`}
                        className="rounded-md border border-line bg-paper px-3 py-1.5 font-medium text-graphite hover:text-ink hover:border-ink transition-colors"
                    >
                        Next
                    </Link>
                )}
            </div>
        </nav>
    );
}

function StatCard({
    label,
    value,
    subtext,
    badge,
}: {
    label: string;
    value: number | string | null;
    subtext?: string;
    badge?: string;
}) {
    return (
        <div className="rounded-xl border border-line bg-paper p-5 transition-shadow hover:shadow-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">{label}</span>
                {badge && (
                    <span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-redline font-semibold">
                        {badge}
                    </span>
                )}
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink">
                {typeof value === "number" ? formatNum(value) : (value ?? "Unavailable")}
            </p>
            {subtext && <p className="mt-1.5 text-xs text-graphite">{subtext}</p>}
        </div>
    );
}

function TrendChart({
    title,
    periodLabel,
    points,
}: {
    title: string;
    periodLabel: string;
    points: { label: string; value: number }[];
}) {
    const maxVal = Math.max(...points.map((p) => p.value), 1);
    return (
        <div className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between">
                <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-graphite">{periodLabel}</span>
            </div>
            <div className="mt-6 flex h-32 items-end gap-1.5 sm:gap-2">
                {points.map((pt, i) => {
                    const heightPercent = Math.max(4, Math.round((pt.value / maxVal) * 100));
                    return (
                        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                            <span className="text-[10px] font-mono tabular-nums text-graphite">
                                {pt.value > 0 ? pt.value : ""}
                            </span>
                            <div
                                className="w-full rounded-t-sm bg-redline/80 transition-all hover:bg-redline"
                                style={{ height: `${heightPercent}%` }}
                                title={`${pt.label}: ${pt.value}`}
                            />
                            <span className="font-mono text-[9px] text-graphite truncate max-w-full">
                                {pt.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{
        view?: string;
        page?: string;
        q?: string;
        role?: string;
        status?: string;
        kind?: string;
        period?: string;
        moderation?: string;
        action?: string;
    }>;
}) {
    const params = await searchParams;
    const currentView = navigationItems.some((n) => n.value === params.view)
        ? (params.view as View)
        : "overview";

    const currentPage = Math.max(1, Number(params.page) || 1);
    const searchQuery = params.q?.trim() ?? "";
    const periodDays = params.period === "30d" ? 30 : 7;

    let access: Awaited<ReturnType<typeof requireAdmin>>;
    try {
        access = await requireAdmin();
    } catch (err) {
        if (err instanceof AdminAccessError && err.message === "Unauthenticated") {
            redirect("/login?next=/admin");
        }
        notFound();
    }

    const overviewData = await getAdminOverview(periodDays);

    const usersData = currentView === "users"
        ? await getAdminUsers({
              search: searchQuery,
              role: params.role,
              status: params.status,
              page: currentPage,
          })
        : null;

    const contentKind = params.kind === "comments" ? "comments" : params.kind === "showcases" ? "showcases" : "posts";
    const contentData = currentView === "content"
        ? await getAdminContent({
              kind: contentKind,
              status: params.status,
              page: currentPage,
          })
        : null;

    const jobsData = currentView === "jobs"
        ? await getAdminJobs({
              search: searchQuery,
              status: params.status,
              moderation: params.moderation,
              page: currentPage,
          })
        : null;

    const reportsData = currentView === "reports"
        ? await getAdminReports({ status: params.status })
        : null;

    const analyticsData = currentView === "analytics"
        ? await getAdminAnalytics(periodDays)
        : null;

    const auditData = currentView === "audit"
        ? await getAdminAuditLogs(currentPage, params.action)
        : null;

    const healthData = currentView === "health"
        ? await getAdminSystemHealth()
        : null;

    return (
        <div className="min-h-screen bg-paper text-ink">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-[var(--page-max)] items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <Link href="/feed" className="font-display font-bold text-ink hover:text-redline transition-colors">
                            ArchiCareer
                        </Link>
                        <span className="text-line">/</span>
                        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
                            Administration
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-line bg-sand/50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink font-semibold">
                            {access.role}
                        </span>
                        <span className="hidden sm:inline font-mono text-xs text-graphite truncate max-w-[12rem]">
                            {access.user.email}
                        </span>
                        <Link
                            href="/feed"
                            className="rounded-lg border border-line px-3 py-1.5 text-xs text-graphite hover:border-ink hover:text-ink transition-colors"
                        >
                            Exit to App &rarr;
                        </Link>
                    </div>
                </div>
            </header>

            {/* Layout Shell */}
            <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
                {/* Navigation Sidebar */}
                <aside className="lg:sticky lg:top-20 lg:h-fit">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-graphite px-3 mb-2">
                        Control Console
                    </p>
                    <nav aria-label="Admin Navigation" className="flex flex-row overflow-x-auto gap-1 border-b border-line pb-3 lg:flex-col lg:border-0 lg:pb-0">
                        {navigationItems.map((item) => {
                            const isActive = currentView === item.value;
                            return (
                                <Link
                                    key={item.value}
                                    href={`/admin?view=${item.value}`}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${
                                        isActive
                                            ? "bg-ink text-paper font-semibold shadow-xs"
                                            : "text-graphite hover:bg-sand/60 hover:text-ink"
                                    }`}
                                >
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                                    </svg>
                                    <span>{item.label}</span>
                                    {item.value === "reports" && overviewData.metrics.pendingReports > 0 && (
                                        <span className="ml-auto rounded-full bg-redline px-1.5 py-0.2 text-[9px] font-bold text-white">
                                            {overviewData.metrics.pendingReports}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* View Content Area */}
                <div className="min-w-0">
                    {/* View Header */}
                    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
                        <div>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                                ArchiCareer Governance
                            </span>
                            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                                {navigationItems.find((n) => n.value === currentView)?.label}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[10px] text-graphite">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live DB Telemetry
                            </span>
                        </div>
                    </div>

                    {/* View Components */}
                    {currentView === "overview" && (
                        <OverviewSection overview={overviewData} periodDays={periodDays} />
                    )}

                    {currentView === "users" && usersData && (
                        <UsersSection
                            users={usersData}
                            search={searchQuery}
                            roleFilter={params.role ?? "all"}
                            statusFilter={params.status ?? "all"}
                            viewerRole={access.role}
                        />
                    )}

                    {currentView === "content" && contentData && (
                        <ContentSection
                            content={contentData}
                            kind={contentKind}
                            statusFilter={params.status ?? "all"}
                        />
                    )}

                    {currentView === "jobs" && jobsData && (
                        <JobsSection
                            jobs={jobsData}
                            search={searchQuery}
                            statusFilter={params.status ?? "all"}
                            moderationFilter={params.moderation ?? "all"}
                        />
                    )}

                    {currentView === "reports" && reportsData && (
                        <ReportsSection
                            reports={reportsData}
                            statusFilter={params.status ?? "all"}
                            currentAdminId={access.user.id}
                        />
                    )}

                    {currentView === "analytics" && analyticsData && (
                        <AnalyticsSection
                            analytics={analyticsData}
                            periodDays={periodDays}
                        />
                    )}

                    {currentView === "audit" && auditData && (
                        <AuditSection
                            audit={auditData}
                            actionFilter={params.action ?? "all"}
                        />
                    )}

                    {currentView === "health" && healthData && (
                        <HealthSection health={healthData} />
                    )}
                </div>
            </main>
        </div>
    );
}

// -------------------------------------------------------------
// OVERVIEW VIEW
// -------------------------------------------------------------
function OverviewSection({
    overview,
    periodDays,
}: {
    overview: Awaited<ReturnType<typeof getAdminOverview>>;
    periodDays: number;
}) {
    const { metrics, charts, audit } = overview;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-graphite">Reporting Horizon</span>
                <div className="flex gap-1 rounded-lg border border-line bg-paper p-1 text-xs">
                    <Link
                        href="/admin?view=overview&period=7d"
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            periodDays === 7 ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        7 Days
                    </Link>
                    <Link
                        href="/admin?view=overview&period=30d"
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            periodDays === 30 ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        30 Days
                    </Link>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Registered Members"
                    value={metrics.users}
                    subtext={`+${formatNum(metrics.users24h)} in 24h · +${formatNum(metrics.users7d)} in 7d`}
                />
                <StatCard
                    label="Published Posts"
                    value={metrics.posts}
                    subtext={`${formatNum(metrics.posts30d)} in the last 30 days`}
                />
                <StatCard
                    label="Community Engagement"
                    value={metrics.engagementTotal}
                    subtext={`${formatNum(metrics.comments)} comments · ${formatNum(metrics.reactions)} reactions`}
                />
                <StatCard
                    label="Job Listings"
                    value={metrics.jobs}
                    subtext={`${formatNum(metrics.jobs30d)} posted in 30 days`}
                />
                <StatCard
                    label="Job Applications"
                    value={metrics.applications}
                    subtext="Submitted across platform listings"
                />
                <StatCard
                    label="Moderation Cases"
                    value={metrics.pendingReports}
                    badge={metrics.pendingReports > 0 ? "Action Needed" : "Clean"}
                    subtext={`${formatNum(metrics.suspended)} suspended · ${formatNum(metrics.banned)} banned`}
                />
            </div>

            {/* Trend Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <TrendChart
                    title="User Registrations"
                    periodLabel={`Last ${periodDays} days`}
                    points={charts.users}
                />
                <TrendChart
                    title="Post Publications"
                    periodLabel={`Last ${periodDays} days`}
                    points={charts.posts}
                />
                <TrendChart
                    title="Engagement (Comments & Activity)"
                    periodLabel={`Last ${periodDays} days`}
                    points={charts.engagement}
                />
                <TrendChart
                    title="Job Listings Created"
                    periodLabel={`Last ${periodDays} days`}
                    points={charts.jobs}
                />
            </div>

            {/* Recent Audit Snip */}
            <div className="rounded-xl border border-line bg-paper p-5">
                <div className="flex items-center justify-between pb-4 border-b border-line">
                    <h2 className="font-display text-sm font-semibold text-ink">
                        Recent Administrative Decisions
                    </h2>
                    <Link
                        href="/admin?view=audit"
                        className="font-mono text-xs text-redline hover:underline"
                    >
                        View Full Audit Trail &rarr;
                    </Link>
                </div>
                {audit.length === 0 ? (
                    <p className="py-6 text-center text-xs text-graphite">
                        No administrative operations recorded yet.
                    </p>
                ) : (
                    <div className="divide-y divide-line">
                        {audit.slice(0, 5).map((log) => (
                            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
                                <div>
                                    <span className="font-mono uppercase font-semibold text-ink">
                                        {log.action}
                                    </span>{" "}
                                    <span className="text-graphite">on {log.target_type}</span>
                                    {log.reason && (
                                        <p className="mt-0.5 text-graphite italic">&ldquo;{log.reason}&rdquo;</p>
                                    )}
                                </div>
                                <span className="font-mono text-[10px] text-graphite">
                                    {formatDate(log.created_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// USERS VIEW
// -------------------------------------------------------------
function UsersSection({
    users,
    search,
    roleFilter,
    statusFilter,
    viewerRole,
}: {
    users: Awaited<ReturnType<typeof getAdminUsers>>;
    search: string;
    roleFilter: string;
    statusFilter: string;
    viewerRole: string;
}) {
    const isSuperadmin = viewerRole === "superadmin";

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <form method="get" className="rounded-xl border border-line bg-paper p-4">
                <input type="hidden" name="view" value="users" />
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[14rem]">
                        <input
                            type="text"
                            name="q"
                            defaultValue={search}
                            placeholder="Search by full name or profile slug..."
                            className="w-full rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink placeholder:text-graphite/60 focus:border-redline focus:outline-none"
                        />
                    </div>
                    <select
                        name="role"
                        defaultValue={roleFilter}
                        className="rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink focus:border-redline focus:outline-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="professional">Professional</option>
                        <option value="firm">Firm</option>
                    </select>
                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink focus:border-redline focus:outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-night transition-colors cursor-pointer"
                    >
                        Apply Filters
                    </button>
                    {(search || roleFilter !== "all" || statusFilter !== "all") && (
                        <Link
                            href="/admin?view=users"
                            className="text-xs text-graphite hover:text-ink transition-colors"
                        >
                            Reset
                        </Link>
                    )}
                </div>
            </form>

            {/* Users Table */}
            <div className="rounded-xl border border-line bg-paper overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[56rem] text-left text-xs">
                        <thead className="border-b border-line bg-sand/30 font-mono text-[10px] uppercase tracking-wider text-graphite">
                            <tr>
                                <th className="px-5 py-3.5">Architect / Firm</th>
                                <th className="px-3 py-3.5">Platform Role</th>
                                <th className="px-3 py-3.5">Joined</th>
                                <th className="px-3 py-3.5">Activity</th>
                                <th className="px-3 py-3.5">Admin Privilege</th>
                                <th className="px-5 py-3.5 text-right">Administrative Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {users.records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-graphite">
                                        No users matched the criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.records.map((u) => (
                                    <tr key={u.id} className="hover:bg-sand/20 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                {u.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={u.avatar_url}
                                                        alt={u.name}
                                                        className="h-8 w-8 rounded-full object-cover border border-line"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-line flex items-center justify-center font-bold text-graphite text-xs">
                                                        {u.name.slice(0, 1)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-ink">{u.name}</span>
                                                        <span
                                                            className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                                                u.account_status === "active"
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : u.account_status === "suspended"
                                                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                    : "bg-redline/10 text-redline border border-redline/30"
                                                            }`}
                                                        >
                                                            {u.account_status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 font-mono text-[11px] text-graphite">
                                                        {u.email ?? "Email masked"} &middot;{" "}
                                                        <Link
                                                            href={`/p/${u.slug}`}
                                                            target="_blank"
                                                            className="text-redline hover:underline"
                                                        >
                                                            /p/{u.slug}
                                                        </Link>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5 capitalize text-graphite">{u.role}</td>
                                        <td className="px-3 py-3.5 font-mono text-graphite">{formatDate(u.created_at)}</td>
                                        <td className="px-3 py-3.5 font-mono tabular-nums text-graphite">
                                            {u.postCount} posts
                                        </td>
                                        <td className="px-3 py-3.5">
                                            {u.adminRole ? (
                                                <span className="rounded bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-paper font-semibold">
                                                    {u.adminRole}
                                                </span>
                                            ) : (
                                                <span className="font-mono text-[10px] text-graphite">Standard</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {u.account_status === "active" ? (
                                                    <>
                                                        <AdminActionButton
                                                            resource="user"
                                                            id={u.user_id}
                                                            action="suspend"
                                                            label="Suspend"
                                                            tone="danger"
                                                            resourceTitle={u.name}
                                                        />
                                                        <AdminActionButton
                                                            resource="user"
                                                            id={u.user_id}
                                                            action="ban"
                                                            label="Ban"
                                                            tone="danger"
                                                            resourceTitle={u.name}
                                                        />
                                                    </>
                                                ) : (
                                                    <AdminActionButton
                                                        resource="user"
                                                        id={u.user_id}
                                                        action="restore"
                                                        label="Restore"
                                                        resourceTitle={u.name}
                                                    />
                                                )}

                                                {/* Superadmin role controls */}
                                                {isSuperadmin && (
                                                    <>
                                                        {!u.adminRole ? (
                                                            <AdminActionButton
                                                                resource="role"
                                                                id={u.user_id}
                                                                action="grant_admin"
                                                                label="+ Admin"
                                                                resourceTitle={u.name}
                                                            />
                                                        ) : (
                                                            u.adminRole === "admin" && (
                                                                <AdminActionButton
                                                                    resource="role"
                                                                    id={u.user_id}
                                                                    action="revoke"
                                                                    label="Revoke"
                                                                    tone="danger"
                                                                    resourceTitle={u.name}
                                                                />
                                                            )
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4">
                    <Pagination
                        page={users.page}
                        pages={users.pages}
                        baseQuery={`/admin?view=users&q=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}`}
                    />
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// CONTENT VIEW
// -------------------------------------------------------------
function ContentSection({
    content,
    kind,
    statusFilter,
}: {
    content: Awaited<ReturnType<typeof getAdminContent>>;
    kind: "posts" | "comments" | "showcases";
    statusFilter: string;
}) {
    const resourceName = kind === "posts" ? "post" : kind === "comments" ? "comment" : "showcase";

    return (
        <div className="space-y-4">
            {/* Kind & Status Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-lg border border-line bg-paper p-1 text-xs">
                    <Link
                        href={`/admin?view=content&kind=posts&status=${statusFilter}`}
                        className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                            kind === "posts" ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        Posts
                    </Link>
                    <Link
                        href={`/admin?view=content&kind=comments&status=${statusFilter}`}
                        className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                            kind === "comments" ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        Comments
                    </Link>
                    <Link
                        href={`/admin?view=content&kind=showcases&status=${statusFilter}`}
                        className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                            kind === "showcases" ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        Showcases (Portfolios)
                    </Link>
                </div>

                <div className="flex gap-1 text-xs">
                    {(["all", "active", "removed"] as const).map((s) => (
                        <Link
                            key={s}
                            href={`/admin?view=content&kind=${kind}&status=${s}`}
                            className={`rounded-md border px-2.5 py-1 capitalize transition-colors ${
                                statusFilter === s
                                    ? "border-ink bg-ink text-paper"
                                    : "border-line text-graphite hover:border-ink hover:text-ink"
                            }`}
                        >
                            {s}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Content Cards */}
            {content.records.length === 0 ? (
                <div className="rounded-xl border border-line bg-paper p-12 text-center text-xs text-graphite">
                    No {kind} found matching the selected filter.
                </div>
            ) : (
                <div className="space-y-3">
                    {content.records.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-xl border p-5 transition-shadow bg-paper ${
                                item.moderation_status === "removed"
                                    ? "border-redline/30 bg-redline/5"
                                    : "border-line"
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1.5 min-w-0 max-w-2xl">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-graphite">
                                            {kind.slice(0, -1)} ID: {item.id.slice(0, 8)}&hellip;
                                        </span>
                                        <span
                                            className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                                item.moderation_status === "active"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-redline text-white"
                                            }`}
                                        >
                                            {item.moderation_status}
                                        </span>
                                        <span className="font-mono text-[10px] text-graphite">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>

                                    {item.title && (
                                        <h3 className="font-display font-semibold text-sm text-ink">
                                            {item.title}
                                        </h3>
                                    )}

                                    <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                                        {item.content || <span className="italic text-graphite">No textual content</span>}
                                    </p>

                                    {item.image_url && (
                                        <div className="mt-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.image_url}
                                                alt="Attached media"
                                                className="max-h-36 rounded-md border border-line object-cover"
                                            />
                                        </div>
                                    )}

                                    <p className="font-mono text-[10px] text-graphite pt-1">
                                        Author User UUID: {item.user_id}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <AdminActionButton
                                        resource={resourceName}
                                        id={item.id}
                                        action={item.moderation_status === "active" ? "remove" : "restore"}
                                        label={item.moderation_status === "active" ? "Remove Content" : "Restore"}
                                        tone={item.moderation_status === "active" ? "danger" : "default"}
                                        resourceTitle={item.title ?? item.content?.slice(0, 30) ?? item.id}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                page={content.page}
                pages={content.pages}
                baseQuery={`/admin?view=content&kind=${kind}&status=${statusFilter}`}
            />
        </div>
    );
}

// -------------------------------------------------------------
// JOBS VIEW
// -------------------------------------------------------------
function JobsSection({
    jobs,
    search,
    statusFilter,
    moderationFilter,
}: {
    jobs: Awaited<ReturnType<typeof getAdminJobs>>;
    search: string;
    statusFilter: string;
    moderationFilter: string;
}) {
    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <form method="get" className="rounded-xl border border-line bg-paper p-4">
                <input type="hidden" name="view" value="jobs" />
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[14rem]">
                        <input
                            type="text"
                            name="q"
                            defaultValue={search}
                            placeholder="Search job title or firm name..."
                            className="w-full rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink placeholder:text-graphite/60 focus:border-redline focus:outline-none"
                        />
                    </div>
                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink focus:border-redline focus:outline-none"
                    >
                        <option value="all">All Posting States</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        name="moderation"
                        defaultValue={moderationFilter}
                        className="rounded-lg border border-line bg-warm-white px-3 py-2 text-xs text-ink focus:border-redline focus:outline-none"
                    >
                        <option value="all">All Moderation</option>
                        <option value="active">Active</option>
                        <option value="removed">Removed</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-night transition-colors cursor-pointer"
                    >
                        Filter
                    </button>
                    {(search || statusFilter !== "all" || moderationFilter !== "all") && (
                        <Link
                            href="/admin?view=jobs"
                            className="text-xs text-graphite hover:text-ink transition-colors"
                        >
                            Reset
                        </Link>
                    )}
                </div>
            </form>

            {/* Jobs List */}
            {jobs.records.length === 0 ? (
                <div className="rounded-xl border border-line bg-paper p-12 text-center text-xs text-graphite">
                    No job postings found matching the criteria.
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.records.map((job) => (
                        <div
                            key={job.id}
                            className={`rounded-xl border p-5 bg-paper flex flex-wrap items-start justify-between gap-4 ${
                                job.moderation_status === "removed"
                                    ? "border-redline/30 bg-redline/5"
                                    : "border-line"
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-display font-semibold text-base text-ink">{job.title}</h3>
                                    <span
                                        className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                            job.status === "open"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-line text-graphite"
                                        }`}
                                    >
                                        {job.status}
                                    </span>
                                    {job.moderation_status === "removed" && (
                                        <span className="rounded bg-redline px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-white font-semibold">
                                            Moderator Removed
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-graphite font-medium">
                                    {job.firm_name} &middot; Posted {formatDate(job.created_at)}
                                </p>
                                <p className="mt-2 font-mono text-xs text-ink font-semibold">
                                    {job.applications} Applications received
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {job.status === "open" && (
                                    <AdminActionButton
                                        resource="job"
                                        id={job.id}
                                        action="close"
                                        label="Close Listing"
                                        resourceTitle={job.title}
                                    />
                                )}
                                <AdminActionButton
                                    resource="job"
                                    id={job.id}
                                    action={job.moderation_status === "active" ? "remove" : "restore"}
                                    label={job.moderation_status === "active" ? "Remove Listing" : "Restore Listing"}
                                    tone={job.moderation_status === "active" ? "danger" : "default"}
                                    resourceTitle={job.title}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                page={jobs.page}
                pages={jobs.pages}
                baseQuery={`/admin?view=jobs&q=${encodeURIComponent(search)}&status=${statusFilter}&moderation=${moderationFilter}`}
            />
        </div>
    );
}

// -------------------------------------------------------------
// REPORTS QUEUE VIEW
// -------------------------------------------------------------
function ReportsSection({
    reports,
    statusFilter,
    currentAdminId,
}: {
    reports: Awaited<ReturnType<typeof getAdminReports>>;
    statusFilter: string;
    currentAdminId: string;
}) {
    return (
        <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-graphite">Filter by Resolution State:</span>
                <div className="flex flex-wrap gap-1 text-xs">
                    {(["all", "open", "in_review", "resolved", "dismissed", "escalated"] as const).map((s) => (
                        <Link
                            key={s}
                            href={`/admin?view=reports&status=${s}`}
                            className={`rounded-md border px-2.5 py-1 capitalize transition-colors ${
                                statusFilter === s
                                    ? "border-ink bg-ink text-paper font-semibold"
                                    : "border-line text-graphite hover:border-ink hover:text-ink"
                            }`}
                        >
                            {s.replace("_", " ")}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            {reports.length === 0 ? (
                <div className="rounded-xl border border-line bg-paper p-12 text-center text-xs text-graphite">
                    No moderation reports found in this queue.
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => {
                        const isAssignedToMe = report.assigned_admin_id === currentAdminId;
                        return (
                            <div
                                key={report.id}
                                className={`rounded-xl border p-5 bg-paper transition-shadow ${
                                    report.status === "open"
                                        ? "border-amber-300 bg-amber-50/20"
                                        : "border-line"
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-1.5 min-w-0 max-w-2xl">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] uppercase tracking-wider text-graphite">
                                                Target: {report.target_type}
                                            </span>
                                            <span
                                                className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                                    report.status === "open"
                                                        ? "bg-amber-100 text-amber-800"
                                                        : report.status === "in_review"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : report.status === "resolved"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-line text-graphite"
                                                }`}
                                            >
                                                {report.status.replace("_", " ")}
                                            </span>
                                            <span className="font-mono text-[10px] text-graphite">
                                                Reported {formatDate(report.created_at)}
                                            </span>
                                            {report.assigned_admin_id && (
                                                <span className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                                    isAssignedToMe ? "bg-redline/10 text-redline border border-redline/20" : "bg-line text-graphite"
                                                }`}>
                                                    {isAssignedToMe ? "Assigned to You" : "Claimed by Admin"}
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-semibold text-sm text-ink">
                                            Category: {report.category}
                                        </p>

                                        {report.details && (
                                            <p className="text-xs text-graphite bg-warm-white p-2.5 rounded-lg border border-line">
                                                &ldquo;{report.details}&rdquo;
                                            </p>
                                        )}

                                        <div className="pt-1 font-mono text-[10px] text-graphite space-y-0.5">
                                            <p>Target Record ID: {report.target_id}</p>
                                            <p>Reporter UUID: {report.reporter_id}</p>
                                            {report.decision_reason && (
                                                <p className="text-ink font-medium">
                                                    Resolution Note: &ldquo;{report.decision_reason}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {report.status === "open" && (
                                            <AdminActionButton
                                                resource="report"
                                                id={report.id}
                                                action="in_review"
                                                label="Claim & Review"
                                                resourceTitle={report.category}
                                            />
                                        )}

                                        {["open", "in_review"].includes(report.status) && (
                                            <>
                                                <AdminActionButton
                                                    resource="report"
                                                    id={report.id}
                                                    action="resolved"
                                                    label="Resolve"
                                                    tone="primary"
                                                    resourceTitle={report.category}
                                                />
                                                <AdminActionButton
                                                    resource="report"
                                                    id={report.id}
                                                    action="dismissed"
                                                    label="Dismiss"
                                                    resourceTitle={report.category}
                                                />
                                                <AdminActionButton
                                                    resource="report"
                                                    id={report.id}
                                                    action="escalated"
                                                    label="Escalate"
                                                    tone="danger"
                                                    resourceTitle={report.category}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// -------------------------------------------------------------
// ANALYTICS VIEW
// -------------------------------------------------------------
function AnalyticsSection({
    analytics,
    periodDays,
}: {
    analytics: Awaited<ReturnType<typeof getAdminAnalytics>>;
    periodDays: number;
}) {
    const { totals, recentActivity, topAuthors, recentSamplePosts } = analytics;

    return (
        <div className="space-y-6">
            {/* Horizon Filter */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-graphite">Time Window</span>
                <div className="flex gap-1 rounded-lg border border-line bg-paper p-1 text-xs">
                    <Link
                        href="/admin?view=analytics&period=7d"
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            periodDays === 7 ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        7 Days
                    </Link>
                    <Link
                        href="/admin?view=analytics&period=30d"
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            periodDays === 30 ? "bg-ink text-paper" : "text-graphite hover:text-ink"
                        }`}
                    >
                        30 Days
                    </Link>
                </div>
            </div>

            {/* Platform Totals */}
            <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-3">
                    Verified Database Totals (Cumulative)
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Registered Architects" value={totals.users} />
                    <StatCard label="Total Discussions & Posts" value={totals.posts} />
                    <StatCard label="Comments Shared" value={totals.comments} />
                    <StatCard label="Reactions & Appreciations" value={totals.reactions} />
                    <StatCard label="Professional Follows" value={totals.follows} />
                    <StatCard label="Job Listings Posted" value={totals.jobs} />
                    <StatCard label="Candidate Applications" value={totals.applications} />
                </div>
            </div>

            {/* Period Volume */}
            <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-graphite mb-3">
                    New Additions in Last {periodDays} Days
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="New Member Signups" value={recentActivity.newUsers} />
                    <StatCard label="New Publications" value={recentActivity.newPosts} />
                    <StatCard label="New Open Listings" value={recentActivity.newJobs} />
                    <StatCard label="New Applications" value={recentActivity.newApplications} />
                </div>
            </div>

            {/* Active Contributors */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper p-5">
                    <h3 className="font-display text-sm font-semibold text-ink mb-4">
                        Most Active Contributors (Recent Sample)
                    </h3>
                    {topAuthors.length === 0 ? (
                        <p className="text-xs text-graphite">No active contributors found.</p>
                    ) : (
                        <div className="divide-y divide-line">
                            {topAuthors.map((author) => (
                                <div key={author.userId} className="flex items-center justify-between py-2.5 text-xs">
                                    <div>
                                        <Link
                                            href={`/p/${author.slug}`}
                                            target="_blank"
                                            className="font-medium text-ink hover:text-redline transition-colors"
                                        >
                                            {author.name}
                                        </Link>
                                        <p className="text-[10px] font-mono text-graphite capitalize">
                                            {author.role} &middot; /p/{author.slug}
                                        </p>
                                    </div>
                                    <span className="font-mono font-semibold text-ink">
                                        {author.postCount} posts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Content Sampling */}
                <div className="rounded-xl border border-line bg-paper p-5">
                    <h3 className="font-display text-sm font-semibold text-ink mb-4">
                        Recently Published Content Samples
                    </h3>
                    {recentSamplePosts.length === 0 ? (
                        <p className="text-xs text-graphite">No posts available.</p>
                    ) : (
                        <div className="divide-y divide-line">
                            {recentSamplePosts.map((post) => (
                                <div key={post.id} className="py-2.5 text-xs">
                                    <p className="line-clamp-2 text-ink">
                                        {post.content || <span className="italic text-graphite">Media post</span>}
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] text-graphite">
                                        {formatDate(post.created_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Honest Telemetry Notice */}
            <div className="rounded-xl border border-line bg-sand/30 p-5">
                <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-redline shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs space-y-1">
                        <p className="font-semibold text-ink">Data Transparency & Instrumentation Boundary</p>
                        <p className="text-graphite leading-relaxed">
                            Every statistic above reflects verified records stored in your Supabase database. ArchiCareer currently does not run client-side event trackers, session screen recorders, or telemetry beacons. Cohort retention percentages and bounce rates are purposefully omitted rather than synthesized.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// AUDIT LOG VIEW
// -------------------------------------------------------------
function AuditSection({
    audit,
    actionFilter,
}: {
    audit: Awaited<ReturnType<typeof getAdminAuditLogs>>;
    actionFilter: string;
}) {
    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-graphite">Filter by Admin Action:</span>
                <div className="flex flex-wrap gap-1 text-xs">
                    {(["all", "suspend", "ban", "restore", "remove", "close", "in_review", "resolved", "dismissed", "grant_admin", "revoke"] as const).map((a) => (
                        <Link
                            key={a}
                            href={`/admin?view=audit&action=${a}`}
                            className={`rounded-md border px-2.5 py-1 uppercase font-mono text-[10px] tracking-wider transition-colors ${
                                actionFilter === a
                                    ? "border-ink bg-ink text-paper font-semibold"
                                    : "border-line text-graphite hover:border-ink hover:text-ink"
                            }`}
                        >
                            {a.replace("_", " ")}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="rounded-xl border border-line bg-paper overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[54rem] text-left text-xs">
                        <thead className="border-b border-line bg-sand/30 font-mono text-[10px] uppercase tracking-wider text-graphite">
                            <tr>
                                <th className="px-5 py-3.5">Timestamp</th>
                                <th className="px-3 py-3.5">Admin User</th>
                                <th className="px-3 py-3.5">Action</th>
                                <th className="px-3 py-3.5">Target</th>
                                <th className="px-5 py-3.5">Recorded Reason</th>
                                <th className="px-3 py-3.5">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {audit.records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-graphite">
                                        No audit records found matching this filter.
                                    </td>
                                </tr>
                            ) : (
                                audit.records.map((item) => (
                                    <tr key={item.id} className="hover:bg-sand/20 transition-colors">
                                        <td className="px-5 py-3 font-mono text-graphite whitespace-nowrap">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-3 py-3 font-mono text-graphite">
                                            {item.admin_user_id.slice(0, 8)}&hellip;
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="font-mono text-[10px] uppercase font-semibold text-ink">
                                                {item.action}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-mono text-graphite">
                                            {item.target_type} ({item.target_id ? item.target_id.slice(0, 8) : "N/A"})
                                        </td>
                                        <td className="px-5 py-3 text-ink max-w-xs truncate" title={item.reason ?? ""}>
                                            {item.reason ?? <span className="italic text-graphite">No note provided</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                                    item.outcome === "success"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-redline text-white"
                                                }`}
                                            >
                                                {item.outcome}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4">
                    <Pagination
                        page={audit.page}
                        pages={audit.pages}
                        baseQuery={`/admin?view=audit&action=${actionFilter}`}
                    />
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// SYSTEM HEALTH VIEW
// -------------------------------------------------------------
function HealthSection({
    health,
}: {
    health: Awaited<ReturnType<typeof getAdminSystemHealth>>;
}) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Database Connectivity */}
                <div className="rounded-xl border border-line bg-paper p-5">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                            PostgreSQL Database
                        </span>
                        <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                health.database.status === "connected"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-redline text-white"
                            }`}
                        >
                            {health.database.status}
                        </span>
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink">
                        {health.database.latencyMs} ms
                    </p>
                    <p className="mt-1 text-xs text-graphite">
                        Round-trip query ping time to Supabase ({health.database.recordsSampled} profile rows counted)
                    </p>
                </div>

                {/* Auth Service */}
                <div className="rounded-xl border border-line bg-paper p-5">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                            Auth Service
                        </span>
                        <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                                health.authService.status === "connected"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-redline text-white"
                            }`}
                        >
                            {health.authService.status}
                        </span>
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink">
                        {health.authService.latencyMs} ms
                    </p>
                    <p className="mt-1 text-xs text-graphite">
                        Supabase GoTrue admin client verification response latency
                    </p>
                </div>
            </div>

            {/* Runtime Details */}
            <div className="rounded-xl border border-line bg-paper p-5">
                <h3 className="font-display text-sm font-semibold text-ink mb-4">
                    Server Runtime Environment
                </h3>
                <dl className="grid gap-4 sm:grid-cols-3 text-xs">
                    <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-graphite">Node Environment</dt>
                        <dd className="mt-1 font-mono font-semibold text-ink">{health.environment.nodeEnv}</dd>
                    </div>
                    <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-graphite">Runtime Engine</dt>
                        <dd className="mt-1 text-ink">{health.environment.runtime}</dd>
                    </div>
                    <div>
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-graphite">Supabase URL Configured</dt>
                        <dd className="mt-1 font-mono font-semibold text-ink">
                            {health.environment.supabaseConfigured ? "Yes (Configured)" : "Missing"}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* Error Telemetry Guidance */}
            <div className="rounded-xl border border-line bg-sand/30 p-5 space-y-3">
                <h3 className="font-display text-sm font-semibold text-ink">
                    Technical Monitoring & Error Infrastructure
                </h3>
                <p className="text-xs text-graphite leading-relaxed">
                    ArchiCareer currently relies on Next.js server-side error boundaries and Supabase server logs. External exception tracking (e.g. Sentry) or background worker telemetry (e.g. Inngest / BullMQ) have not been plugged into this environment yet.
                </p>
                <div className="rounded-lg border border-line bg-paper p-4 text-xs text-graphite space-y-2">
                    <p className="font-medium text-ink">Security Rule for Logging:</p>
                    <p>
                        Never expose user passwords, authorization bearer tokens, session cookies, CV download URLs, or full request bodies in application diagnostics or admin logs.
                    </p>
                </div>
            </div>
        </div>
    );
}
