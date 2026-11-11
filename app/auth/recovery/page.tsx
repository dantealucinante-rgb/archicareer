import ProfileRecovery from "./ProfileRecovery";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account recovery | Archicareer", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function AuthRecoveryPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
    const params = await searchParams;
    return <ProfileRecovery reason={params.reason ?? "profile"} />;
}
