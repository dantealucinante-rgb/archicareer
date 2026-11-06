export const WAITLIST_ACCOUNT_TYPES = ["student", "professional", "firm", "business"] as const;

export const WAITLIST_ACCOUNT_TYPE_LABELS: Record<(typeof WAITLIST_ACCOUNT_TYPES)[number], string> = {
    student: "Student",
    professional: "Individual Professional",
    firm: "Firm",
    business: "Business",
};

export const WAITLIST_CATEGORIES = [
    "architecture_student",
    "architect",
    "interior_designer",
    "architectural_visualiser",
    "landscape_architect",
    "engineer",
    "architecture_firm",
    "other",
] as const;

export const WAITLIST_CATEGORY_LABELS: Record<(typeof WAITLIST_CATEGORIES)[number], string> = {
    architecture_student: "Architecture Student",
    architect: "Architect",
    interior_designer: "Interior Designer",
    architectural_visualiser: "Architectural Visualiser",
    landscape_architect: "Landscape Architect",
    engineer: "Engineer",
    architecture_firm: "Architecture Firm",
    other: "Other",
};
