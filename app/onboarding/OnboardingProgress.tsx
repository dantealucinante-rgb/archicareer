import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import type { OnboardingStage } from "./onboarding-types";
import styles from "./onboarding.module.css";

export default function OnboardingProgress({ stages, currentStep, saveStatus }: { stages: OnboardingStage[]; currentStep: number; saveStatus: "idle" | "saving" | "saved" | "error" }) {
    const currentIndex = Math.max(0, stages.findIndex((stage) => stage.id === currentStep));
    const current = stages[currentIndex];
    const saveLabel = saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save issue" : saveStatus === "saved" ? "Saved" : "Progress saves as you go";
    return <header className={styles.header}>
        <div className={styles.headerTop}>
            <Link href="/" className={styles.brand} aria-label="ArchiCareer home"><BrandLogo /></Link>
            <div className={styles.headerMeta}><span>YOUR ARCHICAREER SETUP</span><span className={saveStatus === "error" ? styles.saveError : ""} aria-live="polite">{saveLabel}</span></div>
        </div>
        <nav className={styles.progress} aria-label="Setup progress">
            <div className={styles.progressMobile}><span>{String(currentIndex + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</span><strong>{current?.label}</strong><div className={styles.progressTrack}><span style={{ transform: `scaleX(${(currentIndex + 1) / stages.length})` }} /></div></div>
            <ol className={styles.progressList} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>{stages.map((stage, index) => <li key={stage.id} className={index === currentIndex ? styles.progressCurrent : index < currentIndex ? styles.progressComplete : ""} aria-current={index === currentIndex ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><span>{stage.label}{stage.optional && <small>optional</small>}</span></li>)}</ol>
        </nav>
    </header>;
}
