
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

export type AuthUser = {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url: string;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken?: string;
    user: AuthUser;
};