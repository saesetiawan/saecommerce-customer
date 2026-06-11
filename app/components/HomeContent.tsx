"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { ArrowRight, Loader2 } from "lucide-react";

import { theme } from "@/app/config/theme";
import { getPublicWebsiteContents } from "@/app/services/content.service";
import { WebsiteContent } from "@/app/types/content";
import { useWebsiteSettings } from "@/app/contexts/WebsiteSettingsContext";

const fallbackContents: WebsiteContent[] = [
    {
        id: "fallback-hero",
        key: "fallback-hero",
        type: "hero",
        placement: "home",
        title: "Semua kebutuhan bayi sampai remaja dalam satu toko.",
        subtitle: "Promo kebutuhan keluarga",
        body: "Belanja popok, susu, makanan bayi, perlengkapan mandi, mainan edukasi, pakaian anak, sampai perlengkapan sekolah.",
        imageUrl: "",
        linkUrl: "/products",
        linkLabel: "Belanja Sekarang",
        sortOrder: 10,
        isActive: true,
    },
    {
        id: "fallback-banner",
        key: "fallback-banner",
        type: "banner",
        placement: "home",
        title: "Diskon sampai 60%",
        subtitle: "SALE",
        body: "Untuk popok, skincare bayi, mainan, dan perlengkapan harian anak.",
        imageUrl: "",
        linkUrl: "/products",
        linkLabel: "Lihat Promo",
        sortOrder: 20,
        isActive: true,
    },
];

export default function HomeContent() {
    const { settings } = useWebsiteSettings();
    const [contents, setContents] =
        useState<WebsiteContent[]>(fallbackContents);
    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchContents = async () => {
            setIsLoading(true);

            try {
                const response = await getPublicWebsiteContents({
                    placement: "home",
                    limit: 20,
                });

                if (mounted && response.data.length > 0) {
                    setContents(response.data);
                }
            } catch {
                if (mounted) {
                    setContents(fallbackContents);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchContents();

        return () => {
            mounted = false;
        };
    }, []);

    const hero = useMemo(() => {
        return contents.find((item) => item.type === "hero") ?? contents[0];
    }, [contents]);

    const highlights = useMemo(() => {
        return contents
            .filter((item) => item.id !== hero?.id)
            .filter((item) =>
                ["banner", "promo", "announcement", "section"].includes(item.type),
            )
            .slice(0, 3);
    }, [contents, hero?.id]);

    if (!hero) {
        return null;
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-3 min-h-6">
                {isLoading ? (
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${theme.colors.neutral.card} ${theme.colors.neutral.body}`}>
                        <Loader2 size={14} className={`animate-spin ${theme.colors.primary.text}`} />
                        Memuat konten website...
                    </div>
                ) : null}
            </div>

            <div
                className={`grid gap-6 overflow-hidden ${theme.radius.card} ${theme.colors.primary.soft} p-5 sm:p-8 md:grid-cols-[1.2fr_0.8fr] md:items-stretch`}
            >
                <div className="flex flex-col justify-center">
                    <p className={`mb-3 font-semibold ${theme.colors.primary.text}`}>
                        {hero.subtitle || "Promo kebutuhan keluarga"}
                    </p>

                    <h1
                        className={`text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl ${theme.colors.neutral.title}`}
                    >
                        {hero.title}
                    </h1>

                    {hero.body ? (
                        <p className={`mt-5 max-w-xl ${theme.colors.neutral.body}`}>
                            {hero.body}
                        </p>
                    ) : null}

                    {hero.linkUrl ? (
                        <Link
                            href={hero.linkUrl}
                            className={`mt-7 inline-flex w-fit items-center gap-2 px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            {hero.linkLabel || "Lihat Detail"}
                            <ArrowRight size={17} />
                        </Link>
                    ) : null}
                </div>

                <div className={`overflow-hidden rounded-3xl ${theme.colors.neutral.card} ${theme.shadow.card}`}>
                    {hero.imageUrl || settings.primaryImageUrl ? (
                        <div className="relative h-full min-h-[260px] w-full">
                        <Image
                            src={hero.imageUrl || settings.primaryImageUrl}
                            alt={hero.title}
                            fill
                            priority
                            sizes="(min-width: 768px) 40vw, 100vw"
                            className="object-cover"
                        />
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[260px] flex-col justify-center p-6">
                            <p className={`text-sm font-semibold ${theme.colors.danger.text}`}>
                                SALE
                            </p>
                            <h2 className={`mt-2 text-3xl font-bold ${theme.colors.neutral.title}`}>
                                Diskon sampai 60%
                            </h2>
                            <p className={`mt-3 ${theme.colors.neutral.body}`}>
                                Untuk popok, skincare bayi, mainan, dan perlengkapan harian anak.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {highlights.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {highlights.map((item) => (
                        <article
                            key={item.id}
                            className={`overflow-hidden rounded-2xl border shadow-sm ${theme.colors.neutral.border} ${theme.colors.neutral.card}`}
                        >
                            {item.imageUrl || settings.secondaryImageUrl ? (
                                <Image
                                    src={item.imageUrl || settings.secondaryImageUrl}
                                    alt={item.title}
                                    width={480}
                                    height={180}
                                    sizes="(min-width: 768px) 33vw, 100vw"
                                    className="h-36 w-full object-cover"
                                />
                            ) : null}

                            <div className="p-5">
                                <p className={`text-xs font-bold uppercase ${theme.colors.primary.text}`}>
                                    {item.subtitle || item.type}
                                </p>
                                <h2 className={`mt-2 text-lg font-extrabold ${theme.colors.neutral.title}`}>
                                    {item.title}
                                </h2>
                                {item.body ? (
                                    <p className={`mt-2 line-clamp-3 text-sm leading-6 ${theme.colors.neutral.body}`}>
                                        {item.body}
                                    </p>
                                ) : null}
                                {item.linkUrl ? (
                                    <Link
                                        href={item.linkUrl}
                                        className={`mt-4 inline-flex items-center gap-2 text-sm font-bold ${theme.colors.primary.text}`}
                                    >
                                        {item.linkLabel || "Lihat Detail"}
                                        <ArrowRight size={15} />
                                    </Link>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
