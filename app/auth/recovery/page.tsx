import ProfileRecovery from "./ProfileRecovery";

export const dynamic = "force-dynamic";

export default async function AuthRecoveryPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
    const params = await searchParams;
    return <ProfileRecovery reason={params.reason ?? "profile"} />;
}
