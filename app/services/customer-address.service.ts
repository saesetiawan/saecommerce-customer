import { api } from "@/app/lib/axios";

export type CustomerAddressApi = {
    id: string;
    user_id: string;

    receiver_name: string;
    receiver_phone: string;

    province: string;
    city: string;
    district: string;

    address: string;
    postal_code: string;

    latitude: number | null;
    longitude: number | null;

    is_default: boolean;

    rajaongkir_destination_id: string;

    province_id: string;
    city_id: string;
    district_id: string;
    subdistrict_id: string;

    province_name: string;
    city_name: string;
    district_name: string;
    subdistrict_name: string;

    created_at: string;
    updated_at: string;
};

export type CustomerAddress = {
    id: string;
    userId: string;

    receiverName: string;
    receiverPhone: string;

    province: string;
    city: string;
    district: string;
    subdistrict: string;

    provinceId: string;
    cityId: string;
    districtId: string;
    subdistrictId: string;

    provinceName: string;
    cityName: string;
    districtName: string;
    subdistrictName: string;

    address: string;
    postalCode: string;

    latitude: number | null;
    longitude: number | null;

    isDefault: boolean;
    rajaongkirDestinationId: string;

    createdAt: string;
    updatedAt: string;
};

export type CustomerAddressPayload = {
    address: string;
    postal_code: string;

    sub_district_id: string;
    district_id: string;
    city_id: string;
    province_id: string;

    sub_district: string;
    district: string;
    city: string;
    province: string;

    receiver_name: string;
    receiver_phone: string;

    is_default?: boolean;
};

export type CustomerAddressListParams = {
    page?: number;
    limit?: number;
    orderBy?: string;
    searchBy?: string;
    search?: string;
    orderType?: "asc" | "desc";
};

type CustomerAddressListResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: CustomerAddressApi[];
        limit: number;
        page: number;
        total: number;
    };
};

type CustomerAddressDetailResponse = {
    responseMessage: string;
    responseCode: string;
    result: CustomerAddressApi;
};

function mapAddressApiToAddress(address: CustomerAddressApi): CustomerAddress {
    return {
        id: address.id,
        userId: address.user_id,

        receiverName: address.receiver_name,
        receiverPhone: address.receiver_phone,

        province: address.province,
        city: address.city,
        district: address.district,
        subdistrict: address.subdistrict_name,

        provinceId: address.province_id,
        cityId: address.city_id,
        districtId: address.district_id,
        subdistrictId: address.subdistrict_id,

        provinceName: address.province_name || address.province,
        cityName: address.city_name || address.city,
        districtName: address.district_name || address.district,
        subdistrictName: address.subdistrict_name,

        address: address.address,
        postalCode: address.postal_code,

        latitude: address.latitude,
        longitude: address.longitude,

        isDefault: address.is_default,
        rajaongkirDestinationId:
            address.rajaongkir_destination_id || address.subdistrict_id,

        createdAt: address.created_at,
        updatedAt: address.updated_at,
    };
}

export async function getCustomerAddresses(params?: CustomerAddressListParams) {
    const response = await api.get<CustomerAddressListResponse>(
        "/customer/addresses",
        {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 20,
                order_by: params?.orderBy ?? "created_at",
                search_by: params?.searchBy ?? "receiver_name",
                search: params?.search ?? "",
                order_type: params?.orderType ?? "desc",
            },
        },
    );

    return {
        data: response.data.result.data.map(mapAddressApiToAddress),
        pagination: {
            page: response.data.result.page,
            limit: response.data.result.limit,
            total: response.data.result.total,
        },
    };
}

export async function createCustomerAddress(payload: CustomerAddressPayload) {
    const response = await api.post<CustomerAddressDetailResponse>(
        "/customer/addresses",
        payload,
    );

    return mapAddressApiToAddress(response.data.result);
}

export async function updateCustomerAddress(
    addressId: string,
    payload: CustomerAddressPayload,
) {
    const response = await api.put<CustomerAddressDetailResponse>(
        `/customer/addresses/${addressId}`,
        payload,
    );

    return mapAddressApiToAddress(response.data.result);
}