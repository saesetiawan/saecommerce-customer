import axios, {
    AxiosError,
    AxiosRequestHeaders,
    InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3135/api";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_ENDPOINT =
    process.env.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT ?? "/refresh-token";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

type RefreshTokenResponse = {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    result?: {
        accessToken?: string;
        refreshToken?: string;
        access_token?: string;
        refresh_token?: string;
    };
};

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 2 * 60 * 1000,
    headers: {
        "Content-Type": "application/json",
    },
});

const refreshApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 2 * 60 * 1000,
    headers: {
        "Content-Type": "application/json",
    },
});

let isLoggingOut = false;
let refreshTokenPromise: Promise<string> | null = null;

function getAccessToken() {
    if (typeof window === "undefined") {
        return undefined;
    }

    return localStorage.getItem(ACCESS_TOKEN_KEY) || Cookies.get(ACCESS_TOKEN_COOKIE);
}

function getRefreshToken() {
    if (typeof window === "undefined") {
        return undefined;
    }

    return localStorage.getItem(REFRESH_TOKEN_KEY) || Cookies.get(REFRESH_TOKEN_COOKIE);
}

function setAccessToken(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
        expires: 7,
        sameSite: "lax",
    });
}

function setRefreshToken(refreshToken: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        expires: 30,
        sameSite: "lax",
    });
}

function removeAuth() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("user");

    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
}

function extractTokenPayload(response: RefreshTokenResponse) {
    const payload = response.result ?? response;

    return {
        accessToken: payload.accessToken ?? payload.access_token,
        refreshToken: payload.refreshToken ?? payload.refresh_token,
    };
}

function logoutAndRedirect() {
    if (typeof window === "undefined" || isLoggingOut) {
        return;
    }

    isLoggingOut = true;

    removeAuth();

    const currentPath = window.location.pathname + window.location.search;

    if (window.location.pathname !== "/login") {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error("Refresh token tidak tersedia.");
    }

    if (!refreshTokenPromise) {
        refreshTokenPromise = refreshApi
            .post<RefreshTokenResponse>(REFRESH_TOKEN_ENDPOINT, {
                refreshToken,
                refresh_token: refreshToken,
            })
            .then((response) => {
                const tokenPayload = extractTokenPayload(response.data);

                if (!tokenPayload.accessToken) {
                    throw new Error("Access token baru tidak tersedia.");
                }

                setAccessToken(tokenPayload.accessToken);

                if (tokenPayload.refreshToken) {
                    setRefreshToken(tokenPayload.refreshToken);
                }

                return tokenPayload.accessToken;
            })
            .finally(() => {
                refreshTokenPromise = null;
            });
    }

    return refreshTokenPromise;
}

api.interceptors.request.use((config) => {
    if (typeof window === "undefined") {
        return config;
    }

    const accessToken = getAccessToken();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as RetriableRequestConfig | undefined;

        if (
            typeof window === "undefined" ||
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest.url?.includes(REFRESH_TOKEN_ENDPOINT) ||
            originalRequest.url?.includes("/customer/login") ||
            originalRequest.url?.includes("/customer/register")
        ) {
            if (status === 401) {
                logoutAndRedirect();
            }

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const accessToken = await refreshAccessToken();

            originalRequest.headers = originalRequest.headers ?? ({} as AxiosRequestHeaders);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            logoutAndRedirect();

            return Promise.reject(refreshError);
        }
    },
);
