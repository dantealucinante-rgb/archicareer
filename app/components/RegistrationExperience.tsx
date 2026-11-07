"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthBrand from "@/app/components/AuthBrand";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";
import styles from "./registration.module.css";

export type RegistrationKind = "student" | "professional" | "firm" | "business";
type InterestContext = { interests: string[]; interest_other: string };
const professions = ["Architecture", "Interior Design", "Landscape Architecture", "Structural Engineering", "Civil Engineering", "Construction", "Building", "Contracting", "Urban Planning", "3D Visualisation", "3D Modelling", "Product Design", "Furniture Design", "Material Design", "Project Management", "Real Estate", "Building Materials", "Manufacturing", "Photography", "Graphic Design", "Other"];
const businessProducts = ["Building Materials", "Furniture", "Lighting", "Finishes", "Construction Equipment", "Doors and Windows", "Roofing", "Flooring", "Sanitary Ware", "Manufacturing", "Distribution", "Consulting", "Other"];
const storyImages: Record<RegistrationKind, string> = {
    student: "/hero/archicareer-public-plaza.jpg",
    professional: "/hero/archicareer-modern-facade.jpg",
    firm: "/hero/archicareer-cultural-pavilion.jpg",
    business: "/hero/archicareer-material-samples.jpg",
};
const headings: Record<RegistrationKind, { title: string; intro: string; side: string; benefits: string[] }> = {
    student: { title: "Start building your future.", intro: "Create your ArchiCareer account, showcase your work, connect with professionals and discover opportunities across your industry.", side: "Your next step starts with the work you make.", benefits: ["Build your professional identity", "Showcase academic projects", "Find internships and connect with professionals"] },
    professional: { title: "Your work. Your identity. Your next opportunity.", intro: "Create your professional presence on ArchiCareer. Showcase your work, connect with others and take your career further.", side: "Make your experience and work easier to find.", benefits: ["Share projects and expertise", "Connect across disciplines", "Find your next opportunity"] },
    firm: { title: "Build your firm’s presence.", intro: "Bring your practice to ArchiCareer. Showcase your projects, connect with professionals and discover opportunities to grow your team.", side: "Give the work of your practice a place to be seen.", benefits: ["Showcase your practice and projects", "Meet professionals across the industry", "Share opportunities with your team"] },
    business: { title: "Put your business in the right network.", intro: "Create your business presence on ArchiCareer and connect with professionals, firms and people looking for what you offer.", side: "Connect what you offer to the people shaping projects.", benefits: ["Describe products and services", "Reach professionals and firms", "Build visibility across the industry"] },
};

function parseContext(raw: string): InterestContext {
    try {
        const parsed = JSON.parse(raw) as Partial<InterestContext>;
        return { interests: Array.isArray(parsed.interests) ? professions.filter((value) => parsed.interests?.includes(value)) : [], interest_other: typeof parsed.interest_other === "string" ? parsed.interest_other.slice(0, 120) : "" };
    } catch { return { interests: [], interest_other: "" }; }
}

export default function RegistrationExperience({ kind, onboarding = "", oauthError }: { kind: RegistrationKind | null; onboarding?: string; oauthError?: string }) {
    const copy = kind ? headings[kind] : null;
    const context = useMemo(() => parseContext(onboarding), [onboarding]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [institution, setInstitution] = useState("");
    const [discipline, setDiscipline] = useState(context.interests.find((item) => item !== "Other") ?? "");
    const [academicLevel, setAcademicLevel] = useState("");
    const [graduationYear, setGraduationYear] = useState("");
    const [professionalTitle, setProfessionalTitle] = useState(context.interests.find((item) => item !== "Other") ?? "");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");
    const [organizationType, setOrganizationType] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [website, setWebsite] = useState("");
    const [yearEstablished, setYearEstablished] = useState("");
    const [businessCategory, setBusinessCategory] = useState("");
    const [products, setProducts] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(oauthError ? "error" : "idle");
    const [message, setMessage] = useState(() => oauthError === "cancelled"
        ? "Google sign-up was cancelled. Your details are still here; continue with Google or create an account with email."
        : oauthError === "account_not_found"
            ? "This Google account does not have an ArchiCareer profile yet. Continue with sign-up to set up your account."
            : oauthError
                ? "Google sign-up could not be completed. Your Google account was not treated as a failed login; try again or use email."
                : "");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const isOrganization = kind === "firm" || kind === "business";
    const title = isOrganization ? kind === "firm" ? "Organisation name" : "Business name" : "Your name";

    function toggleProduct(item: string) {
        setProducts((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
    }

    function metadata() {
        const fullName = isOrganization ? organizationName.trim() : `${firstName.trim()} ${lastName.trim()}`.trim();
        const role = kind === "student" ? "student" : kind === "professional" ? "architect" : "firm";
        return {
            full_name: fullName,
            name: fullName,
            role,
            account_type: kind,
            school_or_firm: kind === "student" ? institution.trim() : isOrganization ? fullName : null,
            location: location.trim(),
            bio: kind === "business" || kind === "firm" ? description.trim() : null,
            personal_site_url: website.trim(),
            professional_interests: context.interests,
            professional_interest_other: context.interests.includes("Other") ? context.interest_other : "",
            registration_details: {
                first_name: firstName.trim(), last_name: lastName.trim(),
                discipline: kind === "student" ? discipline : undefined,
                primary_industry: kind === "firm" ? discipline.trim() : undefined,
                academic_level: kind === "student" ? academicLevel : undefined,
                graduation_year: kind === "student" ? graduationYear : undefined,
                professional_title: kind === "professional" ? professionalTitle.trim() : undefined,
                years_experience: kind === "professional" ? experience : undefined,
                organization_type: kind === "firm" ? organizationType : undefined,
                company_size: kind === "firm" ? companySize : undefined,
                year_established: kind === "firm" ? yearEstablished : undefined,
                business_category: kind === "business" ? businessCategory : undefined,
                products_services: kind === "business" ? products : undefined,
                other_profession: context.interest_other,
            },
        };
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (status === "sending" || status === "sent") return;
        const formData = new FormData(event.currentTarget);
        const organizationName = String(formData.get("organization-name") ?? formData.get("business-name") ?? "").trim();
        if (isOrganization && !organizationName) { setStatus("error"); setMessage(`Enter your ${kind === "firm" ? "organisation" : "business"} name.`); return; }
        if (password.length < 8) { setStatus("error"); setMessage("Use a password with at least 8 characters."); return; }
        if (password !== confirmPassword) { setStatus("error"); setMessage("The passwords do not match."); return; }
        if (website.trim()) {
            try { const url = new URL(website); if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error(); }
            catch { setStatus("error"); setMessage("Enter a website beginning with http:// or https://."); return; }
        }

        setStatus("sending"); setMessage("");
        const role = kind === "student" ? "student" : kind === "professional" ? "architect" : "firm";
        const onboarding = JSON.stringify({ account_type: kind, interests: context.interests, interest_other: context.interest_other });
        const nextPath = `/onboarding?intent=signup&role=${role}&account_type=${kind}&onboarding=${encodeURIComponent(onboarding)}`;
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        try {
            const { error, data } = await createClient().auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo, data: metadata() } });
            if (error) { setStatus("error"); setMessage("We couldn’t create your account. Check your details and try again."); return; }
            setStatus("sent");
            if (data.session) {
                setMessage("Your account is ready. Preparing your ArchiCareer space…");
                await fetch("/api/onboarding/bootstrap", { method: "POST" }).catch(() => null);
                window.location.assign("/onboarding");
                return;
            }
            setMessage("Check your email to verify your account. Your registration details are saved, and you can continue from the verification link.");
        } catch {
            setStatus("error");
            setMessage("We couldn’t reach the registration service. Check your connection and try again.");
        }
    }

    async function continueWithGoogle() {
        setStatus("sending"); setMessage("");
        const role = kind === "student" ? "student" : kind === "professional" ? "architect" : "firm";
        const onboarding = JSON.stringify({ account_type: kind, interests: context.interests, interest_other: context.interest_other });
        const nextPath = `/onboarding?intent=signup&role=${role}&account_type=${kind}&onboarding=${encodeURIComponent(onboarding)}`;
        try {
            const intentResponse = await fetch("/api/auth/google-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ account_type: kind, user_metadata: metadata() }),
            });
            if (!intentResponse.ok) {
                const result = await intentResponse.json().catch(() => ({}));
                throw new Error(result.error ?? "Google sign-up could not be prepared. Try again or use email.");
            }
            const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
            if (error) throw error;
        } catch (error) {
            await fetch("/api/auth/google-intent", { method: "DELETE" }).catch(() => null);
            setStatus("error"); setMessage(error instanceof Error && error.message ? error.message : "Google sign-up could not be started. Check your connection and try again.");
        }
    }

    const inputClass = styles.input;
    const selectedInterests = context.interests.length > 0 ? context.interests : [];
    if (!kind || !copy) return <main className={styles.missing}><AuthBrand /><h1>Choose an account type first.</h1><p>We’ll send you to the matching registration form after you choose how you’re joining.</p><Link href="/join" className={styles.submit}>Return to account selection</Link></main>;

    return <main className={styles.page}>
        <header className={styles.mobileHeader}><AuthBrand /><Link href="/join?step=interests" className={styles.homeLink}>← Back to account and interests</Link></header>
        <div className={styles.layout}>
            <aside className={`${styles.story} ${styles[`story_${kind}`]}`}>
                <Image className={styles.storyImage} src={storyImages[kind]} alt="" fill sizes="(max-width: 700px) 100vw, 48vw" preload />
                <div className={styles.storyTop}><AuthBrand /><div className={styles.roller} aria-label="Locked in, cook, you’re in, W’s"><span className={styles.rollerSrOnly}>Locked in, cook, you’re in, W’s</span><span className={styles.rollerWindow} aria-hidden="true"><span className={styles.rollerTrack}><span>Locked in</span><span>Cook</span><span>You’re in</span><span>W’s</span><span>Locked in</span></span></span></div></div>
                <div className={styles.storyContent}><h1>{copy.title}</h1><p className={styles.storyCopy}>{copy.side}</p><ul>{copy.benefits.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul></div>
            </aside>
            <section className={styles.panel} aria-labelledby="form-title">
                <div className={styles.formWrap}>
                <Link href="/join?step=interests" className={styles.desktopBack}>← Back to account and interests</Link>
                <div className={styles.formHeading}>
                    <p className={styles.formEyebrow}>{kind === "student" ? "STUDENT ACCOUNT" : kind === "professional" ? "INDIVIDUAL ACCOUNT" : kind === "firm" ? "FIRM ACCOUNT" : "BUSINESS ACCOUNT"}</p>
                    <h2 id="form-title">{isOrganization ? kind === "firm" ? "Tell us about your practice." : "Tell us about your business." : copy.title}</h2>
                    <p>{copy.intro}</p>
                    <p className={styles.signIn}>Already have an account? <Link href={kind === "firm" || kind === "business" ? `/firms/login?account_type=${kind}` : `/login?account_type=${kind}`}>Sign in</Link></p>
                </div>
                <form className={styles.form} onSubmit={submit}>
                    <div className={styles.googleBlock}><GoogleAuthButton action="signUp" onClick={continueWithGoogle} disabled={status === "sending"} loading={status === "sending"} /><p>Or continue with your email and password.</p></div>
                    <div className={styles.twoColumns}>
                        {!isOrganization && <><Field id="first-name" label="First name"><input id="first-name" name="first_name" autoComplete="given-name" required minLength={2} value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClass} placeholder="First name" /></Field><Field id="last-name" label="Last name"><input id="last-name" name="last_name" autoComplete="family-name" required minLength={2} value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClass} placeholder="Last name" /></Field></>}
                        {isOrganization && <><Field id="contact-first" label="Contact first name"><input id="contact-first" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClass} placeholder="First name" /></Field><Field id="contact-last" label="Contact last name"><input id="contact-last" required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClass} placeholder="Last name" /></Field></>}
                    </div>
                    {isOrganization && <Field id={kind === "firm" ? "organization-name" : "business-name"} label={title}><input id={kind === "firm" ? "organization-name" : "business-name"} name={kind === "firm" ? "organization-name" : "business-name"} required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className={inputClass} placeholder={kind === "firm" ? "Practice or organisation name" : "Business name"} /></Field>}
                    <Field id="email" label={isOrganization ? kind === "firm" ? "Official email" : "Business email" : kind === "student" ? "Email address" : "Professional email"}><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder={isOrganization ? "name@organisation.com" : "you@example.com"} /></Field>
                    <div className={styles.twoColumns}>
                        <Field id="password" label="Password"><div className={styles.passwordWrap}><input id="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 8 characters" /><button type="button" className={styles.reveal} aria-label={passwordVisible ? "Hide password" : "Show password"} onClick={() => setPasswordVisible((value) => !value)}>{passwordVisible ? "Hide" : "Show"}</button></div></Field>
                        <Field id="confirm-password" label="Confirm password"><div className={styles.passwordWrap}><input id="confirm-password" type={confirmVisible ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} placeholder="Repeat your password" /><button type="button" className={styles.reveal} aria-label={confirmVisible ? "Hide confirmation" : "Show confirmation"} onClick={() => setConfirmVisible((value) => !value)}>{confirmVisible ? "Hide" : "Show"}</button></div></Field>
                    </div>
                    <p className={styles.passwordHint}>Use at least 8 characters.</p>

                    {kind === "student" && <div className={styles.sectionFields}><h3>Academic information <span>Optional for now</span></h3><Field id="institution" label="Institution"><input id="institution" value={institution} onChange={(event) => setInstitution(event.target.value)} className={inputClass} placeholder="School or university" /></Field><div className={styles.twoColumns}><Field id="discipline" label="Course or discipline"><select id="discipline" value={discipline} onChange={(event) => setDiscipline(event.target.value)} className={inputClass}><option value="">Choose a discipline</option>{professions.filter((item) => item !== "Other").map((item) => <option key={item}>{item}</option>)}</select></Field><Field id="academic-level" label="Current academic level"><select id="academic-level" value={academicLevel} onChange={(event) => setAcademicLevel(event.target.value)} className={inputClass}><option value="">Choose a level</option>{["First year", "Second year", "Third year", "Fourth year", "Fifth year", "Postgraduate", "Other"].map((item) => <option key={item}>{item}</option>)}</select></Field></div><Field id="graduation-year" label="Expected graduation year"><input id="graduation-year" type="number" min="2020" max="2100" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} className={inputClass} placeholder="e.g. 2028" /></Field></div>}

                    {kind === "professional" && <div className={styles.sectionFields}><h3>Professional information</h3><div className={styles.twoColumns}><Field id="professional-title" label="Professional title"><input id="professional-title" required value={professionalTitle} onChange={(event) => setProfessionalTitle(event.target.value)} className={inputClass} placeholder="e.g. Interior Designer" /></Field><Field id="primary-discipline" label="Primary discipline"><select id="primary-discipline" value={discipline} onChange={(event) => setDiscipline(event.target.value)} className={inputClass}><option value="">Choose a discipline</option>{professions.filter((item) => item !== "Other").map((item) => <option key={item}>{item}</option>)}</select></Field></div><div className={styles.twoColumns}><Field id="location" label="Location"><input id="location" value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} placeholder="City or state" /></Field><Field id="experience" label="Years of experience"><select id="experience" value={experience} onChange={(event) => setExperience(event.target.value)} className={inputClass}><option value="">Select experience</option>{["0–2 years", "3–5 years", "6–10 years", "11–15 years", "16+ years"].map((item) => <option key={item}>{item}</option>)}</select></Field></div></div>}

                    {kind === "firm" && <div className={styles.sectionFields}><h3>Practice information <span>Keep it brief</span></h3><div className={styles.twoColumns}><Field id="org-type" label="Organisation type"><select id="org-type" value={organizationType} onChange={(event) => setOrganizationType(event.target.value)} className={inputClass}>{["", "Architecture Practice", "Engineering Firm", "Construction Company", "Design Studio", "Consulting Firm", "Other"].map((item) => <option key={item} value={item}>{item || "Choose a type"}</option>)}</select></Field><Field id="company-size" label="Company size"><select id="company-size" value={companySize} onChange={(event) => setCompanySize(event.target.value)} className={inputClass}>{["", "Just me", "2–10 employees", "11–50 employees", "51–200 employees", "201–500 employees", "500+ employees"].map((item) => <option key={item} value={item}>{item || "Choose size"}</option>)}</select></Field></div><div className={styles.twoColumns}><Field id="location" label="Location"><input id="location" value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} placeholder="City or state" /></Field><Field id="website" label="Website"><input id="website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={inputClass} placeholder="https://yourpractice.com" /></Field></div><div className={styles.twoColumns}><Field id="industry" label="Primary industry"><input id="industry" value={discipline} onChange={(event) => setDiscipline(event.target.value)} className={inputClass} placeholder="Architecture, engineering…" /></Field><Field id="year-established" label="Year established"><input id="year-established" type="number" min="1800" max={new Date().getFullYear()} value={yearEstablished} onChange={(event) => setYearEstablished(event.target.value)} className={inputClass} placeholder="Optional" /></Field></div><Field id="firm-description" label="What does the practice do?"><textarea id="firm-description" rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} ${styles.textarea}`} placeholder="A short introduction to your services or focus." /></Field></div>}

                    {kind === "business" && <div className={styles.sectionFields}><h3>Business information</h3><Field id="business-category" label="Business category"><input id="business-category" required value={businessCategory} onChange={(event) => setBusinessCategory(event.target.value)} className={inputClass} placeholder="Supplier, manufacturer, service provider…" /></Field><div className={styles.field}><p id="products-services-label" className={styles.label}>Products or services</p><div className={styles.choiceWrap} role="group" aria-labelledby="products-services-label">{businessProducts.map((item) => <button type="button" key={item} aria-pressed={products.includes(item)} onClick={() => toggleProduct(item)} className={`${styles.choice} ${products.includes(item) ? styles.choiceSelected : ""}`}>{products.includes(item) && <span aria-hidden="true">✓ </span>}{item}</button>)}</div></div><div className={styles.twoColumns}><Field id="location" label="Location"><input id="location" value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} placeholder="City or state" /></Field><Field id="website" label="Website"><input id="website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={inputClass} placeholder="https://yourbusiness.com" /></Field></div><Field id="business-description" label="What does your business do?"><textarea id="business-description" rows={4} required maxLength={700} value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} ${styles.textarea}`} placeholder="Describe your products, services and the people you support." /></Field></div>}

                    {selectedInterests.length > 0 && <div className={styles.interests}><div><h3>Your selected interests</h3><Link href="/join?step=interests">Edit interests</Link></div><div className={styles.choiceWrap}>{selectedInterests.map((item) => <span key={item} className={styles.interestTag}>{item}</span>)}{context.interest_other && <span className={styles.interestTag}>{context.interest_other}</span>}</div></div>}
                    {selectedInterests.length === 0 && <p className={styles.noInterests}>No interests were selected. <Link href="/join?step=interests">Return to select them</Link> or continue without them.</p>}
                    <button type="submit" disabled={status === "sending" || status === "sent"} className={styles.submit}>{status === "sending" ? "Creating your account…" : status === "sent" ? "Check your email" : "Create my account"}</button>
                    <p className={styles.legal}>By creating an account, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
                    {message && <p role={status === "error" ? "alert" : "status"} aria-live="polite" className={`${styles.message} ${status === "error" ? styles.error : styles.success}`}>{message}</p>}
                </form>
                </div>
            </section>
        </div>
    </main>;
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
    return <div className={styles.field}><label className={styles.label} htmlFor={id}>{label}</label>{children}</div>;
}
