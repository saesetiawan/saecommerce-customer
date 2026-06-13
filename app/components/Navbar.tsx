"use client";

import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { useEffect, useState } from "react";
import {
    ChevronDown,
    LogOut,
    MapPin,
    Menu,
    Package,
    Search,
    Settings,
    ShoppingCart,
    User,
    X,
} from "lucide-react";

import { theme } from "@/app/config/theme";
import { Category } from "@/app/types/category";
import { getPublicCategories } from "@/app/services/category.service";
import { UseGetStatusLogged } from "@/app/hooks/useGetStatusLogged";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getUser } from "@/app/services/auth.service";
import OrderNotificationBell from "@/app/components/OrderNotificationBell";
import { useCart } from "@/app/contexts/CartContext";
import { notifyAuthChanged, notifyNotificationsChanged } from "@/app/lib/cart-events";
import { useWebsiteSettings } from "@/app/contexts/WebsiteSettingsContext";
import { clearOrderNotifications } from "@/app/services/notification.service";
import {
    registerFirebaseNotificationToken,
    showBrowserNotification,
    showBrowserNotificationFromPayload,
    subscribeForegroundNotifications,
    unregisterFirebaseNotificationToken,
} from "@/app/lib/firebase-notifications";
import { toast } from "sonner";

type PushPayload = {
    data?: {
        order_number?: string;
    };
    order_number?: string;
};

function refreshCustomerOrderDetailFromPushPayload(payload: PushPayload) {
    const orderNumber =
        payload?.data?.order_number ||
        payload?.order_number;

    if (
        typeof orderNumber === "string" &&
        window.location.pathname === `/orders/${orderNumber}`
    ) {
        window.dispatchEvent(
            new CustomEvent("customer-order-detail-refresh", {
                detail: {
                    orderNumber,
                },
            }),
        );
    }
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const { isLoggedIn } = UseGetStatusLogged(pathname);
    const { cartCount } = useCart();
    const { settings } = useWebsiteSettings();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const user = getUser();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getPublicCategories({
                    page: 1,
                    limit: 20,
                    orderBy: "name",
                    searchBy: "name",
                    search: "",
                    orderType: "desc",
                });

                setCategories(response.data);
            } catch {
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        let unsubscribe: () => void = () => undefined;
        let isMounted = true;

        void registerFirebaseNotificationToken();
        void subscribeForegroundNotifications((payload) => {
            if (!isMounted) {
                return;
            }

            const title =
                payload.notification?.title ||
                payload.data?.title ||
                "Notifikasi baru";
            const description =
                payload.notification?.body ||
                payload.data?.message ||
                "";

            toast.success(title, {
                description,
            });
            showBrowserNotificationFromPayload(payload);
            notifyNotificationsChanged();
            notifyAuthChanged();
            refreshCustomerOrderDetailFromPushPayload(payload);
        }).then((handler) => {
            unsubscribe = handler;
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn || typeof navigator === "undefined" || !navigator.serviceWorker) {
            return;
        }

        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type !== "FCM_PUSH_RECEIVED") {
                return;
            }

            notifyNotificationsChanged();
            refreshCustomerOrderDetailFromPushPayload(event.data.payload);

            if (
                event.data.payload.notification_displayed_by_service_worker ||
                event.data.payload.notification_handled_by_visible_client
            ) {
                return;
            }

            showBrowserNotification({
                title: event.data.payload.title || "Notifikasi baru",
                message: event.data.payload.data?.message || "",
                data: event.data.payload.data,
                icon: event.data.payload.data?.icon,
                badge: event.data.payload.data?.badge,
            });
        };

        navigator.serviceWorker.addEventListener(
            "message",
            handleServiceWorkerMessage,
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "message",
                handleServiceWorkerMessage,
            );
        };
    }, [isLoggedIn]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const keyword = searchKeyword.trim();

        setIsMobileMenuOpen(false);

        if (!keyword) {
            router.push("/products");
            return;
        }

        router.push(`/products?search=${encodeURIComponent(keyword)}`);
    };

    const logoutHandler = async () => {
        await unregisterFirebaseNotificationToken();

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        clearOrderNotifications();

        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        notifyAuthChanged();

        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);

        router.push("/login");
        router.refresh();
    };

    const userName = user?.full_name || "User";
    const userEmail = user?.email || "customer@email.com";
    const avatarLetter = userName.charAt(0).toUpperCase();

    return (
        <header
            className={`sticky top-0 z-50 border-b ${theme.colors.neutral.header} ${theme.colors.neutral.border}`}
        >
            <div className="app-container-wide">
                {/* TOP NAV */}
                <div className="flex items-center justify-between gap-3 py-4">
                    {/* LEFT */}
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((value) => !value)}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center lg:hidden ${theme.radius.pill} ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                            aria-label="Open menu"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <Link
                            href="/"
                            className="flex min-w-0 items-center gap-3"
                        >
                            {settings.logoUrl ? (
                                <Image
                                    src={settings.logoUrl}
                                    alt={settings.siteName}
                                    width={44}
                                    height={44}
                                    priority
                                    className="h-10 w-10 shrink-0 rounded-xl object-contain sm:h-11 sm:w-11"
                                />
                            ) : null}

                            <div className="min-w-0">
                                <h1
                                    className={`truncate text-xl font-extrabold sm:text-2xl ${theme.colors.primary.text}`}
                                >
                                    {settings.siteName}
                                </h1>

                                <p
                                    className={`hidden truncate text-xs lg:block ${theme.colors.neutral.muted}`}
                                >
                                    {settings.tagline}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* DESKTOP SEARCH */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="hidden flex-1 md:block"
                    >
                        <div
                            className={`mx-auto flex max-w-2xl items-center gap-3 rounded-full border px-4 py-2.5 ${theme.colors.neutral.input}`}
                        >
                            <Search size={18} className="shrink-0 text-slate-400" />

                            <input
                                type="search"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                placeholder="Cari popok, susu, mainan, pakaian anak..."
                                className="w-full bg-transparent text-sm outline-none"
                            />

                            <button
                                type="submit"
                                className={`rounded-full px-5 py-2 text-sm font-bold text-white ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                            >
                                Cari
                            </button>
                        </div>
                    </form>

                    {/* RIGHT */}
                    <div className="flex shrink-0 items-center gap-2 lg:gap-3">
                        <Link
                            href="/products"
                            className={`rounded-full hover:text-white hidden px-4 py-2 text-sm font-semibold md:block ${theme.colors.neutral.body} ${theme.colors.primary.hover}`}
                        >
                            Produk
                        </Link>

                        {!isLoggedIn ? (
                            <>
                                <Link
                                    href="/login"
                                    className={`hidden px-4 py-2 text-sm font-semibold md:block ${theme.colors.primary.text}`}
                                >
                                    Masuk
                                </Link>

                                <Link
                                    href="/register"
                                    className={`hidden px-5 py-2 text-sm font-bold text-white md:block ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Daftar
                                </Link>

                                <Link
                                    href="/login"
                                    className={`flex h-10 w-10 items-center justify-center md:hidden ${theme.radius.pill} ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                    aria-label="Login"
                                >
                                    <User size={20} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <OrderNotificationBell enabled={isLoggedIn} />

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen((value) => !value)}
                                        className={`flex items-center gap-2 px-2 py-2 sm:px-3 ${theme.radius.pill} ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${theme.colors.primary.bg}`}
                                        >
                                            {avatarLetter}
                                        </div>

                                        <span className="hidden max-w-28 truncate text-sm font-bold sm:block">
                    {userName}
                  </span>

                                        <ChevronDown size={16} />
                                    </button>

                                    {isUserMenuOpen ? (
                                        <div
                                            className={`absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border shadow-lg ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                        >
                                            <div className="border-b border-slate-100 p-4">
                                                <p className={`font-bold ${theme.colors.neutral.title}`}>
                                                    {userName}
                                                </p>

                                                <p
                                                    className={`truncate text-sm ${theme.colors.neutral.body}`}
                                                >
                                                    {userEmail}
                                                </p>
                                            </div>

                                            <div className="p-2">
                                                <Link
                                                    href="/orders"
                                                    prefetch={false}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                                >
                                                    <Package size={18} />
                                                    Pesanan Saya
                                                </Link>

                                                <Link
                                                    href="/account/address"
                                                    prefetch={false}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                                >
                                                    <MapPin size={18} />
                                                    Alamat
                                                </Link>

                                                <Link
                                                    href="/account/settings"
                                                    prefetch={false}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                                >
                                                    <Settings size={18} />
                                                    Pengaturan Akun
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={logoutHandler}
                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-500 ${theme.colors.primary.hover} hover:text-white`}
                                                >
                                                    <LogOut size={18} />
                                                    Keluar
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        )}

                        <Link
                            href="/cart"
                            className={`relative flex h-10 w-10 items-center justify-center text-white ${theme.radius.pill} ${theme.colors.primary.bg}`}
                            aria-label="Cart"
                        >
                            <ShoppingCart size={20} />

                            {cartCount > 0 ? (
                                <span className={`absolute -right-1 -top-1 min-w-5 rounded-full ${theme.colors.primary.bg} ${theme.colors.primary.hover} px-1.5 text-center text-xs font-bold leading-5 `}>
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            ) : null}
                        </Link>
                    </div>
                </div>

                {/* MOBILE SEARCH */}
                <form onSubmit={handleSearchSubmit} className="pb-4 md:hidden">
                    <div
                        className={`flex items-center gap-3 rounded-full border px-4 py-2.5 ${theme.colors.neutral.input}`}
                    >
                        <Search size={18} className="shrink-0 text-slate-400" />

                        <input
                            type="search"
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                            placeholder="Cari produk anak..."
                            className="w-full bg-transparent text-sm outline-none"
                        />

                        <button
                            type="submit"
                            className={`rounded-full px-4 py-2 text-xs font-bold text-white ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Cari
                        </button>
                    </div>
                </form>

                {/* MOBILE MENU */}
                {isMobileMenuOpen ? (
                    <div className="pb-4 lg:hidden">
                        <div
                            className={`overflow-hidden rounded-2xl border shadow-sm ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                        >
                            <div className="p-2">
                                <Link
                                    href="/products"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`block rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Semua Produk
                                </Link>

                                <Link
                                    href="/categories"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`block rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Semua Kategori
                                </Link>

                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/categories/${category.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.primary.hover}`}
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 p-2">
                                {!isLoggedIn ? (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`block rounded-xl px-4 py-3 text-sm font-bold ${theme.colors.primary.text} hover:bg-pink-50`}
                                        >
                                            Masuk
                                        </Link>

                                        <Link
                                            href="/register"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`mt-2 block rounded-xl px-4 py-3 text-center text-sm font-bold text-white ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                        >
                                            Daftar
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/orders"
                                            prefetch={false}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                        >
                                            <Package size={18} />
                                            Pesanan Saya
                                        </Link>

                                        <Link
                                            href="/account/address"
                                            prefetch={false}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                        >
                                            <MapPin size={18} />
                                            Alamat
                                        </Link>

                                        <Link
                                            href="/account/settings"
                                            prefetch={false}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${theme.colors.neutral.body} ${theme.colors.primary.hover} hover:text-white`}
                                        >
                                            <Settings size={18} />
                                            Pengaturan Akun
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={logoutHandler}
                                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-500 ${theme.colors.primary.hover} hover:text-white`}
                                        >
                                            <LogOut size={18} />
                                            Keluar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* CATEGORY BAR - DESKTOP */}
            <div className="hidden border-t border-slate-100 bg-white md:block">
                <div className="app-container-wide flex gap-5 overflow-x-auto py-3">
                    <Link
                        href="/products"
                        className={`whitespace-nowrap text-sm font-semibold ${theme.colors.primary.text}`}
                    >
                        Semua Produk
                    </Link>

                    {categories.map((category) => {
                        return (
                            <Link
                                key={category.id}
                                href={`/categories/${category.slug}`}
                                className={`whitespace-nowrap text-sm font-medium ${theme.colors.neutral.body} hover:${theme.colors.primary.text}`}
                            >
                                {category.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
