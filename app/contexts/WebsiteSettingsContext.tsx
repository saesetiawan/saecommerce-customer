"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    defaultWebsiteSettings,
    getPublicWebsiteSettings,
} from "@/app/services/website-settings.service";
import { WebsiteSettings } from "@/app/types/website-settings";

type WebsiteSettingsContextValue = {
    settings: WebsiteSettings;
    loading: boolean;
    refresh: () => Promise<void>;
};

const WebsiteSettingsContext =
    createContext<WebsiteSettingsContextValue | undefined>(undefined);

export function WebsiteSettingsProvider({
    children,
    initialSettings = defaultWebsiteSettings,
}: {
    children: ReactNode;
    initialSettings?: WebsiteSettings;
}) {
    const [settings, setSettings] =
        useState<WebsiteSettings>(initialSettings);
    const [loading, setLoading] =
        useState(true);

    const refresh = async () => {
        try {
            const result = await getPublicWebsiteSettings();
            setSettings(result);
        } catch {
            setSettings(defaultWebsiteSettings);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const value =
        useMemo<WebsiteSettingsContextValue>(() => ({
            settings,
            loading,
            refresh,
        }), [settings, loading]);

    return (
        <WebsiteSettingsContext.Provider value={value}>
            {children}
        </WebsiteSettingsContext.Provider>
    );
}

export function useWebsiteSettings() {
    const context = useContext(WebsiteSettingsContext);

    if (!context) {
        throw new Error(
            "useWebsiteSettings must be used within WebsiteSettingsProvider",
        );
    }

    return context;
}
