self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
    let payload = {};

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (error) {
            try {
                payload = JSON.parse(event.data.text());
            } catch (parseError) {
                payload = {};
            }
        }
    }

    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "Notifikasi baru";
    const options = {
        body: notification.body || data.message || "",
        data,
        icon: data.icon || "/favicon.ico",
        badge: data.badge || "/favicon.ico",
        tag: data.notification_id || data.order_number || "ecommerce-notification",
        renotify: true,
        requireInteraction: true,
    };

    event.waitUntil(
        Promise.all([
            broadcastPushReceived({
                title,
                notification_id: data.notification_id,
                order_number: data.order_number,
                data,
                notification_displayed_by_service_worker: true,
            }),
            self.registration
                .showNotification(title, options)
                .catch((error) => {
                    return broadcastPushReceived({
                        title,
                        notification_id: data.notification_id,
                        order_number: data.order_number,
                        data,
                        notification_displayed_by_service_worker: false,
                        notification_error: String(error),
                    });
                }),
        ]),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const targetUrl = data.link || (data.order_number ? `/orders/${data.order_number}` : "/");

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    if ("focus" in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            }),
    );
});

async function broadcastPushReceived(payload) {
    const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
    });

    for (const client of clients) {
        client.postMessage({
            type: "FCM_PUSH_RECEIVED",
            payload,
        });
    }
}
