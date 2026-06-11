import { siteConfig } from "@/app/config/site";
import { api } from "@/app/lib/axios";
import {
    WebsiteSettings,
    WebsiteSettingsApi,
    WebsiteSettingsResponse,
} from "@/app/types/website-settings";

export const defaultWebsiteSettings: WebsiteSettings = {
    id: "",
    siteName: siteConfig.name,
    tagline: siteConfig.tagline,
    logoUrl: siteConfig.logoUrl,
    faviconUrl: siteConfig.faviconUrl,
    primaryImageUrl: siteConfig.primaryImageUrl,
    secondaryImageUrl: siteConfig.secondaryImageUrl,
    backgroundImageUrl: siteConfig.backgroundImageUrl,
    email: siteConfig.email,
    phone: siteConfig.phone,
    address: siteConfig.address,
    facebookUrl: siteConfig.facebookUrl,
    instagramUrl: siteConfig.instagramUrl,
    tiktokUrl: siteConfig.tiktokUrl,
    primaryColor: siteConfig.primaryColor,
    secondaryColor: siteConfig.secondaryColor,
    accentColor: siteConfig.accentColor,
    backgroundColor: siteConfig.backgroundColor,
    surfaceColor: siteConfig.surfaceColor,
    textColor: siteConfig.textColor,
    mutedTextColor: siteConfig.mutedTextColor,
    borderColor: siteConfig.borderColor,
    metadata: {
        description: siteConfig.description,
        url: siteConfig.url,
        ogImage: siteConfig.ogImage,
        keywords: siteConfig.keywords,
    },
};

function mapWebsiteSettingsApi(
    setting: WebsiteSettingsApi,
): WebsiteSettings {
    return {
        id: setting.id,
        siteName: setting.site_name || defaultWebsiteSettings.siteName,
        tagline: setting.tagline || defaultWebsiteSettings.tagline,
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
        primaryColor:
            setting.primary_color || defaultWebsiteSettings.primaryColor,
        secondaryColor:
            setting.secondary_color || defaultWebsiteSettings.secondaryColor,
        accentColor:
            setting.accent_color || defaultWebsiteSettings.accentColor,
        backgroundColor:
            setting.background_color || defaultWebsiteSettings.backgroundColor,
        surfaceColor:
            setting.surface_color || defaultWebsiteSettings.surfaceColor,
        textColor:
            setting.text_color || defaultWebsiteSettings.textColor,
        mutedTextColor:
            setting.muted_text_color || defaultWebsiteSettings.mutedTextColor,
        borderColor:
            setting.border_color || defaultWebsiteSettings.borderColor,
        metadata: setting.metadata,
    };
}

export async function getPublicWebsiteSettings() {
    const response =
        await api.get<WebsiteSettingsResponse>("/public/website-settings");

    return mapWebsiteSettingsApi(response.data.result);
}
