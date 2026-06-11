import { api } from "@/app/lib/axios";

export type PaymentMethodType = "virtual_account" | "qris";

export type PaymentMethodApi = {
    id: string;
    code: string;
    name: string;
    type: PaymentMethodType;
    service_fee: string | number;
    is_active: boolean;
    created_at: string;
};

export type PaymentMethod = {
    id: string;
    code: string;
    name: string;
    type: PaymentMethodType;
    serviceFee: number;
    isActive: boolean;
    createdAt: string;
};

type ActivePaymentMethodsResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: PaymentMethodApi[];
        limit: number;
        page: number;
        total: number;
    };
};

function mapPaymentMethodApiToPaymentMethod(
    item: PaymentMethodApi,
): PaymentMethod {
    return {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        serviceFee: Number(item.service_fee ?? 0),
        isActive: item.is_active,
        createdAt: item.created_at,
    };
}

export async function getActivePaymentMethods() {
    const response = await api.get<ActivePaymentMethodsResponse>(
        "/active/payment-methods",
    );

    return response.data.result.data.map(mapPaymentMethodApiToPaymentMethod);
}