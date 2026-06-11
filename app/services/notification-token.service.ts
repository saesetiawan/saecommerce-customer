import { api } from "@/app/lib/axios";

export type RegisterNotificationTokenPayload = {
    token: string;
    provider?: string;
    platform?: string;
    device_id?: string;
};

export async function registerNotificationToken(
    payload: RegisterNotificationTokenPayload,
) {
    const response = await api.post("/notification-tokens", {
        provider: "firebase",
        platform: "web",
        ...payload,
    });

    return response.data;
}

export async function unregisterNotificationToken(token: string) {
    if (!token) {
        return;
    }

    const response = await api.delete("/notification-tokens", {
        data: {
            token,
            provider: "firebase",
        },
    });

    return response.data;
}
