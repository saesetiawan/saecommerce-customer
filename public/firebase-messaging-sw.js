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
        data: sanitizeNotificationData(data),
        icon: data.icon || "/favicon.ico",
        badge: data.badge || "/favicon.ico",
        tag: data.notification_id || data.order_number || "ecommerce-notification",
        renotify: true,
        requireInteraction: true,
    };

    event.waitUntil(handlePushNotification({ title, data, options }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const targetUrl = getNotificationTargetUrl(data);

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

function getNotificationTargetUrl(data) {
    if (data.order_number) {
        return `/orders/${data.order_number}`;
    }

    if (!data.link) {
        return "/";
    }

    try {
        const url = new URL(data.link, self.location.origin);

        if (url.origin !== self.location.origin) {
            return "/";
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return "/";
    }
}

function sanitizeNotificationData(data) {
    const nextData = { ...data };
    const safeLink = getNotificationTargetUrl(data);

    if (safeLink && safeLink !== "/") {
        nextData.link = safeLink;
    } else {
        delete nextData.link;
    }

    return nextData;
}

async function handlePushNotification({ title, data, options }) {
    const clients = await getWindowClients();
    const notificationData = sanitizeNotificationData(data);
    const hasVisibleClient = clients.some(
        (client) => client.visibilityState === "visible" || client.focused,
    );

    await broadcastPushReceived(
        {
            title,
            notification_id: data.notification_id,
            order_number: data.order_number,
            data: notificationData,
            notification_displayed_by_service_worker: !hasVisibleClient,
            notification_handled_by_visible_client: hasVisibleClient,
        },
        clients,
    );

    if (hasVisibleClient) {
        return;
    }

    try {
        await self.registration.showNotification(title, options);
    } catch (error) {
        await broadcastPushReceived(
            {
                title,
                notification_id: data.notification_id,
                order_number: data.order_number,
                data: notificationData,
                notification_displayed_by_service_worker: false,
                notification_error: String(error),
            },
            clients,
        );
    }
}

async function getWindowClients() {
    return self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
    });
}

async function broadcastPushReceived(payload, clients) {
    const targetClients = clients || (await getWindowClients());

    for (const client of targetClients) {
        client.postMessage({
            type: "FCM_PUSH_RECEIVED",
            payload,
        });
    }
}
