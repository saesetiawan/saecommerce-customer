import type { Metadata } from "next";
import { getSiteConfig } from "@/app/config/site";
import CategoryClient from "@/app/categories/[slug]/CategoryClient";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

function formatCategoryTitle(slug: string) {
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const siteConfig = await getSiteConfig();

    const categoryTitle = formatCategoryTitle(slug);

    return {
        title: `${categoryTitle} Terbaik`,
        description: `Belanja ${categoryTitle.toLowerCase()} untuk kebutuhan bayi, anak, dan remaja. Produk pilihan keluarga dengan harga terbaik.`,
        alternates: {
            canonical: `${siteConfig.url}/categories/${slug}`,
        },
        openGraph: {
            title: `${categoryTitle} Terbaik`,
            description: `Belanja ${categoryTitle.toLowerCase()} untuk kebutuhan keluarga di ${siteConfig.name}.`,
            url: `${siteConfig.url}/categories/${slug}`,
            siteName: siteConfig.name,
            images: [siteConfig.ogImage],
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;

    return <CategoryClient slug={slug} />;
}
