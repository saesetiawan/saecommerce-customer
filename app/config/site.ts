import { WebsiteSettings, WebsiteSettingsApi } from "@/app/types/website-settings";

type SiteMetadata = {
    description?: string;
    url?: string;
    ogImage?: string;
    keywords?: string[];
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3135/api";

export const siteConfig = {
    name: "LittleJoy",
    tagline: "Kebutuhan bayi, anak, sampai remaja",
    description:
        "Toko online kebutuhan bayi, anak, sampai remaja. Belanja popok, susu, mainan edukasi, pakaian anak, stroller, dan perlengkapan keluarga.",
    url: "https://littlejoy.com",
    ogImage: "https://littlejoy.com/og-image.jpg",
    logoUrl: "",
    faviconUrl: "",
    primaryImageUrl: "",
    secondaryImageUrl: "",
    backgroundImageUrl: "",
    email: "",
    phone: "",
    address: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    primaryColor: "#ec4899",
    secondaryColor: "#06b6d4",
    accentColor: "#06b6d4",
    backgroundColor: "#fff7fb",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    mutedTextColor: "#64748b",
    borderColor: "#e2e8f0",
    keywords: [
        "perlengkapan bayi",
        "kebutuhan anak",
        "toko bayi online",
        "popok bayi",
        "susu anak",
        "mainan edukasi",
        "pakaian anak",
        "stroller bayi",
    ],
};

export type SiteConfig = typeof siteConfig;

export async function getSiteConfig(): Promise<SiteConfig> {
    try {
        const response = await fetch(`${API_BASE_URL}/public/website-settings`, {
            next: {
                revalidate: 60,
            },
        });

        if (!response.ok) {
            return siteConfig;
        }

        const data = await response.json();
        const setting = data?.result as WebsiteSettingsApi | undefined;

        if (!setting) {
            return siteConfig;
        }

        return mapWebsiteSettingToSiteConfig(setting);
    } catch {
        return siteConfig;
    }
}

export function mapWebsiteSettingToSiteConfig(
    setting: WebsiteSettingsApi,
): SiteConfig {
    const metadata = normalizeMetadata(setting.metadata);

    return {
        ...siteConfig,
        name: setting.site_name || siteConfig.name,
        tagline: setting.tagline || siteConfig.tagline,
        description: metadata.description || siteConfig.description,
        url: metadata.url || siteConfig.url,
        ogImage: metadata.ogImage || setting.logo_url || siteConfig.ogImage,
        logoUrl: setting.logo_url || "",
        faviconUrl: setting.favicon_url || "",
        primaryImageUrl: setting.primary_image_url || "",
        secondaryImageUrl: setting.secondary_image_url || "",
        backgroundImageUrl: setting.background_image_url || "",
        email: setting.email || "",
        phone: setting.phone || "",
        address: setting.address || "",
        facebookUrl: setting.facebook_url || "",
        instagramUrl: setting.instagram_url || "",
        tiktokUrl: setting.tiktok_url || "",
        primaryColor: setting.primary_color || siteConfig.primaryColor,
        secondaryColor: setting.secondary_color || setting.accent_color || siteConfig.secondaryColor,
        accentColor: setting.accent_color || siteConfig.accentColor,
        backgroundColor: setting.background_color || siteConfig.backgroundColor,
        surfaceColor: setting.surface_color || siteConfig.surfaceColor,
        textColor: setting.text_color || siteConfig.textColor,
        mutedTextColor: setting.muted_text_color || siteConfig.mutedTextColor,
        borderColor: setting.border_color || siteConfig.borderColor,
        keywords: metadata.keywords?.length ? metadata.keywords : siteConfig.keywords,
    };
}

export function mapSiteConfigToWebsiteSettings(
    config: SiteConfig,
): WebsiteSettings {
    return {
        id: "",
        siteName: config.name,
        tagline: config.tagline,
        logoUrl: config.logoUrl,
        faviconUrl: config.faviconUrl,
        primaryImageUrl: config.primaryImageUrl,
        secondaryImageUrl: config.secondaryImageUrl,
        backgroundImageUrl: config.backgroundImageUrl,
        email: config.email,
        phone: config.phone,
        address: config.address,
        facebookUrl: config.facebookUrl,
        instagramUrl: config.instagramUrl,
        tiktokUrl: config.tiktokUrl,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        backgroundColor: config.backgroundColor,
        surfaceColor: config.surfaceColor,
        textColor: config.textColor,
        mutedTextColor: config.mutedTextColor,
        borderColor: config.borderColor,
        metadata: {
            description: config.description,
            url: config.url,
            ogImage: config.ogImage,
            keywords: config.keywords,
        },
    };
}

function normalizeMetadata(metadata: unknown): SiteMetadata {
    if (!metadata) {
        return {};
    }

    if (typeof metadata === "string") {
        try {
            return JSON.parse(metadata) as SiteMetadata;
        } catch {
            return {};
        }
    }

    if (typeof metadata !== "object") {
        return {};
    }

    const value = metadata as Record<string, unknown>;

    return {
        description:
            typeof value.description === "string"
                ? value.description
                : undefined,
        url:
            typeof value.url === "string"
                ? value.url
                : undefined,
        ogImage:
            typeof value.ogImage === "string"
                ? value.ogImage
                : typeof value.og_image === "string"
                    ? value.og_image
                    : undefined,
        keywords:
            Array.isArray(value.keywords)
                ? value.keywords.filter(
                    (keyword): keyword is string => typeof keyword === "string",
                )
                : undefined,
    };
}
