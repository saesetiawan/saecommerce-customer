import { api } from "@/app/lib/axios";
import {
    Product,
    ProductApi,
    ProductDetailResponse,
    ProductListResponse,
    ProductVariant,
    ProductVariantApi, StoreAddress, StoreAddressApi,
} from '@/app/types/product';

export function mapVariantApiToVariant(variant: ProductVariantApi): ProductVariant {
    return {
        id: variant.id,
        productId: variant.product_id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        comparePrice: variant.compare_price,
        stock: variant.stock,
        weight: variant.weight,
        imageUrl: variant.image_url,
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
    };
}

function mapProductApiToProduct(product: ProductApi): Product {
    const variants = product.variants?.map(mapVariantApiToVariant) ?? [];
    const defaultVariant = variants[0];

    const primaryImage =
        product.images?.find((image) => image.is_primary) ?? product.images?.[0];

    const variantImage = defaultVariant?.imageUrl || "";
    const productImage =
        variantImage || primaryImage?.image_url || "/placeholder-product.png";

    const storeAddresses =
        product.store?.addresses?.map(mapStoreAddressApiToStoreAddress) ?? [];

    const storeDefaultAddress =
        storeAddresses.find((address) => address.isDefault) ?? storeAddresses[0];

    return {
        id: product.id,
        storeId: product.store_id,
        categoryId: product.category_id,
        brandId: product.brand_id,
        storeAddresses,
        storeDefaultAddress,
        name: product.name,
        slug: product.slug,
        sku: defaultVariant?.sku ?? product.sku,

        price: defaultVariant?.price ?? product.min_price,
        minPrice: product.min_price,
        maxPrice: product.max_price,
        comparePrice: defaultVariant?.comparePrice ?? 0,
        stock: defaultVariant?.stock ?? 0,

        image: productImage,
        images:
            product.images && product.images.length > 0
                ? product.images.map((image) => image.image_url)
                : [productImage],

        category: product.category?.name ?? "-",
        categorySlug: product.category?.slug ?? "-",

        brand: product.brand?.name ?? "-",
        brandSlug: product.brand?.slug ?? "-",
        brandLogoUrl: product.brand?.logo_url ?? "",

        storeName: product.store?.name ?? "-",
        storeSlug: product.store?.slug ?? "-",
        storeLogoUrl: product.store?.logo_url ?? "",
        storeBannerUrl: product.store?.banner_url ?? "",
        storeDescription: product.store?.description ?? "",
        storeRating: product.store?.rating ?? 0,
        storeTotalFollowers: product.store?.total_followers ?? 0,

        shortDescription: product.short_description,
        description: product.description,

        weight: defaultVariant?.weight ?? product.weight,
        length: product.length,
        width: product.width,
        height: product.height,

        totalSold: product.total_sold,
        totalViews: product.total_views,
        status: product.status,

        variants,
        defaultVariant,

        publishedAt: product.published_at,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
    };
}

export type GetPublicProductsParams = {
    page?: number;
    limit?: number;
    orderBy?: string;
    searchBy?: string;
    search?: string;
    orderType?: "asc" | "desc";
};

export async function getPublicProducts(params?: GetPublicProductsParams) {
    const response = await api.get<ProductListResponse>("/public/products", {
        params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            order_by: params?.orderBy ?? "name",
            search_by: params?.searchBy ?? "name",
            search: params?.search ?? "",
            order_type: params?.orderType ?? "desc",
        },
    });

    const result = response.data.result;

    return {
        data: result.data.map(mapProductApiToProduct),
        pagination: {
            page: result.page ?? params?.page ?? 1,
            limit: result.limit ?? params?.limit ?? 20,
            total: result.total ?? result.data.length,
        },
    };
}

export async function getPublicProductBySlug(slug: string) {
    const response = await api.get<ProductDetailResponse>(
        `/public/products/${slug}`,
    );

    return mapProductApiToProduct(response.data.result);
}

export function mapStoreAddressApiToStoreAddress(
    address: StoreAddressApi,
): StoreAddress {
    return {
        id: address.id,
        storeId: address.store_id,
        postalCode: address.postal_code,
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: address.is_default,
        rajaongkirOriginId:
            address.rajaongkir_origin_id || address.subdistrict_id,

        provinceId: address.province_id,
        cityId: address.city_id,
        districtId: address.district_id,
        subdistrictId: address.subdistrict_id,

        provinceName: address.province_name,
        cityName: address.city_name,
        districtName: address.district_name,
        subdistrictName: address.subdistrict_name,

        createdAt: address.created_at,
        updatedAt: address.updated_at,
    };
}