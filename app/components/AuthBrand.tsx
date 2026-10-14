import Image from "next/image";
import Link from "next/link";

export default function AuthBrand() {
    return <Link href="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-ink transition-colors hover:text-redline">
        <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" priority />
        ArchiCareer
    </Link>;
}
