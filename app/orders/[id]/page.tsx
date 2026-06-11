"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import {
    ArrowLeft,
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
    Truck,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import {
    getOrderByOrderNumber,
    OrderDetail,
    OrderHistory,
    retryOrderPayment,
} from "@/app/services/order.service";
import {
    getActivePaymentMethods,
    PaymentMethod,
} from "@/app/services/payment-method.service";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

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

function isPaymentGenerationFailed(order: OrderDetail) {
    const paymentStatus = normalizeStatus(order.payment?.status);
    const orderPaymentStatus = normalizeStatus(order.payment_status);

    return (
        paymentStatus === "failed_to_generate" ||
        orderPaymentStatus === "failed_to_generate"
    );
}

function getStatusClass(status?: string) {
    const value = normalizeStatus(status);

    if (
        value === "paid" ||
        value === "success" ||
        value === "completed" ||
        value === "settlement" ||
        value === "capture"
    ) {
        return "bg-emerald-50 text-emerald-600";
    }

    if (
        value === "waiting_payment" ||
        value === "pending" ||
        value === "unpaid"
    ) {
        return "bg-orange-50 text-orange-600";
    }

    if (
        value === "failed" ||
        value === "failed_to_generate" ||
        value === "cancelled" ||
        value === "canceled" ||
        value === "cancel" ||
        value === "expired"
    ) {
        return "bg-red-50 text-red-600";
    }

    return "bg-slate-100 text-slate-600";
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

function formatPaymentType(value: string) {
    if (value === "qris") {
        return "QRIS";
    }

    if (value === "virtual_account") {
        return "Virtual Account";
    }

    return value;
}

export default function OrderDetailPage({ params }: Props) {
    const [orderNumber, setOrderNumber] = useState("");
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedRetryPaymentMethodID, setSelectedRetryPaymentMethodID] =
        useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isRetryingPayment, setIsRetryingPayment] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const resolveParams = async () => {
        const resolvedParams = await params;
        setOrderNumber(resolvedParams.id);
    };

    useEffect(() => {
        resolveParams();
    }, []);

    const fetchOrder = async () => {
        if (!orderNumber) {
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
                    : "Gagal mengambil detail pesanan.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderNumber]);

    useEffect(() => {
        const handleRefresh = (event: Event) => {
            const customEvent =
                event as CustomEvent<{ orderNumber?: string }>

            if (customEvent.detail?.orderNumber === orderNumber) {
                void fetchOrder();
            }
        };

        window.addEventListener(
            "customer-order-detail-refresh",
            handleRefresh,
        );

        return () => {
            window.removeEventListener(
                "customer-order-detail-refresh",
                handleRefresh,
            );
        };
    }, [orderNumber]);

    useEffect(() => {
        const timeout = window.setTimeout(async () => {
            try {
                const result = await getActivePaymentMethods();
                setPaymentMethods(result.filter((item) => item.isActive));
            } catch {
                setPaymentMethods([]);
            }
        }, 0);

        return () => {
            window.clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (!order || paymentMethods.length === 0 || selectedRetryPaymentMethodID) {
            return;
        }

        const currentPaymentMethodID = order.payment?.payment_method_id;
        const fallbackMethod =
            paymentMethods.find((item) => item.id !== currentPaymentMethodID) ??
            paymentMethods[0];

        const timeout = window.setTimeout(() => {
            setSelectedRetryPaymentMethodID(fallbackMethod?.id ?? "");
        }, 0);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [order, paymentMethods, selectedRetryPaymentMethodID]);

    const handleCopy = async (value?: string) => {
        if (!value) {
            return;
        }

        await navigator.clipboard.writeText(value);
        toast.success("Berhasil disalin.");
    };

    const handleRetryPayment = async () => {
        if (!order || !selectedRetryPaymentMethodID || isRetryingPayment) {
            return;
        }

        setIsRetryingPayment(true);

        try {
            const result = await retryOrderPayment(
                order.order_number,
                selectedRetryPaymentMethodID,
            );

            if (result.payment_status === "failed_to_generate") {
                toast.error(
                    "Metode pembayaran ini masih gagal dibuat. Silakan coba metode lain.",
                );
            } else {
                toast.success("Instruksi pembayaran berhasil dibuat.");
            }

            await fetchOrder();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal mencoba metode pembayaran.",
            );
        } finally {
            setIsRetryingPayment(false);
        }
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <Link
                    href="/orders"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-pink-600"
                >
                    <ArrowLeft size={16} />
                    Kembali ke daftar pesanan
                </Link>

                {isLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Loader2 className={`animate-spin ${theme.colors.primary.text}`} />
                            <span className="font-semibold">Memuat detail pesanan...</span>
                        </div>
                    </div>
                ) : errorMessage || !order ? (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <ReceiptText size={30} />
                        </div>

                        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
                            Pesanan tidak ditemukan
                        </h1>

                        <p className="mt-2 text-slate-500">
                            {errorMessage || "Detail pesanan tidak tersedia."}
                        </p>

                        <button
                            type="button"
                            onClick={fetchOrder}
                            className={`mt-6 rounded-2xl ${theme.colors.primary.bg} px-6 py-3 font-bold text-white `}
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className={`text-sm font-extrabold uppercase ${theme.colors.primary.text}`}>
                                        Detail Pesanan
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                                            {order.order_number}
                                        </h1>

                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.order_number)}
                                            className={`rounded-xl bg-slate-50 p-2 text-slate-500 hover:${theme.colors.accent.text}`}
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Dibuat pada {formatDate(order.created_at)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                  <span
                      className={`rounded-full px-4 py-2 text-sm font-extrabold ${getStatusClass(
                          order.order_status,
                      )}`}
                  >
                    {order.order_status}
                  </span>

                                    <span
                                        className={`rounded-full px-4 py-2 text-sm font-extrabold ${getPaymentStatusClass(
                                            order,
                                        )}`}
                                    >
                    {getPaymentStatusLabel(order)}
                  </span>

                                    <span
                                        className={`rounded-full px-4 py-2 text-sm font-extrabold ${getStatusClass(
                                            order.fulfillment_status,
                                        )}`}
                                    >
                    {order.fulfillment_status}
                  </span>
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                            <div className="space-y-6">
                                <section className="rounded-3xl bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Package className={theme.colors.primary.text} />
                                        <h2 className="text-xl font-extrabold text-slate-950">
                                            Produk Dibeli
                                        </h2>
                                    </div>

                                    {order.order_items && order.order_items.length > 0 ? (
                                        <div className="mt-5 space-y-4">
                                            {order.order_items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex gap-4 rounded-2xl border border-slate-100 p-4"
                                                >
                                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                                        {item.image_url ? (
                                                            <Image
                                                                src={item.image_url}
                                                                alt={item.product_name}
                                                                fill
                                                                sizes="80px"
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

                                                        <p className="mt-2 text-sm text-slate-500">
                                                            {item.quantity} x {formatCurrency(item.price)}
                                                        </p>
                                                    </div>
                                                    <p className="font-extrabold text-slate-950">
                                                        {formatCurrency(item.total_amount)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-slate-500">
                                            Item pesanan belum tersedia.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-3xl bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Truck className={theme.colors.primary.text} />
                                        <h2 className="text-xl font-extrabold text-slate-950">
                                            Pengiriman
                                        </h2>
                                    </div>

                                    {order.shipments && order.shipments.length > 0 ? (
                                        <div className="mt-5 space-y-4">
                                            {order.shipments.map((shipment) => (
                                                <div
                                                    key={shipment.id}
                                                    className="rounded-2xl border border-slate-100 p-4"
                                                >
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-sm text-slate-500">Courier</p>
                                                            <p className="mt-1 font-bold text-slate-950">
                                                                {shipment.courier_code?.toUpperCase()}{" "}
                                                                {shipment.courier_service}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-slate-500">
                                                                Estimasi
                                                            </p>
                                                            <p className="mt-1 font-bold text-slate-950">
                                                                {shipment.etd || "-"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-slate-500">Ongkir</p>
                                                            <p className="mt-1 font-bold text-slate-950">
                                                                {formatCurrency(shipment.shipping_cost)}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-sm text-slate-500">Resi</p>
                                                            <p className="mt-1 font-bold text-slate-950">
                                                                {shipment.tracking_number || "-"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-sm text-slate-500">
                                            Data pengiriman belum tersedia.
                                        </p>
                                    )}
                                </section>

                                {order.store ? (
                                    <section className="rounded-3xl bg-white p-6 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Store className={theme.colors.primary.text} />
                                            <h2 className="text-xl font-extrabold text-slate-950">
                                                Toko
                                            </h2>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <p className="font-extrabold text-slate-950">
                                                {order.store.name}
                                            </p>

                                            {order.store.slug ? (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {order.store.slug}
                                                </p>
                                            ) : null}
                                        </div>
                                    </section>
                                ) : null}

                                <OrderHistorySection histories={order.histories} />
                            </div>

                            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-32">
                                <h2 className="text-xl font-extrabold text-slate-950">
                                    Pembayaran
                                </h2>

                                {isPaymentPaid(order) ? (
                                    <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600">
                                            <CheckCircle2 size={36} />
                                        </div>

                                        <p className="mt-4 text-xs font-extrabold uppercase text-emerald-600">
                                            Pembayaran Berhasil
                                        </p>

                                        <p className="mt-2 text-lg font-black text-slate-950">
                                            Pembayaran sudah diterima.
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Pesanan kamu akan segera diproses oleh toko.
                                        </p>

                                        {order.payment?.paid_at || order.paid_at ? (
                                            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-600">
                                                Dibayar pada{" "}
                                                {formatDate(order.payment?.paid_at ?? order.paid_at)}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : isPaymentGenerationFailed(order) ? (
                                    <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600">
                                                <AlertTriangle size={26} />
                                            </div>

                                            <div>
                                                <p className="text-xs font-extrabold uppercase text-red-600">
                                                    Pembayaran belum bisa dibuat
                                                </p>

                                                <p className="mt-2 text-lg font-black text-slate-950">
                                                    Pilih metode pembayaran lain
                                                </p>

                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    Order sudah berhasil dibuat, tetapi request ke provider pembayaran gagal. Kamu bisa mencoba VA bank lain atau QRIS.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <label className="block text-sm font-bold text-slate-700">
                                                Metode pembayaran
                                            </label>

                                            <select
                                                value={selectedRetryPaymentMethodID}
                                                onChange={(event) =>
                                                    setSelectedRetryPaymentMethodID(event.target.value)
                                                }
                                                className="w-full rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-pink-400"
                                            >
                                                {paymentMethods.length === 0 ? (
                                                    <option value="">
                                                        Metode pembayaran tidak tersedia
                                                    </option>
                                                ) : (
                                                    paymentMethods.map((method) => (
                                                        <option
                                                            key={method.id}
                                                            value={method.id}
                                                        >
                                                            {method.name} - {formatPaymentType(method.type)}
                                                        </option>
                                                    ))
                                                )}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={handleRetryPayment}
                                                disabled={
                                                    isRetryingPayment ||
                                                    !selectedRetryPaymentMethodID
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isRetryingPayment ? (
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={18}
                                                    />
                                                ) : (
                                                    <CreditCard size={18} />
                                                )}
                                                Coba metode ini
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {isQrisPayment(order) ? (
                                            <div className="mt-5 rounded-3xl border border-pink-100 bg-pink-50 p-5 text-center">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-pink-600">
                                                    <QrCode size={30} />
                                                </div>

                                                <p className="mt-4 text-xs font-extrabold uppercase text-pink-600">
                                                    Scan QRIS untuk pembayaran
                                                </p>

                                                {order.payment?.qr_string ? (
                                                    <div className="mx-auto mt-5 w-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                                                        <QRCodeSVG
                                                            value={order.payment.qr_string}
                                                            size={240}
                                                            level="M"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="mt-4 text-sm font-semibold text-slate-500">
                                                        QRIS belum tersedia.
                                                    </p>
                                                )}
                                            </div>
                                        ) : getPaymentMainValue(order) ? (
                                            <div className={`mt-5 rounded-3xl border border-pink-100 ${theme.colors.primary.soft} p-5 text-center`}>
                                                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white ${theme.colors.primary.text}`}>
                                                    <CreditCard size={30} />
                                                </div>

                                                <p className={`mt-4 text-xs font-extrabold uppercase ${theme.colors.primary.text}`}>
                                                    {getPaymentTitle(order)}
                                                </p>

                                                <p className="mt-2 break-all text-xl font-black text-slate-950">
                                                    {getPaymentMainValue(order)}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(getPaymentMainValue(order))}
                                                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-2xl ${theme.colors.primary.bg} px-5 py-3 text-sm font-bold text-white ${theme.colors.primary.hover}`}
                                                >
                                                    <Copy size={17} />
                                                    Salin
                                                </button>
                                            </div>
                                        ) : null}

                                        {order.payment?.payment_url ? (
                                            <a
                                                href={order.payment.payment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
                                            >
                                                Buka Halaman Pembayaran
                                            </a>
                                        ) : null}

                                        {order.payment?.expired_at ? (
                                            <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-center text-sm font-bold text-orange-600">
                                                Bayar sebelum {formatDate(order.payment.expired_at)}
                                            </p>
                                        ) : null}
                                    </>
                                )}

                                <div className="mt-6 space-y-3">
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
                                        className={`flex items-center justify-center gap-2 rounded-2xl ${theme.colors.primary.bg} px-5 py-3 font-bold text-white hover:${theme.colors.primary.soft}`}
                                    >
                                        <ShoppingBag size={18} />
                                        Lihat Pesanan
                                    </Link>

                                    <Link
                                        href="/products"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        Belanja Lagi
                                    </Link>

                                    <Link
                                        href="/"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        <Home size={18} />
                                        Beranda
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

function OrderHistorySection({ histories = [] }: { histories?: OrderHistory[] }) {
    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <Clock className={theme.colors.primary.text} />
                <h2 className="text-xl font-extrabold text-slate-950">
                    Riwayat Pesanan
                </h2>
            </div>

            {histories.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Riwayat pesanan belum tersedia.
                </p>
            ) : (
                <div className="mt-5 space-y-5">
                    {histories.map((history, index) => {
                        const isLast = index === histories.length - 1;

                        return (
                            <div
                                key={history.id}
                                className="relative flex gap-4"
                            >
                                {!isLast ? (
                                    <span className="absolute left-[15px] top-9 h-[calc(100%+0.75rem)] w-px bg-slate-200" />
                                ) : null}

                                <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50 ${theme.colors.primary.text}`}>
                                    {isLast ? (
                                        <CheckCircle2 size={17} />
                                    ) : (
                                        <Clock size={16} />
                                    )}
                                </span>

                                <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-slate-950">
                                                {history.title || history.event || "Update pesanan"}
                                            </p>

                                            {history.description ? (
                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {history.description}
                                                </p>
                                            ) : null}
                                        </div>

                                        <p className="shrink-0 text-xs font-bold text-slate-400">
                                            {formatDate(history.created_at)}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold capitalize text-slate-500">
                                            {history.actor_type || "system"}
                                        </span>

                                        {history.to_order_status ? (
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                                    history.to_order_status,
                                                )}`}
                                            >
                                                {history.to_order_status}
                                            </span>
                                        ) : null}

                                        {history.to_payment_status ? (
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                                    history.to_payment_status,
                                                )}`}
                                            >
                                                {history.to_payment_status}
                                            </span>
                                        ) : null}

                                        {history.to_fulfillment_status ? (
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                                                    history.to_fulfillment_status,
                                                )}`}
                                            >
                                                {history.to_fulfillment_status}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
