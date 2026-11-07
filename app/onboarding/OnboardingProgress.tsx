import Link from "next/link";
import type { CSSProperties } from "react";
import BrandLogo from "@/app/components/BrandLogo";
import type { OnboardingStage } from "./onboarding-types";
import styles from "./onboarding.module.css";

const stageColors = ["var(--blue)", "var(--orange)", "var(--purple)", "var(--coral)", "var(--teal)", "var(--olive)", "var(--pink)"];

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
            <div className={styles.progressMobile}><span>Current stage</span><strong>{current?.label}</strong></div>
            <ol className={styles.progressList} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
                {stages.map((stage, index) => {
                    const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
                    return <li key={stage.id} data-progress-state={state} aria-current={state === "current" ? "step" : undefined} aria-label={`${stage.label}, ${state}`}>
                        <span className={styles.progressSegment} aria-hidden="true" style={{ "--segment-color": stageColors[stage.id] ?? stageColors[index % stageColors.length] } as CSSProperties} />
                        <span className={styles.progressStageLabel}>{stage.label}{stage.optional && <small>optional</small>}</span>
                    </li>;
                })}
            </ol>
        </nav>
    </header>;
}
