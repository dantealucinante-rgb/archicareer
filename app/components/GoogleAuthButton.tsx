"use client";

type GoogleAuthButtonProps = {
    action: "signIn" | "signUp";
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
};

function GoogleMark() {
    return (
        <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0" focusable="false">
            <path fill="#EA4335" d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7964 2.7145v2.2582h2.9082c1.7027-1.5673 2.6845-3.8741 2.6845-6.6136z" />
            <path fill="#4285F4" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.037-3.71H.957v2.332A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.963 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.828.957 4.041l3.006-2.331z" />
            <path fill="#34A853" d="M9 3.58c1.321 0 2.508.454 3.441 1.345l2.581-2.581C13.463.891 11.43 0 9 0A9 9 0 0 0 .957 4.958L3.963 7.29C4.672 5.164 6.656 3.58 9 3.58z" />
        </svg>
    );
}

export default function GoogleAuthButton({ action, disabled = false, loading = false, onClick }: GoogleAuthButtonProps) {
    const label = action === "signIn" ? "Sign in with Google" : "Sign up with Google";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="interactive flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-3 py-3 font-sans text-sm font-semibold text-[#1f1f1f] shadow-sm hover:border-[#1f1f1f] hover:shadow-md focus-visible:outline-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-70"
        >
            <GoogleMark />
            <span>{loading ? "Connecting…" : label}</span>
        </button>
    );
}
