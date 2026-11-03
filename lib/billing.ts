import { createClient } from "@/lib/supabase/server";
import {
    MAX_PURCHASED_PORTFOLIO_SPACES,
    MembershipPlan,
    includedPortfolioSpaces,
} from "@/lib/pricing-config";

export type PortfolioEntitlements = {
    plan: MembershipPlan;
    billingInterval: "monthly" | "yearly" | null;
    currentPeriodEnd: string | null;
    includedSpaces: number;
    purchasedSpaces: number;
    maximumPurchasedSpaces: number;
    remainingPurchaseAllowance: number;
    totalSpaceLimit: number;
    usedSpaces: number;
    remainingPortfolioSpaces: number;
};

export async function getPortfolioEntitlements(userId: string, profileId: string): Promise<{
    data: PortfolioEntitlements | null;
    error: Error | null;
}> {
    try {
        const supabase = await createClient();
        const [subscriptionResult, purchasesResult, projectsResult] = await Promise.all([
            supabase
                .from("billing_subscriptions")
                .select("plan, billing_interval, status, current_period_end")
                .eq("user_id", userId)
                .maybeSingle(),
            supabase
                .from("portfolio_space_purchases")
                .select("quantity")
                .eq("user_id", userId)
                .eq("status", "paid"),
            supabase
                .from("portfolio_items")
                .select("id", { count: "exact", head: true })
                .eq("profile_id", profileId),
        ]);

        const error = subscriptionResult.error ?? purchasesResult.error ?? projectsResult.error;
        if (error) return { data: null, error: new Error(error.message) };

        const subscription = subscriptionResult.data;
        const endDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
        const subscriptionIsCurrent = Boolean(
            subscription &&
            (subscription.status === "active" || subscription.status === "canceled") &&
            endDate &&
            endDate.getTime() > Date.now()
        );
        const plan: MembershipPlan = subscriptionIsCurrent &&
            (subscription?.plan === "pro" || subscription?.plan === "pro_plus")
            ? subscription.plan
            : "free";
        const purchasedSpaces = (purchasesResult.data ?? []).reduce(
            (total, purchase) => total + Number(purchase.quantity ?? 0),
            0,
        );
        const includedSpaces = includedPortfolioSpaces(plan);
        const usedSpaces = projectsResult.count ?? 0;
        const totalSpaceLimit = includedSpaces + purchasedSpaces;

        return {
            data: {
                plan,
                billingInterval: subscriptionIsCurrent && subscription?.billing_interval === "yearly" ? "yearly" : subscriptionIsCurrent && subscription?.billing_interval === "monthly" ? "monthly" : null,
                currentPeriodEnd: subscriptionIsCurrent ? subscription?.current_period_end ?? null : null,
                includedSpaces,
                purchasedSpaces,
                maximumPurchasedSpaces: MAX_PURCHASED_PORTFOLIO_SPACES,
                remainingPurchaseAllowance: Math.max(0, MAX_PURCHASED_PORTFOLIO_SPACES - purchasedSpaces),
                totalSpaceLimit,
                usedSpaces,
                remainingPortfolioSpaces: Math.max(0, totalSpaceLimit - usedSpaces),
            },
            error: null,
        };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
