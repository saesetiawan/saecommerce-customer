import Cookies from "js-cookie";
import { api } from "@/app/lib/axios";
import { notifyAuthChanged } from "@/app/lib/cart-events";
import { clearOrderNotifications } from "@/app/services/notification.service";
import { unregisterFirebaseNotificationToken } from "@/app/lib/firebase-notifications";

export type AuthUser = {
    id?: string;
    full_name: string;
    email: string;
    phone?: string;
    birth_date?: string;
    avatar_url?: string;
    promo_notification_enabled?: boolean;
    order_notification_enabled?: boolean;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    full_name: string;
    phone: string;
    email: string;
    password: string;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken?: string;
    user: AuthUser;
};

export type CustomerProfile = AuthUser;

export type UpdateCustomerProfilePayload = {
    full_name: string;
    email: string;
    phone: string;
    birth_date?: string;
    promo_notification_enabled: boolean;
    order_notification_enabled: boolean;
};

export type ChangeCustomerPasswordPayload = {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
};

type CustomerProfileResponse = {
    responseMessage?: string;
    responseCode?: string;
    result?: CustomerProfile;
    data?: CustomerProfile;
    user?: CustomerProfile;
} & Partial<CustomerProfile>;

type ChangePasswordResponse = {
    responseMessage?: string;
    responseCode?: string;
    message?: string;
};

const CUSTOMER_PROFILE_ENDPOINT =
    process.env.NEXT_PUBLIC_CUSTOMER_PROFILE_ENDPOINT ?? "/customer/profile";
const CUSTOMER_PASSWORD_ENDPOINT =
    process.env.NEXT_PUBLIC_CUSTOMER_PASSWORD_ENDPOINT ?? "/customer/password";

function normalizeCustomerProfile(response: CustomerProfileResponse): CustomerProfile {
    const profile = response.result ?? response.data ?? response.user ?? response;

    return {
        id: profile.id,
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        birth_date: profile.birth_date ?? "",
        avatar_url: profile.avatar_url ?? "",
        promo_notification_enabled: profile.promo_notification_enabled ?? true,
        order_notification_enabled: profile.order_notification_enabled ?? true,
    };
}

function saveUserProfile(user: CustomerProfile) {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem("user", JSON.stringify(user));
}

export async function login(payload: LoginPayload) {
    const response = await api.post<AuthResponse>("/customer/login", payload);
    return response.data;
}

export async function register(payload: RegisterPayload) {
    const response = await api.post<AuthResponse>("/customer/register", payload);
    return response.data;
}

export async function getCustomerProfile() {
    const response = await api.get<CustomerProfileResponse>(CUSTOMER_PROFILE_ENDPOINT);
    const profile = normalizeCustomerProfile(response.data);

    saveUserProfile(profile);

    return profile;
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload) {
    const response = await api.put<CustomerProfileResponse>(
        CUSTOMER_PROFILE_ENDPOINT,
        payload,
    );
    const profile = normalizeCustomerProfile(response.data);

    saveUserProfile(profile);

    return profile;
}

export async function changeCustomerPassword(payload: ChangeCustomerPasswordPayload) {
    const response = await api.patch<ChangePasswordResponse>(
        CUSTOMER_PASSWORD_ENDPOINT,
        payload,
    );

    return response.data;
}

export function getAccessToken() {
    if (typeof window === "undefined") {
        return undefined;
    }

    return localStorage.getItem("accessToken") ?? Cookies.get("access_token");
}

export function getUser(): AuthUser | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const user = localStorage.getItem("user");

    if (!user) {
        return undefined;
    }

    try {
        const parsedUser = JSON.parse(user);

        return {
            id: parsedUser.id ?? "",
            full_name: parsedUser.full_name ?? parsedUser.name ?? "",
            email: parsedUser.email ?? "",
            phone: parsedUser.phone ?? "",
            birth_date: parsedUser.birth_date ?? "",
            avatar_url: parsedUser.avatar_url ?? "",
            promo_notification_enabled:
                parsedUser.promo_notification_enabled ?? true,
            order_notification_enabled:
                parsedUser.order_notification_enabled ?? true,
        };
    } catch {
        return undefined;
    }
}

export function saveAuth(response: AuthResponse) {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem("accessToken", response.accessToken);
    saveUserProfile(response.user);

    Cookies.set("access_token", response.accessToken, {
        expires: 7,
        sameSite: "lax",
    });

    if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);

        Cookies.set("refresh_token", response.refreshToken, {
            expires: 30,
            sameSite: "lax",
        });
    }

    notifyAuthChanged();
}

export function logout() {
    if (typeof window === "undefined") {
        return;
    }

    void unregisterFirebaseNotificationToken();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    clearOrderNotifications();

    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    notifyAuthChanged();
}
