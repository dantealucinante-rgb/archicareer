import { INTERESTS } from "./onboarding-types";
import styles from "./onboarding.module.css";

export default function OnboardingInterestsStep({ interests, other, onChange }: { interests: string[]; other: string; onChange: (interests: string[], other: string) => void }) {
    function toggle(value: string) {
        onChange(interests.includes(value) ? interests.filter((interest) => interest !== value) : [...interests, value], other);
    }
    return <div className={styles.interestsContent}>
        <div className={styles.sectionHeading}><p className={styles.sectionKicker}>03 / TELL US WHAT YOU DO</p><h2>What are you into?</h2><p>Choose the areas that reflect your work, interests and specialisation. Pick as many as you like.</p></div>
        <div className={styles.interestPills} aria-label="Professional interests">{INTERESTS.map((interest, index) => {
            const selected = interests.includes(interest);
            return <button key={interest} type="button" aria-pressed={selected} onClick={() => toggle(interest)} className={`${styles.interestPill} ${styles[`interestColor${index % 5}`]} ${selected ? styles.interestSelected : ""}`}><span aria-hidden="true">{selected ? "✓" : "+"}</span>{interest}</button>;
        })}</div>
        {interests.includes("Other") && <label className={styles.otherInterest}><span>Tell us what else you do</span><input value={other} onChange={(event) => onChange(interests, event.target.value)} maxLength={120} autoFocus placeholder="Add an interest or specialisation" /></label>}
        <p className={styles.selectionCount} aria-live="polite">{interests.length} {interests.length === 1 ? "area" : "areas"} selected</p>
    </div>;
}
