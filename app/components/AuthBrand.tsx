import Link from "next/link";
import BrandMark from "./BrandMark";

export default function AuthBrand() {
    return <Link href="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-ink transition-colors hover:text-redline">
        <BrandMark className="h-8 w-8 shrink-0" />
        ArchiCareer
    </Link>;
}
