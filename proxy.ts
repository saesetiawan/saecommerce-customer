import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/checkout", "/orders", "/account", "/cart"];

const authRoutes = ["/login", "/register"];

function isProtectedRoute(pathname: string) {
    return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string) {
    return authRoutes.some((route) => pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("access_token")?.value;
    const isLoggedIn = Boolean(accessToken);

    if (isProtectedRoute(pathname) && !isLoggedIn) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);

        return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute(pathname) && isLoggedIn) {
        return NextResponse.redirect(new URL("/products", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/checkout/:path*",
        "/orders/:path*",
        "/account/:path*",
        "/cart/:path*",
        "/login",
        "/register",
    ],
};