import { getSiteConfig } from "@/app/config/site";

export const theme = {
    brand: {
        name: "LittleJoy",
        tagline: "Kebutuhan bayi, anak, sampai remaja",
        logoUrl: "",
        faviconUrl: "",
    },
    tokens: {
        primaryColor: "#ec4899",
        secondaryColor: "#06b6d4",
        accentColor: "#06b6d4",
        backgroundColor: "#fff7fb",
        surfaceColor: "#ffffff",
        textColor: "#0f172a",
        mutedTextColor: "#64748b",
        borderColor: "#e2e8f0",
    },

    colors: {
        primary: {
            bg: "bg-[var(--ecommerce-primary)]",
            hover: "hover:bg-[var(--ecommerce-primary-strong)]",
            text: "text-[var(--ecommerce-primary)]",
            border: "border-[var(--ecommerce-primary)]",
            soft: "bg-[var(--ecommerce-primary-soft)]",
            ring: "focus:ring-[var(--ecommerce-primary-soft)]",
        },

        secondary: {
            bg: "bg-[var(--ecommerce-secondary)]",
            hover: "hover:bg-[var(--ecommerce-secondary-strong)]",
            text: "text-[var(--ecommerce-secondary)]",
            border: "border-[var(--ecommerce-secondary)]",
            soft: "bg-[var(--ecommerce-secondary-soft)]",
        },

        accent: {
            bg: "bg-[var(--ecommerce-accent)]",
            hover: "hover:bg-[var(--ecommerce-accent-strong)]",
            text: "text-[var(--ecommerce-accent)]",
            border: "border-[var(--ecommerce-accent)]",
            soft: "bg-[var(--ecommerce-accent-soft)]",
        },

        danger: {
            bg: "bg-red-500",
            hover: "hover:bg-red-600",
            text: "text-red-600",
            soft: "bg-red-50",
        },
        neutral: {
            page: "bg-[var(--ecommerce-background)]",
            header: "bg-[var(--ecommerce-surface)]",
            card: "bg-[var(--ecommerce-surface)]",
            title: "text-[var(--ecommerce-text)]",
            body: "text-[var(--ecommerce-muted-text)]",
            muted: "text-[var(--ecommerce-muted-text)]",
            border: "border-[var(--ecommerce-border)]",
            input: "bg-[var(--ecommerce-surface)] border-[var(--ecommerce-border)]",
        }
    },

    radius: {
        card: "rounded-2xl",
        button: "rounded-xl",
        pill: "rounded-full",
    },

    shadow: {
        card: "shadow-sm hover:shadow-md",
        header: "shadow-sm",
    },
};

export type ThemeConfig = typeof theme;

export async function getThemeConfig(): Promise<ThemeConfig> {
    const site = await getSiteConfig();

    return {
        ...theme,
        brand: {
            name: site.name,
            tagline: site.tagline,
            logoUrl: site.logoUrl,
            faviconUrl: site.faviconUrl,
        },
        tokens: {
            primaryColor: site.primaryColor,
            secondaryColor: site.secondaryColor,
            accentColor: site.accentColor,
            backgroundColor: site.backgroundColor,
            surfaceColor: site.surfaceColor,
            textColor: site.textColor,
            mutedTextColor: site.mutedTextColor,
            borderColor: site.borderColor,
        },
    };
}
