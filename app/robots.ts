import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/app/config/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
    const siteConfig = await getSiteConfig();

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/checkout", "/cart", "/account", "/orders"],
        },
        sitemap: `${siteConfig.url}/sitemap.xml`,
    };
}
