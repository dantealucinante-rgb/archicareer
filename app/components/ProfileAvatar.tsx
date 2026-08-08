import Image from "next/image";
import { getFallbackAvatarUrl, isFallbackAvatarUrl } from "@/lib/avatar";

type ProfileAvatarProps = {
    profile: {
        id?: string | null;
        slug?: string | null;
        name: string;
        avatar_url?: string | null;
    };
    size: number;
    className?: string;
    fallbackClassName?: string;
    priority?: boolean;
};

export default function ProfileAvatar({ profile, size, className = "", fallbackClassName = "", priority = false }: ProfileAvatarProps) {
    const src = profile.avatar_url || getFallbackAvatarUrl(profile);
    const isFallback = !profile.avatar_url || isFallbackAvatarUrl(profile.avatar_url);

    return (
        <Image
            src={src}
            alt={`${profile.name} avatar`}
            width={size}
            height={size}
            priority={priority}
            unoptimized={isFallback}
            className={`${className} ${isFallback ? `bg-sand ${fallbackClassName}` : ""}`.trim()}
        />
    );
}
