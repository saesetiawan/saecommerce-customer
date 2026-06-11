import { api } from "@/app/lib/axios";

export type ProcessCheckoutPayload = {
    address_id: string;
    payment_method_id: string;
    orders: {
        store_id: string;
        cart_item_ids: string[];
        shipping: {
            origin_address_id: string;
            destination_address_id: string;
            courier_code: string;
            courier_service: string;
        };
    }[];
};

export type ProcessCheckoutResponse = {
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

export async function processCheckout(payload: ProcessCheckoutPayload) {
    const response = await api.post<ProcessCheckoutResponse>(
        "/customer/checkout",
        payload,
    );

    return response.data;
}
