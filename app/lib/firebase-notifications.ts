import { initializeApp, getApps } from "firebase/app";
import {
    getMessaging,
    getToken,
    isSupported,
    MessagePayload,
    onMessage,
} from "firebase/messaging";

import {
    registerNotificationToken,
    unregisterNotificationToken,
} from "@/app/services/notification-token.service";

const TOKEN_STORAGE_KEY = "firebase_notification_token";
const DEFAULT_NOTIFICATION_ICON = "/favicon.ico";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

function isFirebaseConfigured() {
    return Boolean(
        firebaseConfig.apiKey &&
            firebaseConfig.projectId &&
            firebaseConfig.messagingSenderId &&
            firebaseConfig.appId &&
            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    );
}

function getFirebaseApp() {
    if (!isFirebaseConfigured()) {
        return null;
    }

    return getApps()[0] || initializeApp(firebaseConfig);
}

async function getServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) {
        return undefined;
    }

    const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
            updateViaCache: "none",
        },
    );
    await registration.update();

    return registration;
}

export async function registerFirebaseNotificationToken() {
    if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !isFirebaseConfigured() ||
        !(await isSupported())
    ) {
        return null;
    }

    if (Notification.permission === "denied") {
        return null;
    }

    const permission =
        Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

    if (permission !== "granted") {
        return null;
    }

    const app = getFirebaseApp();
    if (!app) {
        return null;
    }

    const messaging = getMessaging(app);
    const registration = await getServiceWorkerRegistration();
    const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
    });

    if (!token) {
        return null;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    await registerNotificationToken({
        token,
        device_id: getBrowserDeviceID(),
    });

    return token;
}

export async function unregisterFirebaseNotificationToken() {
    if (typeof window === "undefined") {
        return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
        return;
    }

    try {
        await unregisterNotificationToken(token);
    } finally {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

export async function subscribeForegroundNotifications(
    callback: (payload: MessagePayload) => void,
) {
    if (
        typeof window === "undefined" ||
        !isFirebaseConfigured() ||
        !(await isSupported())
    ) {
        return () => undefined;
    }

    const app = getFirebaseApp();
    if (!app) {
        return () => undefined;
    }

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
}

export function showBrowserNotificationFromPayload(payload: MessagePayload) {
    const title =
        payload.notification?.title ||
        payload.data?.title ||
        "Notifikasi baru";
    const message =
        payload.notification?.body ||
        payload.data?.message ||
        "";

    showBrowserNotification({
        title,
        message,
        data: payload.data,
        icon: payload.data?.icon,
        badge: payload.data?.badge,
    });
}

export function showBrowserNotification(options: {
    title: string;
    message?: string;
    data?: Record<string, string>;
    icon?: string;
    badge?: string;
}) {
    if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const notificationOptions: NotificationOptions = {
        body: options.message || "",
        icon: options.icon || DEFAULT_NOTIFICATION_ICON,
        badge: options.badge || DEFAULT_NOTIFICATION_ICON,
        data: sanitizeNotificationData(options.data),
        tag:
            options.data?.notification_id ||
            options.data?.order_number ||
            "ecommerce-notification",
    };

    showFallbackNotification(options.title, notificationOptions);
}

function showFallbackNotification(
    title: string,
    options: NotificationOptions,
) {
    const notification = new Notification(title, options);

    notification.onclick = () => {
        window.focus();

        const data = options.data as Record<string, string> | undefined;
        const link = getNotificationTargetUrl(data);

        if (link) {
            window.location.assign(link);
        }

        notification.close();
    };
}

function getNotificationTargetUrl(data?: Record<string, string>) {
    if (data?.order_number) {
        return `/orders/${data.order_number}`;
    }

    if (!data?.link || typeof window === "undefined") {
        return "";
    }

    try {
        const url = new URL(data.link, window.location.origin);

        if (url.origin !== window.location.origin) {
            return "";
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return "";
    }
}

function sanitizeNotificationData(data?: Record<string, string>) {
    if (!data) {
        return undefined;
    }

    const nextData = { ...data };
    const safeLink = getNotificationTargetUrl(data);

    if (safeLink) {
        nextData.link = safeLink;
    } else {
        delete nextData.link;
    }

    return nextData;
}

function getBrowserDeviceID() {
    const key = "browser_device_id";
    const existing = localStorage.getItem(key);
    if (existing) {
        return existing;
    }

    const value =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(key, value);

    return value;
}
