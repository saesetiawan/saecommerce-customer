import { api } from "@/app/lib/axios";

const MAX_NOTIFICATIONS = 30;

export type NotificationVariant = "success" | "info" | "warning" | "danger";

export type CustomerNotification = {
    id: string;
    orderNumber: string;
    title: string;
    message: string;
    href: string;
    variant: NotificationVariant;
    statusKey: string;
    createdAt: string;
    isRead: boolean;
};

type BackendNotification = {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    metadata?: Record<string, unknown> | string | null;
    created_at: string;
};

type BackendNotificationList = {
    data?: BackendNotification[];
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
};

type ApiResponse<T> = {
    result?: T;
    data?: T;
} & T;

type SyncOrderNotificationsResult = {
    notifications: CustomerNotification[];
    newNotifications: CustomerNotification[];
};

export type CustomerNotificationPage = {
    data: CustomerNotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

function normalizeApiData<T>(response: ApiResponse<T>) {
    return response.result ?? response.data ?? response;
}

function normalizeMetadata(value: BackendNotification["metadata"]) {
    if (!value) {
        return {};
    }

    if (typeof value === "string") {
        try {
            return JSON.parse(value) as Record<string, unknown>;
        } catch {
            return {};
        }
    }

    return value;
}

function normalizeVariant(notification: BackendNotification): NotificationVariant {
    const type = notification.type.toLowerCase();
    const title = notification.title.toLowerCase();

    if (type.includes("failed") || title.includes("gagal") || title.includes("dicek")) {
        return "danger";
    }

    if (title.includes("menunggu") || type.includes("pending")) {
        return "warning";
    }

    if (title.includes("berhasil") || title.includes("sampai") || title.includes("selesai")) {
        return "success";
    }

    return "info";
}

function toCustomerNotification(notification: BackendNotification): CustomerNotification {
    const metadata = normalizeMetadata(notification.metadata);
    const orderNumber =
        typeof metadata.order_number === "string" ? metadata.order_number : "";
    const link =
        typeof metadata.link === "string"
            ? metadata.link
            : orderNumber
              ? `/orders/${orderNumber}`
              : "/orders";

    return {
        id: notification.id,
        orderNumber,
        title: notification.title,
        message: notification.message,
        href: link,
        variant: normalizeVariant(notification),
        statusKey: notification.type,
        createdAt: notification.created_at,
        isRead: notification.is_read,
    };
}

export function getStoredOrderNotifications() {
    return [];
}

export async function markOrderNotificationRead(notificationId: string) {
    await api.patch(`/notifications/read/${notificationId}`);

    return getCustomerNotifications();
}

export async function markAllOrderNotificationsRead() {
    await api.patch("/notifications/read-all");

    return getCustomerNotifications();
}

export function clearOrderNotifications() {
    return [];
}

export async function getCustomerNotifications() {
    const response = await getCustomerNotificationPage({
        page: 1,
        limit: MAX_NOTIFICATIONS,
    });

    return response.data;
}

export async function getCustomerNotificationPage({
    page = 1,
    limit = MAX_NOTIFICATIONS,
}: {
    page?: number;
    limit?: number;
} = {}): Promise<CustomerNotificationPage> {
    const response = await api.get<ApiResponse<BackendNotificationList>>("/notifications", {
        params: {
            page,
            limit,
        },
    });
    const data = normalizeApiData(response.data);
    const total = Number(data.total ?? 0);
    const normalizedLimit = Number(data.limit ?? limit);

    return {
        data: (data.data ?? []).map(toCustomerNotification),
        total,
        page: Number(data.page ?? page),
        limit: normalizedLimit,
        totalPages:
            Number(data.total_pages) ||
            Math.max(1, Math.ceil(total / normalizedLimit)),
    };
}

export async function syncOrderNotifications(): Promise<SyncOrderNotificationsResult> {
    const notifications = await getCustomerNotifications();

    return {
        notifications,
        newNotifications: [],
    };
}
