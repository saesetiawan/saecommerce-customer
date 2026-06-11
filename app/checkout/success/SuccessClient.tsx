"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
    ArrowRight,
    CheckCircle2,
    Copy,
    CreditCard,
    Home,
    Loader2,
    Package,
    QrCode,
    ReceiptText,
    ShoppingBag,
    Store,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import {
    getOrderByOrderNumber,
    OrderDetail,
} from "@/app/services/order.service";

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

function normalizeStatus(value?: string | null) {
    return (value ?? "").toLowerCase();
}

function isPaymentPaid(order: OrderDetail) {
    const paymentStatus = normalizeStatus(order.payment?.status);
    const orderPaymentStatus = normalizeStatus(order.payment_status);

    return (
        paymentStatus === "paid" ||
        paymentStatus === "settlement" ||
        paymentStatus === "success" ||
        paymentStatus === "capture" ||
        orderPaymentStatus === "paid" ||
        orderPaymentStatus === "settlement" ||
        orderPaymentStatus === "success" ||
        orderPaymentStatus === "capture"
    );
}

function isPaymentExpired(order: OrderDetail) {
    const paymentStatus = normalizeStatus(order.payment?.status);
    const orderPaymentStatus = normalizeStatus(order.payment_status);

    return paymentStatus === "expired" || orderPaymentStatus === "expired";
}

function isPaymentCancelled(order: OrderDetail) {
    const paymentStatus = normalizeStatus(order.payment?.status);
    const orderPaymentStatus = normalizeStatus(order.payment_status);

    return (
        paymentStatus === "cancelled" ||
        paymentStatus === "canceled" ||
        paymentStatus === "cancel" ||
        orderPaymentStatus === "cancelled" ||
        orderPaymentStatus === "canceled" ||
        orderPaymentStatus === "cancel"
    );
}

function getPaymentStatusLabel(order: OrderDetail) {
    if (isPaymentPaid(order)) {
        return "paid";
    }

    return order.payment?.status ?? order.payment_status ?? "-";
}

function getPaymentStatusClass(order: OrderDetail) {
    if (isPaymentPaid(order)) {
        return "bg-emerald-50 text-emerald-600";
    }

    if (isPaymentExpired(order) || isPaymentCancelled(order)) {
        return "bg-red-50 text-red-600";
    }

    return "bg-orange-50 text-orange-600";
}

function getPaymentMethodType(order: OrderDetail) {
    return order.payment?.payment_method?.type ?? "";
}

function getPaymentMethodName(order: OrderDetail) {
    return order.payment?.payment_method?.name ?? "Metode Pembayaran";
}

function isQrisPayment(order: OrderDetail) {
    return getPaymentMethodType(order) === "qris";
}

function isVirtualAccountPayment(order: OrderDetail) {
    return getPaymentMethodType(order) === "virtual_account";
}

function getPaymentMainValue(order: OrderDetail) {
    if (isVirtualAccountPayment(order)) {
        return order.payment?.va_number || "";
    }

    return order.payment?.transaction_code || "";
}

function getPaymentTitle(order: OrderDetail) {
    if (isVirtualAccountPayment(order)) {
        return "Nomor Virtual Account";
    }

    if (isQrisPayment(order)) {
        return "Scan QRIS untuk pembayaran";
    }

    return "Kode Pembayaran";
}

export default function SuccessClient() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get("order_number") ?? "";

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchOrder = async () => {
        if (!orderNumber) {
            setErrorMessage("Order number tidak ditemukan di URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const data = await getOrderByOrderNumber(orderNumber);
            setOrder(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil detail order.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderNumber]);

    const handleCopy = async (value?: string) => {
        if (!value) {
            return;
        }

        await navigator.clipboard.writeText(value);
        toast.success("Berhasil disalin.");
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {isLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-100 bg-white">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className="animate-spin text-pink-500" />
                            <span className="font-semibold">Memuat pesanan...</span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-3xl border border-red-100 bg-white p-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <ReceiptText size={30} />
                        </div>

                        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
                            Pesanan tidak ditemukan
                        </h1>

                        <p className="mt-2 text-slate-500">{errorMessage}</p>

                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={fetchOrder}
                                className="rounded-2xl bg-pink-500 px-6 py-3 font-bold text-white hover:bg-pink-600"
                            >
                                Coba Lagi
                            </button>

                            <Link
                                href="/orders"
                                className="rounded-2xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Lihat Pesanan
                            </Link>
                        </div>
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        <section className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
                            <div
                                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                                    isPaymentPaid(order)
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-emerald-50 text-emerald-600"
                                }`}
                            >
                                <CheckCircle2 size={42} />
                            </div>

                            <h1 className="mt-6 text-2xl font-extrabold text-slate-950 sm:text-4xl">
                                Pesanan berhasil dibuat
                            </h1>

                            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
                                {isPaymentPaid(order)
                                    ? "Pembayaran sudah diterima. Pesanan kamu akan segera diproses."
                                    : "Pesanan kamu sudah masuk. Silakan selesaikan pembayaran sesuai metode yang dipilih."}
                            </p>

                            <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4">
                                <div className="text-left">
                                    <p className="text-xs font-semibold uppercase text-slate-400">
                                        Order Number
                                    </p>

                                    <p className="font-extrabold text-slate-950">
                                        {order.order_number}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleCopy(order.order_number)}
                                    className="rounded-xl bg-white p-2 text-slate-500 hover:text-pink-600"
                                    aria-label="Copy order number"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </section>

                        <section
                            className={`overflow-hidden rounded-3xl border shadow-sm ${
                                isPaymentPaid(order)
                                    ? "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50"
                                    : "border-pink-100 bg-gradient-to-br from-pink-50 via-white to-orange-50"
                            }`}
                        >
                            <div
                                className={`border-b px-6 py-5 ${
                                    isPaymentPaid(order)
                                        ? "border-emerald-100"
                                        : "border-pink-100"
                                }`}
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p
                                            className={`text-xs font-extrabold uppercase tracking-wide ${
                                                isPaymentPaid(order)
                                                    ? "text-emerald-600"
                                                    : "text-pink-600"
                                            }`}
                                        >
                                            Pembayaran
                                        </p>

                                        <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                                            {getPaymentMethodName(order)}
                                        </h2>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-4 py-2 text-sm font-extrabold shadow-sm ${getPaymentStatusClass(
                                            order,
                                        )}`}
                                    >
                    {getPaymentStatusLabel(order)}
                  </span>
                                </div>
                            </div>

                            <div className="p-6 text-center sm:p-8">
                                {isPaymentPaid(order) ? (
                                    <>
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-sm">
                                            <CheckCircle2 size={46} />
                                        </div>

                                        <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-emerald-600">
                                            Pembayaran Berhasil
                                        </p>

                                        <p className="mx-auto mt-4 max-w-2xl text-2xl font-black text-slate-950 sm:text-4xl">
                                            Terima kasih, pembayaran kamu sudah diterima.
                                        </p>

                                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                                            Pesanan akan segera diproses oleh toko. Kamu bisa melihat
                                            perkembangan pesanan di halaman pesanan.
                                        </p>

                                        {order.payment?.paid_at || order.paid_at ? (
                                            <p className="mt-5 text-sm font-bold text-emerald-600">
                                                Dibayar pada{" "}
                                                {formatDate(order.payment?.paid_at ?? order.paid_at)}
                                            </p>
                                        ) : null}
                                    </>
                                ) : isQrisPayment(order) ? (
                                    <>
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-pink-600 shadow-sm">
                                            <QrCode size={34} />
                                        </div>

                                        <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-slate-500">
                                            {getPaymentTitle(order)}
                                        </p>

                                        {order.payment?.qr_string ? (
                                            <div className="mx-auto mt-5 w-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                                                <QRCodeSVG
                                                    value={order.payment.qr_string}
                                                    size={260}
                                                    level="M"
                                                />
                                            </div>
                                        ) : (
                                            <p className="mt-4 font-semibold text-slate-500">
                                                QRIS belum tersedia.
                                            </p>
                                        )}

                                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                                            Scan QRIS menggunakan mobile banking atau e-wallet yang
                                            mendukung QRIS.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-pink-600 shadow-sm">
                                            <CreditCard size={34} />
                                        </div>

                                        <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-slate-500">
                                            {getPaymentTitle(order)}
                                        </p>

                                        {getPaymentMainValue(order) ? (
                                            <>
                                                <p className="mx-auto mt-4 max-w-4xl break-all text-3xl font-black tracking-wide text-slate-950 sm:text-5xl">
                                                    {getPaymentMainValue(order)}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(getPaymentMainValue(order))}
                                                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-6 py-4 text-base font-extrabold text-white hover:bg-pink-600"
                                                >
                                                    <Copy size={18} />
                                                    Salin
                                                </button>
                                            </>
                                        ) : (
                                            <p className="mt-4 font-semibold text-slate-500">
                                                Kode pembayaran belum tersedia.
                                            </p>
                                        )}
                                    </>
                                )}

                                {!isPaymentPaid(order) && order.payment?.payment_url ? (
                                    <a
                                        href={order.payment.payment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-base font-extrabold text-white hover:bg-slate-800"
                                    >
                                        Buka Halaman Pembayaran
                                    </a>
                                ) : null}

                                {!isPaymentPaid(order) && order.payment?.expired_at ? (
                                    <p className="mt-5 text-sm font-bold text-orange-600">
                                        Bayar sebelum {formatDate(order.payment.expired_at)}
                                    </p>
                                ) : null}
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                            <section className="rounded-3xl bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Package className="text-pink-600" />
                                    <h2 className="text-xl font-extrabold text-slate-950">
                                        Detail Pesanan
                                    </h2>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-100 p-4">
                                        <p className="text-sm text-slate-500">Status Pesanan</p>
                                        <p className="mt-1 font-bold text-slate-950">
                                            {order.order_status}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 p-4">
                                        <p className="text-sm text-slate-500">Status Pembayaran</p>
                                        <p className="mt-1 font-bold text-slate-950">
                                            {getPaymentStatusLabel(order)}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 p-4">
                                        <p className="text-sm text-slate-500">Status Pengiriman</p>
                                        <p className="mt-1 font-bold text-slate-950">
                                            {order.fulfillment_status}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 p-4">
                                        <p className="text-sm text-slate-500">Dibuat Pada</p>
                                        <p className="mt-1 font-bold text-slate-950">
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {order.store ? (
                                    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-pink-600">
                                                <Store size={22} />
                                            </div>

                                            <div>
                                                <p className="text-sm text-slate-500">Toko</p>
                                                <p className="font-extrabold text-slate-950">
                                                    {order.store.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {order.order_items && order.order_items.length > 0 ? (
                                    <div className="mt-6">
                                        <h3 className="font-extrabold text-slate-950">
                                            Produk Dibeli
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            {order.order_items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex gap-4 rounded-2xl border border-slate-100 p-4"
                                                >
                                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                        {item.image_url ? (
                                                            <Image
                                                                src={item.image_url}
                                                                alt={item.product_name}
                                                                fill
                                                                sizes="64px"
                                                                className="object-cover"
                                                            />
                                                        ) : null}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="line-clamp-2 font-bold text-slate-950">
                                                            {item.product_name}
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {item.variant_name} • {item.sku}
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {item.quantity} x {formatCurrency(item.price)}
                                                        </p>
                                                    </div>

                                                    <p className="font-extrabold text-slate-950">
                                                        {formatCurrency(item.total_amount)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {order.shipments
                                    ? order.shipments.map((shipment) => (
                                        <div
                                            className="mt-6 rounded-2xl border border-slate-100 p-4"
                                            key={shipment.id}
                                        >
                                            <h3 className="font-extrabold text-slate-950">
                                                Pengiriman
                                            </h3>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-sm text-slate-500">Courier</p>
                                                    <p className="font-bold text-slate-950">
                                                        {shipment.courier_code?.toUpperCase()}{" "}
                                                        {shipment.courier_service}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-slate-500">Estimasi</p>
                                                    <p className="font-bold text-slate-950">
                                                        {shipment.etd || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-slate-500">Ongkir</p>
                                                    <p className="font-bold text-slate-950">
                                                        {formatCurrency(shipment.shipping_cost)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-slate-500">Resi</p>
                                                    <p className="font-bold text-slate-950">
                                                        {shipment.tracking_number || "-"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    : null}
                            </section>

                            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-extrabold text-slate-950">
                                    Ringkasan Pembayaran
                                </h2>

                                <div className="mt-5 space-y-3">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(order.subtotal_amount)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Ongkir</span>
                                        <span>{formatCurrency(order.shipping_amount)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Biaya layanan</span>
                                        <span>
                      {formatCurrency(
                          order.payment?.fee_amount ?? order.service_fee,
                      )}
                    </span>
                                    </div>

                                    <div className="flex justify-between border-t border-slate-100 pt-4 text-lg font-extrabold text-slate-950">
                                        <span>Total</span>
                                        <span>
                      {formatCurrency(
                          order.payment?.amount ?? order.total_amount,
                      )}
                    </span>
                                    </div>
                                </div>

                                {order.payment?.payment_method ? (
                                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-sm font-semibold text-slate-500">
                                            Metode Pembayaran
                                        </p>

                                        <p className="mt-1 font-extrabold text-slate-950">
                                            {order.payment.payment_method.name}
                                        </p>
                                    </div>
                                ) : null}

                                {order.payment?.payment_provider ? (
                                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="text-sm font-semibold text-slate-500">
                                            Provider Pembayaran
                                        </p>

                                        <p className="mt-1 font-extrabold text-slate-950">
                                            {order.payment.payment_provider.name ?? "-"}
                                        </p>
                                    </div>
                                ) : null}

                                <div className="mt-6 grid gap-3">
                                    <Link
                                        href="/orders"
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
                                    >
                                        <ShoppingBag size={18} />
                                        Lihat Pesanan Saya
                                    </Link>

                                    <Link
                                        href="/products"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        Belanja Lagi
                                        <ArrowRight size={18} />
                                    </Link>

                                    <Link
                                        href="/"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        <Home size={18} />
                                        Ke Beranda
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
