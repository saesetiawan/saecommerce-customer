"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Check, CreditCard, Inbox, Loader2, PackageCheck, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import {
    CustomerNotification,
    getCustomerNotificationPage,
    markAllOrderNotificationsRead,
    markOrderNotificationRead,
} from "@/app/services/notification.service";
import { notifyNotificationsChanged } from "@/app/lib/cart-events";

const PAGE_LIMIT = 12;

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
        return <PackageCheck size={20} />;
    }

    if (notification.variant === "warning") {
        return <CreditCard size={20} />;
    }

    if (notification.variant === "danger") {
        return <XCircle size={20} />;
    }

    return <Truck size={20} />;
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

export default function NotificationsPage() {
    const pathname = usePathname();
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.isRead).length,
        [notifications],
    );

    const hasNextPage = page < totalPages;

    const fetchNotifications = useCallback(
        async (nextPage: number, mode: "replace" | "append") => {
            if (mode === "replace") {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            setErrorMessage("");

            try {
                const response = await getCustomerNotificationPage({
                    page: nextPage,
                    limit: PAGE_LIMIT,
                });

                setNotifications((current) =>
                    mode === "replace"
                        ? response.data
                        : mergeNotifications(current, response.data),
                );
                setPage(response.page);
                setTotal(response.total);
                setTotalPages(response.totalPages);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Gagal memuat notifikasi.",
                );
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void fetchNotifications(1, "replace");
        }, 0);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        const target = loaderRef.current;

        if (!target) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;

                if (entry.isIntersecting && hasNextPage && !isLoadingMore && !isLoading) {
                    void fetchNotifications(page + 1, "append");
                }
            },
            {
                rootMargin: "240px",
            },
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [fetchNotifications, hasNextPage, isLoading, isLoadingMore, page]);

    const handleMarkAllRead = async () => {
        if (unreadCount < 1) {
            return;
        }

        try {
            await markAllOrderNotificationsRead();
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                })),
            );
            notifyNotificationsChanged();
        } catch {
            toast.error("Gagal menandai notifikasi dibaca.");
        }
    };

    const handleNotificationClick = async (notification: CustomerNotification) => {
        if (notification.isRead) {
            return;
        }

        try {
            await markOrderNotificationRead(notification.id);
            setNotifications((current) =>
                current.map((item) =>
                    item.id === notification.id
                        ? {
                              ...item,
                              isRead: true,
                          }
                        : item,
                ),
            );
            notifyNotificationsChanged();
        } catch {
            toast.error("Gagal memperbarui notifikasi.");
        }
    };

    const handleNotificationLinkClick = (
        event: MouseEvent<HTMLAnchorElement>,
        notification: CustomerNotification,
    ) => {
        void handleNotificationClick(notification);

        if (pathname === notification.href) {
            event.preventDefault();
            window.dispatchEvent(
                new CustomEvent("customer-order-detail-refresh", {
                    detail: {
                        orderNumber: notification.orderNumber,
                    },
                }),
            );
        }
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                            <Bell size={24} />
                        </div>

                        <div>
                            <p className="font-semibold text-pink-600">Pusat Notifikasi</p>

                            <h1 className="mt-1 text-3xl font-extrabold text-slate-950">
                                Notifikasi
                            </h1>

                            <p className="mt-2 text-sm text-slate-500">
                                {total} notifikasi tersimpan, {unreadCount} belum dibaca.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={unreadCount < 1}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-bold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check size={17} />
                        Tandai semua dibaca
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-white shadow-sm">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className="animate-spin text-pink-500" />
                            <span className="font-semibold">Memuat notifikasi...</span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <XCircle size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                            Gagal memuat notifikasi
                        </h2>

                        <p className="mt-2 text-slate-500">{errorMessage}</p>

                        <button
                            type="button"
                            onClick={() => fetchNotifications(1, "replace")}
                            className="mt-6 rounded-2xl bg-pink-500 px-6 py-3 font-bold text-white hover:bg-pink-600"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                            <Inbox size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                            Belum ada notifikasi
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Update pembayaran dan pesanan akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={notification.href}
                                    prefetch={false}
                                    onClick={(event) =>
                                        handleNotificationLinkClick(event, notification)
                                    }
                                    className="flex gap-4 p-4 transition hover:bg-pink-50 sm:p-5"
                                >
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getIconClass(
                                            notification,
                                        )}`}
                                    >
                                        {getIcon(notification)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-2">
                                                <p className="font-extrabold text-slate-950">
                                                    {notification.title}
                                                </p>

                                                {!notification.isRead ? (
                                                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pink-500" />
                                                ) : null}
                                            </div>

                                            <p className="shrink-0 text-xs font-bold text-pink-600">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>

                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {notification.message}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div
                            ref={loaderRef}
                            className="flex min-h-16 items-center justify-center border-t border-slate-100 p-4 text-sm font-semibold text-slate-500"
                        >
                            {isLoadingMore ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="animate-spin text-pink-500" size={16} />
                                    Memuat lagi...
                                </span>
                            ) : hasNextPage ? (
                                "Scroll untuk memuat notifikasi lain"
                            ) : (
                                "Semua notifikasi sudah ditampilkan"
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

function mergeNotifications(
    current: CustomerNotification[],
    incoming: CustomerNotification[],
) {
    const map = new Map<string, CustomerNotification>();

    for (const item of current) {
        map.set(item.id, item);
    }

    for (const item of incoming) {
        map.set(item.id, item);
    }

    return Array.from(map.values());
}
