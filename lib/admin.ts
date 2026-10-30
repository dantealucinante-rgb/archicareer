import { createAdminClient, createClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "superadmin";
export type AccountStatus = "active" | "suspended" | "banned";
export type ModerationStatus = "active" | "removed";

export class AdminAccessError extends Error {
    constructor(message = "Administrator access is required") {
        super(message);
        this.name = "AdminAccessError";
    }
}

export async function requireAdmin() {
    const session = await createClient();
    const { data: { user }, error } = await session.auth.getUser();
    if (error || !user) throw new AdminAccessError("Unauthenticated");

    const admin = createAdminClient();
    const { data: roleRecord, error: roleError } = await admin
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (roleError || !roleRecord || (roleRecord.role !== "admin" && roleRecord.role !== "superadmin")) {
        throw new AdminAccessError();
    }

    return { user, role: roleRecord.role as AdminRole, admin };
}

export async function isAccountActive(userId: string): Promise<boolean> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("profiles")
        .select("account_status")
        .eq("user_id", userId)
        .maybeSingle();
    return !error && data?.account_status === "active";
}

export async function writeAdminAudit(input: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    reason?: string | null;
    outcome?: "success" | "failed";
    metadata?: Record<string, unknown>;
}): Promise<string> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("admin_audit_logs")
        .insert({
            admin_user_id: input.adminUserId,
            action: input.action,
            target_type: input.targetType,
            target_id: input.targetId ?? null,
            reason: input.reason?.trim() || null,
            outcome: input.outcome ?? "success",
            metadata: input.metadata ?? {},
        })
        .select("id")
        .single();

    if (error) throw new Error("Unable to record the administrative action");
    return data.id as string;
}

async function countTable(admin: ReturnType<typeof createAdminClient>, table: string, since?: string) {
    let query = admin.from(table).select("id", { count: "exact", head: true });
    if (since) query = query.gte("created_at", since);
    const { count: value, error } = await query;
    return error ? null : value ?? 0;
}

function isoDaysAgo(days: number) {
    return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function getAdminOverview(periodDays: number = 7) {
    const { admin } = await requireAdmin();
    const now = new Date();
    const safeDays = periodDays === 30 ? 30 : 7;
    const oneDay = isoDaysAgo(1);
    const sevenDays = isoDaysAgo(7);
    const thirtyDays = isoDaysAgo(30);
    const sixtyDays = isoDaysAgo(60);
    const periodStart = isoDaysAgo(safeDays);

    const [
        users, users24h, users7d, users30d, usersPrevious30d,
        posts, posts30d,
        comments, reactions, follows,
        jobs, jobs30d, applications,
        reports, suspended, banned,
        recentAudit,
        userPeriodRows, postPeriodRows, jobPeriodRows, commentPeriodRows
    ] = await Promise.all([
        countTable(admin, "profiles"),
        countTable(admin, "profiles", oneDay),
        countTable(admin, "profiles", sevenDays),
        countTable(admin, "profiles", thirtyDays),
        countTable(admin, "profiles", sixtyDays),
        countTable(admin, "posts"),
        countTable(admin, "posts", thirtyDays),
        countTable(admin, "comments"),
        countTable(admin, "reactions"),
        countTable(admin, "follows"),
        countTable(admin, "job_listings"),
        countTable(admin, "job_listings", thirtyDays),
        countTable(admin, "applications"),
        admin.from("moderation_reports").select("id", { count: "exact", head: true }).in("status", ["open", "in_review", "escalated"]),
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "banned"),
        admin.from("admin_audit_logs").select("id, action, target_type, target_id, reason, outcome, created_at, admin_user_id").order("created_at", { ascending: false }).limit(8),
        admin.from("profiles").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("posts").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("job_listings").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("comments").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
    ]);

    const bucketCount = safeDays === 30 ? 10 : 7;
    const bucketInterval = safeDays === 30 ? 3 : 1;

    const buildBuckets = (rows: { created_at: string }[] | null) => {
        return Array.from({ length: bucketCount }, (_, index) => {
            const endOffsetDays = (bucketCount - 1 - index) * bucketInterval;
            const startOffsetDays = endOffsetDays + bucketInterval;
            const end = new Date(now.getTime() - endOffsetDays * 86_400_000);
            const start = new Date(now.getTime() - startOffsetDays * 86_400_000);
            const count = (rows ?? []).filter((r) => {
                const date = new Date(r.created_at);
                return date >= start && date < end;
            }).length;

            const label = safeDays === 30
                ? `${end.getMonth() + 1}/${end.getDate()}`
                : new Intl.DateTimeFormat("en-NG", { weekday: "short" }).format(end);

            return { label, value: count };
        });
    };

    return {
        periodDays: safeDays,
        metrics: {
            users,
            users24h,
            users7d,
            users30d,
            usersPrevious30d: usersPrevious30d === null || users30d === null ? null : Math.max(0, usersPrevious30d - users30d),
            posts,
            posts30d,
            comments,
            reactions,
            follows,
            engagementTotal: (comments ?? 0) + (reactions ?? 0) + (follows ?? 0),
            jobs,
            jobs30d,
            applications,
            pendingReports: reports.count ?? 0,
            suspended: suspended.count ?? 0,
            banned: banned.count ?? 0,
        },
        charts: {
            users: buildBuckets(userPeriodRows.data),
            posts: buildBuckets(postPeriodRows.data),
            engagement: buildBuckets(commentPeriodRows.data),
            jobs: buildBuckets(jobPeriodRows.data),
        },
        audit: recentAudit.data ?? [],
    };
}

export type AdminUserRecord = {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    role: string;
    avatar_url: string | null;
    location: string | null;
    school_or_firm: string | null;
    account_status: AccountStatus;
    created_at: string;
    email: string | null;
    postCount: number;
    adminRole: AdminRole | null;
};

export async function getAdminUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    page: number;
}) {
    const { admin } = await requireAdmin();
    const limit = 15;
    const offset = Math.max(0, params.page - 1) * limit;

    let query = admin
        .from("profiles")
        .select("id, user_id, name, slug, role, avatar_url, location, school_or_firm, account_status, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

    if (params.search && params.search.trim()) {
        const clean = params.search.replace(/[%_,()]/g, "").trim();
        query = query.or(`name.ilike.%${clean}%,slug.ilike.%${clean}%`);
    }

    if (params.role && ["student", "professional", "firm"].includes(params.role)) {
        query = query.eq("role", params.role);
    }

    if (params.status && ["active", "suspended", "banned"].includes(params.status)) {
        query = query.eq("account_status", params.status);
    }

    const { data, error, count: total } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error("Unable to load users");

    const records: AdminUserRecord[] = await Promise.all((data ?? []).map(async (profile) => {
        const [authRes, postCountRes, adminRoleRes] = await Promise.all([
            admin.auth.admin.getUserById(profile.user_id),
            admin.from("posts").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
            admin.from("admin_roles").select("role").eq("user_id", profile.user_id).maybeSingle(),
        ]);

        return {
            ...profile,
            account_status: (profile.account_status as AccountStatus) || "active",
            email: authRes.data?.user?.email ?? null,
            postCount: postCountRes.count ?? 0,
            adminRole: (adminRoleRes.data?.role as AdminRole) ?? null,
        };
    }));

    return {
        records,
        total: total ?? 0,
        page: params.page,
        pages: Math.max(1, Math.ceil((total ?? 0) / limit)),
    };
}

export type AdminContentRecord = {
    id: string;
    user_id: string;
    content: string | null;
    title?: string | null;
    image_url?: string | null;
    post_id?: string | null;
    portfolio_item_id?: string | null;
    moderation_status: ModerationStatus;
    created_at: string;
    authorName?: string;
    authorSlug?: string;
};

export async function getAdminContent(params: {
    kind: "posts" | "comments" | "showcases";
    status?: string;
    page: number;
}) {
    const { admin } = await requireAdmin();
    const limit = 15;
    const offset = (params.page - 1) * limit;
    let records: AdminContentRecord[] = [];
    let totalCount = 0;

    if (params.kind === "posts") {
        let q = admin
            .from("posts")
            .select("id, user_id, content, image_url, moderation_status, created_at", { count: "exact" })
            .order("created_at", { ascending: false });
        if (params.status && ["active", "removed"].includes(params.status)) {
            q = q.eq("moderation_status", params.status);
        }
        const { data, error, count } = await q.range(offset, offset + limit - 1);
        if (error) throw new Error("Unable to load posts");
        totalCount = count ?? 0;
        records = (data ?? []).map((p) => ({
            id: p.id,
            user_id: p.user_id,
            content: p.content,
            image_url: p.image_url,
            moderation_status: p.moderation_status as ModerationStatus,
            created_at: p.created_at,
        }));
    } else if (params.kind === "comments") {
        let q = admin
            .from("comments")
            .select("id, user_id, content, post_id, portfolio_item_id, moderation_status, created_at", { count: "exact" })
            .order("created_at", { ascending: false });
        if (params.status && ["active", "removed"].includes(params.status)) {
            q = q.eq("moderation_status", params.status);
        }
        const { data, error, count } = await q.range(offset, offset + limit - 1);
        if (error) throw new Error("Unable to load comments");
        totalCount = count ?? 0;
        records = (data ?? []).map((c) => ({
            id: c.id,
            user_id: c.user_id,
            content: c.content,
            post_id: c.post_id,
            portfolio_item_id: c.portfolio_item_id,
            moderation_status: c.moderation_status as ModerationStatus,
            created_at: c.created_at,
        }));
    } else {
        let q = admin
            .from("portfolio_items")
            .select("id, profile_id, title, description, image_url, moderation_status, created_at", { count: "exact" })
            .order("created_at", { ascending: false });
        if (params.status && ["active", "removed"].includes(params.status)) {
            q = q.eq("moderation_status", params.status);
        }
        const { data, error, count } = await q.range(offset, offset + limit - 1);
        if (error) throw new Error("Unable to load showcases");
        totalCount = count ?? 0;
        records = (data ?? []).map((s) => ({
            id: s.id,
            user_id: s.profile_id,
            title: s.title,
            content: s.description,
            image_url: s.image_url,
            moderation_status: s.moderation_status as ModerationStatus,
            created_at: s.created_at,
        }));
    }

    return {
        records,
        total: totalCount,
        page: params.page,
        pages: Math.max(1, Math.ceil(totalCount / limit)),
    };
}

export type AdminJobRecord = {
    id: string;
    user_id: string;
    firm_name: string;
    title: string;
    status: string;
    moderation_status: ModerationStatus;
    created_at: string;
    applications: number;
};

export async function getAdminJobs(params: {
    status?: string;
    moderation?: string;
    search?: string;
    page: number;
}) {
    const { admin } = await requireAdmin();
    const limit = 15;
    const offset = (params.page - 1) * limit;

    let query = admin
        .from("job_listings")
        .select("id, user_id, firm_name, title, status, moderation_status, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

    if (params.status && ["open", "closed"].includes(params.status)) {
        query = query.eq("status", params.status);
    }
    if (params.moderation && ["active", "removed"].includes(params.moderation)) {
        query = query.eq("moderation_status", params.moderation);
    }
    if (params.search && params.search.trim()) {
        const clean = params.search.replace(/[%_,()]/g, "").trim();
        query = query.or(`title.ilike.%${clean}%,firm_name.ilike.%${clean}%`);
    }

    const { data, error, count: total } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error("Unable to load jobs");

    const records: AdminJobRecord[] = await Promise.all((data ?? []).map(async (job) => {
        const { count: applications } = await admin
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("job_listing_id", job.id);
        return {
            ...job,
            moderation_status: job.moderation_status as ModerationStatus,
            applications: applications ?? 0,
        };
    }));

    return {
        records,
        total: total ?? 0,
        page: params.page,
        pages: Math.max(1, Math.ceil((total ?? 0) / limit)),
    };
}

export type AdminReportRecord = {
    id: string;
    reporter_id: string;
    target_type: "profile" | "post" | "comment" | "portfolio_item" | "job_listing";
    target_id: string;
    category: string;
    details: string | null;
    status: "open" | "in_review" | "resolved" | "dismissed" | "escalated";
    assigned_admin_id: string | null;
    decision_reason: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
};

export async function getAdminReports(params?: { status?: string }) {
    const { admin } = await requireAdmin();
    let query = admin
        .from("moderation_reports")
        .select("id, reporter_id, target_type, target_id, category, details, status, assigned_admin_id, decision_reason, resolved_by, resolved_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    if (params?.status && ["open", "in_review", "resolved", "dismissed", "escalated"].includes(params.status)) {
        query = query.eq("status", params.status);
    }

    const { data, error } = await query;
    if (error) throw new Error("Unable to load reports");
    return (data ?? []) as AdminReportRecord[];
}

export async function getAdminAuditLogs(page: number = 1, filterAction?: string) {
    const { admin } = await requireAdmin();
    const limit = 25;
    const offset = (page - 1) * limit;

    let query = admin
        .from("admin_audit_logs")
        .select("id, admin_user_id, action, target_type, target_id, reason, outcome, request_id, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

    if (filterAction && filterAction !== "all") {
        query = query.eq("action", filterAction);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error("Unable to load audit logs");

    return {
        records: data ?? [],
        total: count ?? 0,
        page,
        pages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    };
}

export async function getAdminAnalytics(periodDays: number = 30) {
    const { admin } = await requireAdmin();
    const safeDays = periodDays === 7 ? 7 : 30;
    const periodStart = isoDaysAgo(safeDays);

    const [
        totalUsers, totalPosts, totalComments, totalReactions, totalFollows, totalJobs, totalApplications,
        recentUsers, recentPosts, recentJobs, recentApplications,
        topAuthorsData, topEngagedPosts
    ] = await Promise.all([
        countTable(admin, "profiles"),
        countTable(admin, "posts"),
        countTable(admin, "comments"),
        countTable(admin, "reactions"),
        countTable(admin, "follows"),
        countTable(admin, "job_listings"),
        countTable(admin, "applications"),
        admin.from("profiles").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("posts").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("job_listings").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("applications").select("created_at").gte("created_at", periodStart).order("created_at", { ascending: true }),
        admin.from("posts").select("user_id").limit(100),
        admin.from("posts").select("id, content, created_at, user_id").order("created_at", { ascending: false }).limit(6),
    ]);

    // Active contributor calculation from recent posts
    const authorPostCounts: Record<string, number> = {};
    for (const p of topAuthorsData.data ?? []) {
        authorPostCounts[p.user_id] = (authorPostCounts[p.user_id] || 0) + 1;
    }
    const sortedAuthors = Object.entries(authorPostCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const topAuthorsWithProfiles = await Promise.all(
        sortedAuthors.map(async ([userId, count]) => {
            const { data: prof } = await admin
                .from("profiles")
                .select("name, slug, role, avatar_url")
                .eq("user_id", userId)
                .maybeSingle();
            return {
                userId,
                postCount: count,
                name: prof?.name ?? "Unknown architect",
                slug: prof?.slug ?? userId,
                role: prof?.role ?? "member",
            };
        })
    );

    return {
        periodDays: safeDays,
        totals: {
            users: totalUsers,
            posts: totalPosts,
            comments: totalComments,
            reactions: totalReactions,
            follows: totalFollows,
            jobs: totalJobs,
            applications: totalApplications,
        },
        recentActivity: {
            newUsers: recentUsers.data?.length ?? 0,
            newPosts: recentPosts.data?.length ?? 0,
            newJobs: recentJobs.data?.length ?? 0,
            newApplications: recentApplications.data?.length ?? 0,
        },
        topAuthors: topAuthorsWithProfiles,
        recentSamplePosts: topEngagedPosts.data ?? [],
    };
}

export async function getAdminSystemHealth() {
    const { admin } = await requireAdmin();

    const dbStart = performance.now();
    let dbStatus: "connected" | "degraded" | "error" = "connected";
    let dbLatencyMs = 0;
    let profilesCount = 0;

    try {
        const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
        dbLatencyMs = Math.round(performance.now() - dbStart);
        if (error) {
            dbStatus = "error";
        } else {
            profilesCount = count ?? 0;
        }
    } catch {
        dbStatus = "error";
        dbLatencyMs = Math.round(performance.now() - dbStart);
    }

    const authStart = performance.now();
    let authLatencyMs = 0;
    let authStatus: "connected" | "error" = "connected";
    try {
        const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
        authLatencyMs = Math.round(performance.now() - authStart);
        if (error) authStatus = "error";
    } catch {
        authStatus = "error";
        authLatencyMs = Math.round(performance.now() - authStart);
    }

    return {
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            latencyMs: dbLatencyMs,
            recordsSampled: profilesCount,
        },
        authService: {
            status: authStatus,
            latencyMs: authLatencyMs,
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || "development",
            runtime: "Node.js (Next.js Server Component)",
            supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        },
    };
}
