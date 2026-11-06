import Image from "next/image";
import type { AccountType } from "@/types";
import type { OnboardingDraft } from "./onboarding-types";
import styles from "./onboarding.module.css";

const accountLabel: Record<AccountType, string> = { student: "Student", professional: "Individual professional", firm: "Firm", business: "Business" };

export default function OnboardingWelcomeStep({
    ready = false,
    accountType,
    name,
    avatarUrl,
    draft,
    interests,
    projectCount,
}: {
    ready?: boolean;
    accountType: AccountType;
    name: string;
    avatarUrl: string | null;
    draft: OnboardingDraft;
    interests: string[];
    projectCount: number;
}) {
    const image = ready ? "/hero/archicareer-cultural-pavilion.jpg" : "/hero/archicareer-public-plaza.jpg";
    return <div className={`${styles.immersive} ${ready ? styles.immersiveReady : ""}`}>
        <section className={styles.immersiveCopy}>
            <p className={styles.colorTag}>{ready ? "SETUP / COMPLETE" : "ARCHICAREER / BEGINS"}</p>
            <h1>{ready ? <>YOU’RE<br />READY.</> : "YOU’RE IN."}</h1>
            <h2>{ready ? "Your ArchiCareer journey starts here." : "Welcome to ArchiCareer."}</h2>
            <p className={styles.immersiveDescription}>{ready
                ? "Your profile is taking shape. Explore the community, discover work and start building meaningful connections across the industry."
                : "Your work, your ideas and your next opportunity all have a place here. Let’s get your space ready."}</p>
            {ready && <div className={styles.summary}>
                <div className={styles.summaryIdentity}>
                    <div className={styles.summaryAvatar}>{avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="64px" /> : <span>{name.trim().charAt(0).toUpperCase() || "A"}</span>}</div>
                    <div><p>{name}</p><span>{accountLabel[accountType]}</span></div>
                </div>
                {accountType === "student" && draft.institution && <p className={styles.summaryLine}><span>INSTITUTION</span>{draft.institution}</p>}
                {interests.length > 0 && <div className={styles.summaryLine}><span>YOUR AREAS</span><div className={styles.summaryPills}>{interests.slice(0, 5).map((interest) => <span key={interest}>{interest}</span>)}{interests.length > 5 && <span>+{interests.length - 5}</span>}</div></div>}
                {projectCount > 0 && <p className={styles.summaryLine}><span>PORTFOLIO</span>{projectCount} {projectCount === 1 ? "project" : "projects"} added</p>}
            </div>}
        </section>
        <figure className={styles.immersiveVisual}>
            <Image src={image} alt="An architectural public space designed for gathering" fill priority sizes="(max-width: 820px) 100vw, 52vw" />
            <figcaption><span>01 / ARCHICAREER</span><span>Work, ideas, people.</span></figcaption>
        </figure>
    </div>;
}
