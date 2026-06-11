"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, CreditCard, PackageCheck, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
    CustomerNotification,
    getStoredOrderNotifications,
    markAllOrderNotificationsRead,
    markOrderNotificationRead,
    syncOrderNotifications,
} from "@/app/services/notification.service";
import { AUTH_CHANGED_EVENT, NOTIFICATIONS_CHANGED_EVENT } from "@/app/lib/cart-events";
import { theme } from "@/app/config/theme";

type Props = {
    enabled: boolean;
};

function formatRelativeTime(value: string) {
    const date = new Date(value);
    const diffInSeconds = Math.max(
        Math.floor((Date.now() - date.getTime()) / 1000),
        0,
    );

    if (diffInSeconds < 60) {
        return "Baru saja";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
        return `${diffInMinutes} menit lalu`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
        return `${diffInHours} jam lalu`;
    }

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getIcon(notification: CustomerNotification) {
    if (notification.variant === "success") {
        return <PackageCheck size={18} />;
    }

    if (notification.variant === "warning") {
        return <CreditCard size={18} />;
    }

    if (notification.variant === "danger") {
        return <XCircle size={18} />;
    }

    return <Truck size={18} />;
}

function getIconClass(notification: CustomerNotification) {
    if (notification.variant === "success") {
        return "bg-emerald-50 text-emerald-600";
    }

    if (notification.variant === "warning") {
        return "bg-orange-50 text-orange-600";
    }

    if (notification.variant === "danger") {
        return "bg-red-50 text-red-600";
    }

    return "bg-cyan-50 text-cyan-600";
}

function showOrderToast(notification: CustomerNotification) {
    const description = notification.message;

    if (notification.variant === "success") {
        toast.success(notification.title, { description });
        return;
    }

    if (notification.variant === "danger") {
        toast.error(notification.title, { description });
        return;
    }

    toast.info(notification.title, { description });
}

export default function OrderNotificationBell({ enabled }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<CustomerNotification[]>(() =>
        enabled ? getStoredOrderNotifications() : [],
    );
    const hasHydrated = useRef(false);
    const isSyncing = useRef(false);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.isRead).length,
        [notifications],
    );

    const syncNotifications = useCallback(async () => {
        if (!enabled || isSyncing.current) {
            return;
        }

        isSyncing.current = true;

        try {
            const result = await syncOrderNotifications();

            setNotifications(result.notifications);

            if (hasHydrated.current) {
                result.newNotifications.forEach(showOrderToast);
            }
        } catch {
            setNotifications(getStoredOrderNotifications());
        } finally {
            hasHydrated.current = true;
            isSyncing.current = false;
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            const timeout = window.setTimeout(() => {
                setNotifications([]);
                setIsOpen(false);
            }, 0);

            return () => {
                window.clearTimeout(timeout);
            };
        }

        const timeout = window.setTimeout(() => {
            setNotifications(getStoredOrderNotifications());
            void syncNotifications();
        }, 0);

        const interval = window.setInterval(() => {
            void syncNotifications();
        }, 60000);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
        };
    }, [enabled, syncNotifications]);

    useEffect(() => {
        const handleAuthChanged = () => {
            if (!enabled) {
                setNotifications([]);
                setIsOpen(false);
                return;
            }

            setNotifications(getStoredOrderNotifications());
            void syncNotifications();
        };

        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleAuthChanged);

        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
            window.removeEventListener(
                NOTIFICATIONS_CHANGED_EVENT,
                handleAuthChanged,
            );
        };
    }, [enabled, syncNotifications]);

    const handleMarkAllRead = async () => {
        try {
            setNotifications(await markAllOrderNotificationsRead());
        } catch {
            toast.error("Gagal menandai notifikasi dibaca.");
        }
    };

    const handleNotificationClick = async (notification: CustomerNotification) => {
        try {
            setNotifications(await markOrderNotificationRead(notification.id));
        } catch {
            toast.error("Gagal memperbarui notifikasi.");
        } finally {
            setIsOpen(false);
            if (pathname === notification.href) {
                window.dispatchEvent(
                    new CustomEvent("customer-order-detail-refresh", {
                        detail: {
                            orderNumber: notification.orderNumber,
                        },
                    }),
                );
                return;
            }

            router.push(notification.href);
        }
    };

    if (!enabled) {
        return null;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100"
                aria-label="Notifikasi pesanan"
            >
                <Bell size={20} />

                {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 text-center text-xs font-bold leading-5 text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                ) : null}
            </button>

            {isOpen ? (
                <div className="absolute right-0 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                        <div>
                            <p className="font-extrabold text-slate-950">Notifikasi</p>
                            <p className="text-xs font-semibold text-slate-500">
                                Update pembayaran dan pesanan
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Tandai semua dibaca"
                        >
                            <Check size={18} />
                        </button>
                    </div>

                    <div className="border-b border-slate-100 p-2">
                        <Link
                            href="/notifications"
                            prefetch={false}
                            onClick={() => setIsOpen(false)}
                            className={`block rounded-xl px-3 py-2 text-center text-sm text-white font-extrabold ${theme.colors.primary.bg} hover:${theme.colors.primary.text}`}
                        >
                            View all
                        </Link>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <Bell size={22} />
                            </div>

                            <p className="mt-3 text-sm font-bold text-slate-700">
                                Belum ada notifikasi
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Update status pesanan akan muncul di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[420px] overflow-y-auto p-2">
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={notification.href}
                                    prefetch={false}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        void handleNotificationClick(notification);
                                    }}
                                    className="flex gap-3 rounded-xl p-3 hover:bg-pink-50"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconClass(
                                            notification,
                                        )}`}
                                    >
                                        {getIcon(notification)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2">
                                            <p className="line-clamp-1 flex-1 text-sm font-extrabold text-slate-950">
                                                {notification.title}
                                            </p>

                                            {!notification.isRead ? (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pink-500" />
                                            ) : null}
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                            {notification.message}
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-pink-600">
                                            {formatRelativeTime(notification.createdAt)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
