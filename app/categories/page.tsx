import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/app/products/PageClient";
import { getSiteConfig } from "@/app/config/site";

export async function generateMetadata(): Promise<Metadata> {
    const siteConfig = await getSiteConfig();

    return {
        title: "Semua Kategori",
        description:
            "Jelajahi kategori produk untuk kebutuhan bayi, anak, dan remaja.",
        alternates: {
            canonical: `${siteConfig.url}/categories`,
        },
        openGraph: {
            title: "Semua Kategori",
            description:
                `Jelajahi kategori produk di ${siteConfig.name}.`,
            url: `${siteConfig.url}/categories`,
            siteName: siteConfig.name,
            images: [siteConfig.ogImage],
        },
    };
}

export default function ProductsPage() {
    return (
        <Suspense fallback={null}>
            <ProductsClient />
        </Suspense>
    );
}
