import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/", "/p/", "/jobs", "/discover", "/feed", "/about"],
            disallow: [
                "/api/",
                "/applications",
                "/login",
                "/signup",
                "/onboarding",
                "/profile",
                "/settings",
                "/firms/login",
                "/firms/signup",
                "/firms/onboarding",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
