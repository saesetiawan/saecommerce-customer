import { OrderStatus } from "@/app/types/order";

export function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function getOrderStatusLabel(status: OrderStatus) {
    const labels: Record<OrderStatus, string> = {
        WAITING_PAYMENT: "Menunggu Pembayaran",
        PAID: "Sudah Dibayar",
        PROCESSING: "Diproses",
        SHIPPED: "Dikirim",
        COMPLETED: "Selesai",
        CANCELLED: "Dibatalkan",
    };

    return labels[status];
}

export function getOrderStatusClass(status: OrderStatus) {
    const classes: Record<OrderStatus, string> = {
        WAITING_PAYMENT: "bg-amber-50 text-amber-600",
        PAID: "bg-blue-50 text-blue-600",
        PROCESSING: "bg-purple-50 text-purple-600",
        SHIPPED: "bg-cyan-50 text-cyan-600",
        COMPLETED: "bg-emerald-50 text-emerald-600",
        CANCELLED: "bg-red-50 text-red-600",
    };

    return classes[status];
}