import type { Metadata } from "next";
import JoinExperience from "./JoinExperience";

export const metadata: Metadata = {
    title: "Join ArchiCareer",
    description: "Choose your account and tell us where you work across the built world.",
};

export default function JoinPage() {
    return <JoinExperience />;
}
