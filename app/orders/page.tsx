"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    Loader2,
    Package,
    ReceiptText,
    Search,
    ShoppingBag,
    Store,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import { getCustomerOrders, OrderDetail } from "@/app/services/order.service";

function formatCurrency(value?: number) {
    return `Rp ${(value ?? 0).toLocaleString("id-ID")}`;
}

function formatDate(value?: string | null) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getStatusClass(status?: string) {
    const value = status?.toLowerCase();

    if (value === "paid" || value === "success" || value === "completed") {
        return "bg-emerald-50 text-emerald-600";
    }

    if (value === "waiting_payment" || value === "pending") {
        return "bg-orange-50 text-orange-600";
    }

    if (value === "failed" || value === "cancelled" || value === "expired") {
        return "bg-red-50 text-red-600";
    }

    return "bg-slate-100 text-slate-600";
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const totalPages = useMemo(() => {
        return Math.max(Math.ceil(total / limit), 1);
    }, [total, limit]);

    const fetchOrders = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await getCustomerOrders({
                page,
                limit,
                orderBy: "created_at",
                orderType: "desc",
                searchBy: "order_number",
                search,
            });

            setOrders(response.data);
            setTotal(response.total);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil data pesanan.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchOrders();
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className={`font-semibold ${theme.colors.primary}`}>Pesanan Saya</p>

                        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
                            Daftar Pesanan
                        </h1>

                        <p className={`mt-2 text-sm ${theme.tokens.textColor}`}>
                            Lihat status pembayaran, pengiriman, dan detail pesanan kamu.
                        </p>
                    </div>

                    <Link
                        href="/products"
                        className={`inline-flex w-fit items-center gap-2 rounded-2xl ${theme.colors.primary.bg} px-5 py-3 text-sm font-bold text-white ${theme.colors.primary.hover}`}
                    >
                        Belanja Lagi
                        <ArrowRight size={17} />
                    </Link>
                </div>

                <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Cari nomor pesanan..."
                                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:${}"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSearch}
                            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                        >
                            Cari
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-white shadow-sm">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className={`animate-spin ${theme.colors.primary.text}`} />
                            <span className="font-semibold">Memuat pesanan...</span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <ReceiptText size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                            Gagal memuat pesanan
                        </h2>

                        <p className="mt-2 text-slate-500">{errorMessage}</p>

                        <button
                            type="button"
                            onClick={fetchOrders}
                            className={`mt-6 rounded-2xl ${theme.colors.primary.bg} px-6 py-3 font-bold text-white hover:${theme.colors.primary.soft}`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 ${theme.colors.primary.text}`}>
                            <ShoppingBag size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                            Belum ada pesanan
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Pesanan kamu akan muncul di sini setelah checkout.
                        </p>

                        <Link
                            href="/products"
                            className={`mt-6 inline-flex rounded-2xl ${theme.colors.primary.text} px-6 py-3 font-bold text-white hover:${theme.colors.neutral.page}`}
                        >
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link
                                key={order.order_number}
                                href={`/orders/${order.order_number}`}
                                className="block rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full bg-pink-50 px-3 py-1 text-xs font-extrabold  ${theme.colors.primary.text}`}>
                        {order.order_number}
                      </span>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                                    order.payment?.status ?? order.payment_status,
                                                )}`}
                                            >
                        {order.payment?.status ?? order.payment_status}
                      </span>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                                    order.order_status,
                                                )}`}
                                            >
                        {order.order_status}
                      </span>
                                        </div>

                                        <div className="mt-4 flex items-center gap-3">
                                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50  ${theme.colors.primary.text}`}>
                                                <Store size={22} />
                                            </div>

                                            <div>
                                                <p className="font-extrabold text-slate-950">
                                                    {order.store?.name ?? "Toko"}
                                                </p>

                                                <p className="text-sm text-slate-500">
                                                    Dibuat pada {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {order.order_items && order.order_items.length > 0 ? (
                                            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white  ${theme.colors.primary.text}`}>
                                                    <Package size={20} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="line-clamp-1 font-bold text-slate-950">
                                                        {order.order_items[0].product_name}
                                                    </p>

                                                    <p className="text-sm text-slate-500">
                                                        {order.order_items.length} produk
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="shrink-0 text-left lg:text-right">
                                        <p className="text-sm text-slate-500">Total Pembayaran</p>

                                        <p className="mt-1 text-2xl font-black text-slate-950">
                                            {formatCurrency(
                                                order.payment?.amount ?? order.total_amount,
                                            )}
                                        </p>

                                        <p className="mt-2 text-sm font-semibold text-slate-500">
                                            {order.payment?.payment_method?.name ?? "-"}
                                        </p>

                                        <div className={`mt-4 inline-flex items-center gap-2 text-sm font-bold  ${theme.colors.primary.text}`}>
                                            Lihat Detail
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        <div className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sebelumnya
                            </button>

                            <p className="text-sm font-bold text-slate-600">
                                Page {page} / {totalPages}
                            </p>

                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() =>
                                    setPage((value) => Math.min(value + 1, totalPages))
                                }
                                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}