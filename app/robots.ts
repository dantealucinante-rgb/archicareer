import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/", "/p/", "/p/*/projects/", "/jobs", "/discover", "/feed", "/communities", "/a/", "/about", "/firms/*"],
            disallow: [
                "/api/",
                "/admin",
                "/dashboard",
                "/applications",
                "/auth/",
                "/login",
                "/signup",
                "/join",
                "/reset-password",
                "/onboarding",
                "/profile",
                "/settings",
                "/firms/login",
                "/firms/signup",
                "/firms/onboarding",
                "/business/signup",
                "/communities/create",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
