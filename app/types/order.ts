export type OrderStatus =
    | "WAITING_PAYMENT"
    | "PAID"
    | "PROCESSING"
    | "SHIPPED"
    | "COMPLETED"
    | "CANCELLED";

export type PaymentMethod = "VA" | "QRIS";

export type OrderItem = {
    id: string;
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    quantity: number;
};

export type ShippingAddress = {
    receiverName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
};

export type Payment = {
    method: PaymentMethod;
    bankCode?: string;
    bankName?: string;
    paymentCode: string;
    expiredAt: string;
    paidAt?: string;
};

export type Order = {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    createdAt: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    shippingMethod: string;
    shippingCost: number;
    serviceFee: number;
    productDiscount: number;
    subtotal: number;
    totalPayment: number;
    payment: Payment;
    trackingNumber?: string;
};