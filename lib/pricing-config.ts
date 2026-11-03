export const FREE_PORTFOLIO_SPACES = 3;
export const PRO_PORTFOLIO_SPACES = 20;
export const PRO_PLUS_PORTFOLIO_SPACES = 50;
export const MAX_PURCHASED_PORTFOLIO_SPACES = 10;

export const PRO_MONTHLY_PRICE = 1_500;
export const PRO_YEARLY_PRICE = 15_000;
export const PRO_PLUS_PRICE: number | null = null;
export const CHECKOUT_AVAILABLE = false;

export const ADDITIONAL_SPACE_BUNDLES = [
    { spaces: 1, price: 1_500 },
    { spaces: 3, price: 3_000 },
    { spaces: 5, price: 4_500 },
    { spaces: 10, price: 8_000 },
] as const;

export type MembershipPlan = "free" | "pro" | "pro_plus";

export function includedPortfolioSpaces(plan: MembershipPlan) {
    if (plan === "pro") return PRO_PORTFOLIO_SPACES;
    if (plan === "pro_plus") return PRO_PLUS_PORTFOLIO_SPACES;
    return FREE_PORTFOLIO_SPACES;
}

export function formatNaira(amount: number) {
    return `₦${amount.toLocaleString("en-NG")}`;
}
