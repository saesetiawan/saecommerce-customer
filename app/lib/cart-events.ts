export const CART_CHANGED_EVENT = "customer-cart-changed";
export const AUTH_CHANGED_EVENT = "customer-auth-changed";
export const NOTIFICATIONS_CHANGED_EVENT = "customer-notifications-changed";

export function notifyCartChanged() {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function notifyAuthChanged() {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function notifyNotificationsChanged() {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
