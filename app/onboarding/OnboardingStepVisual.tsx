import Image from "next/image";
import type { AccountType } from "@/types";
import styles from "./onboarding.module.css";

const visuals: Record<AccountType, { identity: string; interests: string; project: string; connections: string }> = {
    student: { identity: "Build a profile around what you’re learning.", interests: "Your curiosity has a place here.", project: "Start with the work you’re proud of.", connections: "Meet people shaping what comes next." },
    professional: { identity: "Make your practice and perspective visible.", interests: "Show the work you want to do more of.", project: "Bring your best work into view.", connections: "Find your place in the wider industry." },
    firm: { identity: "Give your practice a clear place to be found.", interests: "Show where your practice is headed.", project: "Introduce the work behind your practice.", connections: "Meet people and businesses to work with." },
    business: { identity: "Make it clear what your business brings.", interests: "Help the right people find what you offer.", project: "", connections: "Meet the people behind the projects." },
};

const images: Record<AccountType, string> = {
    student: "/hero/render-pavilion-study.svg",
    professional: "/hero/archicareer-modern-facade.jpg",
    firm: "/hero/archicareer-cultural-pavilion.jpg",
    business: "/hero/archicareer-material-samples.jpg",
};

export default function OnboardingStepVisual({ accountType, stage }: { accountType: AccountType; stage: "identity" | "interests" | "project" | "connections" }) {
    const copy = visuals[accountType][stage];
    const section = stage === "identity" ? "02 / YOUR IDENTITY" : stage === "interests" ? "03 / YOUR FIELD" : stage === "project" ? "04 / YOUR WORK" : "05 / YOUR PEOPLE";
    return <aside className={styles.stepVisual}>
        <Image src={images[accountType]} alt="Architectural study and built-environment work" fill sizes="(max-width: 820px) 100vw, 42vw" />
        <div className={styles.stepVisualShade} />
        <div className={styles.stepVisualCopy}><p>{section}</p><h1>{copy}</h1><span>Creates. Connects. Builds.</span></div>
    </aside>;
}
