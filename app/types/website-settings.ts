export type WebsiteSettingsApi = {
    id: string;
    site_name: string;
    tagline?: string;
    logo_url?: string;
    favicon_url?: string;
    primary_image_url?: string;
    secondary_image_url?: string;
    background_image_url?: string;
    email?: string;
    phone?: string;
    address?: string;
    facebook_url?: string;
    instagram_url?: string;
    tiktok_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    surface_color?: string;
    text_color?: string;
    muted_text_color?: string;
    border_color?: string;
    metadata?: unknown;
};

export type WebsiteSettings = {
    id: string;
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    primaryImageUrl: string;
    secondaryImageUrl: string;
    backgroundImageUrl: string;
    email: string;
    phone: string;
    address: string;
    facebookUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
    metadata?: unknown;
};

export type WebsiteSettingsResponse = {
    result: WebsiteSettingsApi;
};
