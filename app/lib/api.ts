export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3135";

type RequestOptions = RequestInit & {
    token?: string;
};

export async function apiFetch<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const { token, headers, ...restOptions } = options;

    const response = await fetch(`${API_URL}${path}`, {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            "Terjadi kesalahan pada server";

        throw new Error(message);
    }

    return data as T;
}