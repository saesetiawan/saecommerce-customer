import { api } from "@/app/lib/axios";

export type ProvinceOption = {
    id: number;
    name: string;
    rajaongkir_id: string;
};

export type CityOption = {
    id: number;
    province_id: number;
    name: string;
    type: string;
    rajaongkir_id: string;
};

export type DistrictOption = {
    id: number;
    city_id: number;
    name: string;
    rajaongkir_id: string;
};

export type SubdistrictOption = {
    id: number;
    district_id: number;
    name: string;
    rajaongkir_id: string;
};

type AddressOptionResponse<T> = {
    responseMessage: string;
    responseCode: string;
    result:  T[];
};
type CalculationShipmentResponse<T> = {
    responseMessage: string;
    responseCode: string;
    result: {
        meta: {
            message: string;
            code: number;
            status: string;
        };
        data: T[];
    };
};

export type CalculateDomesticCostPayload = {
    origin: string;
    destination: string;
    weight: number;
};

export type DomesticCourierOption = {
    name: string;
    code: string;
    service: string;
    description: string;
    cost: number;
    etd: string;
};

export async function getProvinceOptions() {
    const response = await api.get<AddressOptionResponse<ProvinceOption>>(
        "/address-options/provinces",
    );

    return response.data.result;
}

export async function getCityOptions(provinceId: string | number) {
    const response = await api.get<AddressOptionResponse<CityOption>>(
        "/address-options/cities",
        {
            params: {
                province_id: provinceId,
            },
        },
    );

    return response.data.result;
}

export async function getDistrictOptions(cityId: string | number) {
    const response = await api.get<AddressOptionResponse<DistrictOption>>(
        "/address-options/districts",
        {
            params: {
                city_id: cityId,
            },
        },
    );

    return response.data.result;
}

export async function getSubdistrictOptions(districtId: string | number) {
    const response = await api.get<AddressOptionResponse<SubdistrictOption>>(
        "/address-options/subdistricts",
        {
            params: {
                district_id: districtId,
            },
        },
    );

    return response.data.result;
}

export async function calculateDomesticCost(
    payload: CalculateDomesticCostPayload,
) {
    const response = await api.post<CalculationShipmentResponse<DomesticCourierOption>>(
        "/address-options/calculate-domestic-cost",
        payload,
    );

    return response.data.result.data;
}