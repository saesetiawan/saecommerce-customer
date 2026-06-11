import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/app/config/site";
import { products } from "@/app/data/products";
import { categories } from "@/app/data/categories";
import { toSlug } from "@/app/utils/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteConfig = await getSiteConfig();

    const staticRoutes = ["", "/products", "/login", "/register"].map((route) => ({
        url: `${siteConfig.url}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    const productRoutes = products.map((product) => ({
        url: `${siteConfig.url}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
    }));

    const categoryRoutes = categories.map((category) => ({
        url: `${siteConfig.url}/categories/${toSlug(category)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
