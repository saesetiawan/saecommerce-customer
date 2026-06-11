import { api } from "@/app/lib/axios";

export type OrderPaymentMethod = {
    id: string;
    code: string;
    name: string;
    type: string;
    service_fee?: string | number;
    is_active?: boolean;
    created_at?: string;
};

export type OrderPaymentProvider = {
    id: string;
    code?: string;
    name?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type OrderPaymentProviderMethod = {
    id: string;
    payment_provider_id?: string;
    payment_method_id?: string;
    code?: string;
    name?: string;
    provider_code?: string;
    provider_method_code?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type OrderPayment = {
    id: string;

    order_id: string;
    payment_method_id: string;
    payment_provider_id: string;
    payment_provider_method_id: string;

    transaction_code: string;
    provider_transaction_id: string;

    amount: number;
    fee_amount: number;
    status: string;

    payment_url: string;
    va_number: string;
    qr_string: string;

    payment_instruction: unknown;
    raw_response: unknown;

    paid_at: string | null;
    expired_at: string | null;

    payment_method?: OrderPaymentMethod;
    payment_provider?: OrderPaymentProvider;
    payment_provider_method?: OrderPaymentProviderMethod;

    created_at: string;
    updated_at: string;
};

export type OrderItem = {
    id: string;
    order_id?: string;
    product_id: string;
    product_variant_id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    price: number;
    quantity: number;
    total_amount: number;
    image_url?: string;
};

export type OrderShipment = {
    id?: string;
    order_id?: string;

    courier_code?: string;
    courier_service?: string;
    courier_name?: string;
    courier_description?: string;

    shipping_cost?: number;
    etd?: string;
    tracking_number?: string;
    status?: string;
};

export type OrderStore = {
    id: string;
    name: string;
    slug?: string;
    logo_url?: string;
};

export type OrderHistory = {
    id: string;
    order_id?: string;
    actor_id?: string | null;
    actor_type?: string;
    event?: string;
    title?: string;
    description?: string;
    from_order_status?: string;
    to_order_status?: string;
    from_payment_status?: string;
    to_payment_status?: string;
    from_fulfillment_status?: string;
    to_fulfillment_status?: string;
    from_shipping_status?: string;
    to_shipping_status?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
};

export type OrderDetail = {
    id: string;
    order_number: string;

    store_id: string;
    user_id: string;
    address_id?: string;

    subtotal_amount: number;
    shipping_amount: number;
    discount_amount: number;
    service_fee: number;
    total_amount: number;

    payment_status: string;
    fulfillment_status: string;
    order_status: string;

    note?: string;

    paid_at?: string | null;
    expired_at?: string | null;

    created_at: string;
    updated_at: string;

    store?: OrderStore;
    order_items?: OrderItem[];
    shipments?: OrderShipment[];
    payment?: OrderPayment;
    histories?: OrderHistory[];
};

export type GetCustomerOrdersParams = {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderType?: "asc" | "desc";
    search?: string;
    searchBy?: string;
};

export type GetCustomerOrdersResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: OrderDetail[];
        limit: number;
        page: number;
        total: number;
    };
};

export type GetOrderByOrderNumberResponse = {
    responseMessage: string;
    responseCode: string;
    result: OrderDetail;
};

export type RetryOrderPaymentResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        order_id: string;
        order_number: string;
        payment_id: string;
        total_amount: number;
        provider_transaction_id?: string;
        payment_url?: string;
        va_number?: string;
        qr_string?: string;
        payment_status: string;
    };
};

export async function getCustomerOrders(params?: GetCustomerOrdersParams) {
    const response = await api.get<GetCustomerOrdersResponse>("/customer/orders", {
        params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            order_by: params?.orderBy ?? "created_at",
            order_type: params?.orderType ?? "desc",
            search_by: params?.searchBy ?? "order_number",
            search: params?.search ?? "",
        },
    });

    return response.data.result;
}

export async function getOrderByOrderNumber(orderNumber: string) {
    const response = await api.get<GetOrderByOrderNumberResponse>(
        `/customer/orders/${orderNumber}`,
    );

    return response.data.result;
}

export async function retryOrderPayment(
    orderNumber: string,
    paymentMethodId: string,
) {
    const response = await api.post<RetryOrderPaymentResponse>(
        `/customer/orders/${orderNumber}/payments/retry`,
        {
            payment_method_id: paymentMethodId,
        },
    );

    return response.data.result;
}
