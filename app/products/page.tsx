import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/app/products/PageClient";
import { getSiteConfig } from "@/app/config/site";

export async function generateMetadata(): Promise<Metadata> {
    const siteConfig = await getSiteConfig();

    return {
        title: "Semua Produk",
        description:
            "Belanja semua kebutuhan bayi, anak, dan remaja seperti popok, susu, mainan, pakaian anak, stroller, dan perlengkapan sekolah.",
        alternates: {
            canonical: `${siteConfig.url}/products`,
        },
        openGraph: {
            title: "Semua Produk",
            description:
                `Belanja semua kebutuhan bayi, anak, dan remaja di ${siteConfig.name}.`,
            url: `${siteConfig.url}/products`,
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
