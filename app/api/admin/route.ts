import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin, writeAdminAudit } from "@/lib/admin";

const actionSchema = z.object({
    resource: z.enum(["user", "post", "comment", "showcase", "job", "report", "role"]),
    id: z.string().uuid(),
    action: z.string().min(1).max(64),
    reason: z.string().trim().min(3).max(1000),
});

function responseError(error: unknown) {
    if (error instanceof AdminAccessError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === "Unauthenticated" ? 401 : 403 }
        );
    }
    return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to complete administrative action" },
        { status: 400 }
    );
}

export async function PATCH(request: Request) {
    try {
        const input = actionSchema.parse(await request.json());
        const { admin, role, user } = await requireAdmin();

        const auditId = await writeAdminAudit({
            adminUserId: user.id,
            action: input.action,
            targetType: input.resource,
            targetId: input.id,
            reason: input.reason,
            outcome: "failed",
        });

        if (input.resource === "user") {
            if (!(["suspend", "restore", "ban"] as string[]).includes(input.action)) {
                throw new Error("Unsupported user action");
            }
            if (input.id === user.id) {
                throw new Error("Administrators cannot change their own account status");
            }
            const account_status = input.action === "restore" ? "active" : input.action === "suspend" ? "suspended" : "banned";
            const { error } = await admin.from("profiles").update({ account_status }).eq("user_id", input.id);
            if (error) throw new Error("Unable to update account status");

        } else if (input.resource === "post" || input.resource === "comment" || input.resource === "showcase") {
            if (!(["remove", "restore"] as string[]).includes(input.action)) {
                throw new Error("Unsupported content action");
            }
            const table = input.resource === "post" ? "posts" : input.resource === "comment" ? "comments" : "portfolio_items";
            const { error } = await admin.from(table).update({ moderation_status: input.action === "remove" ? "removed" : "active" }).eq("id", input.id);
            if (error) throw new Error("Unable to update content status");

        } else if (input.resource === "job") {
            if (!(["remove", "restore", "close"] as string[]).includes(input.action)) {
                throw new Error("Unsupported job action");
            }
            const values = input.action === "remove"
                ? { moderation_status: "removed" }
                : input.action === "restore"
                ? { moderation_status: "active" }
                : { status: "closed" };
            const { error } = await admin.from("job_listings").update(values).eq("id", input.id);
            if (error) throw new Error("Unable to update job listing");

        } else if (input.resource === "report") {
            if (!(["in_review", "resolved", "dismissed", "escalated"] as string[]).includes(input.action)) {
                throw new Error("Unsupported report action");
            }
            const { data: current, error: reportReadError } = await admin
                .from("moderation_reports")
                .select("status, assigned_admin_id")
                .eq("id", input.id)
                .maybeSingle();

            if (reportReadError || !current) throw new Error("Report not found");
            if (current.status !== "open" && current.assigned_admin_id && current.assigned_admin_id !== user.id && role !== "superadmin") {
                throw new Error("This report is currently claimed by another administrator");
            }

            const isClosing = ["resolved", "dismissed"].includes(input.action);
            const values = {
                status: input.action,
                assigned_admin_id: user.id,
                decision_reason: input.reason,
                resolved_by: isClosing ? user.id : null,
                resolved_at: isClosing ? new Date().toISOString() : null,
            };

            const { data, error } = await admin
                .from("moderation_reports")
                .update(values)
                .eq("id", input.id)
                .select("id")
                .maybeSingle();

            if (error || !data) throw new Error("Unable to update moderation report");

        } else {
            // role assignment (superadmin only)
            if (role !== "superadmin") {
                throw new AdminAccessError("Superadministrator access is required to modify administrative roles");
            }
            if (!(["grant_admin", "revoke"] as string[]).includes(input.action)) {
                throw new Error("Unsupported role action");
            }
            if (input.id === user.id) {
                throw new Error("Superadministrators cannot revoke or modify their own administrative role");
            }

            const result = input.action === "grant_admin"
                ? await admin.from("admin_roles").upsert({ user_id: input.id, role: "admin", created_by: user.id })
                : await admin.from("admin_roles").delete().eq("user_id", input.id);

            if (result.error) throw new Error("Unable to update administrator role");
        }

        const { error: auditError } = await admin.from("admin_audit_logs").update({ outcome: "success" }).eq("id", auditId);
        if (auditError) throw new Error("The action was applied but its audit confirmation failed");

        return NextResponse.json({ ok: true });
    } catch (error) {
        return responseError(error);
    }
}
