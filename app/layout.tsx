import type { Metadata } from "next";
import type { CSSProperties } from "react";
import {
  getSiteConfig,
  mapSiteConfigToWebsiteSettings,
} from "@/app/config/site";
import "./globals.css";
import { Toaster } from "sonner";
import { CartProvider } from "@/app/contexts/CartContext";
import { WebsiteSettingsProvider } from "@/app/contexts/WebsiteSettingsContext";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const title = `${siteConfig.name} - ${siteConfig.tagline}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    icons: {
      icon: siteConfig.faviconUrl || undefined,
      shortcut: siteConfig.faviconUrl || undefined,
      apple: siteConfig.faviconUrl || undefined,
    },
    openGraph: {
      title,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: siteConfig.url,
    },
  };
}

export default async function RootLayout({
                                           children,
                                         }: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
      <html lang="id">
      <body style={buildThemeStyle(siteConfig)}>
        <WebsiteSettingsProvider
            initialSettings={mapSiteConfigToWebsiteSettings(siteConfig)}
        >
          <CartProvider>
            {children}
            <Toaster
                position="top-right"
                richColors
                closeButton
            />
          </CartProvider>
        </WebsiteSettingsProvider>
      </body>
      </html>
  );
}

function buildThemeStyle(
    siteConfig: Awaited<ReturnType<typeof getSiteConfig>>,
): CSSProperties {
  return {
    "--ecommerce-primary": siteConfig.primaryColor,
    "--ecommerce-primary-strong": siteConfig.primaryColor,
    "--ecommerce-primary-soft": `color-mix(in srgb, ${siteConfig.primaryColor} 12%, white)`,
    "--ecommerce-secondary": siteConfig.secondaryColor,
    "--ecommerce-secondary-strong": siteConfig.secondaryColor,
    "--ecommerce-secondary-soft": `color-mix(in srgb, ${siteConfig.secondaryColor} 12%, white)`,
    "--ecommerce-accent": siteConfig.accentColor,
    "--ecommerce-accent-strong": siteConfig.accentColor,
    "--ecommerce-accent-soft": `color-mix(in srgb, ${siteConfig.accentColor} 16%, white)`,
    "--ecommerce-background": siteConfig.backgroundColor,
    "--ecommerce-background-image": siteConfig.backgroundImageUrl
        ? `url("${siteConfig.backgroundImageUrl}")`
        : "none",
    "--ecommerce-surface": siteConfig.surfaceColor,
    "--ecommerce-text": siteConfig.textColor,
    "--ecommerce-muted-text": siteConfig.mutedTextColor,
    "--ecommerce-border": siteConfig.borderColor,
  } as CSSProperties;
}
