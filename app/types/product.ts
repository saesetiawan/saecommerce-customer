export type ProductImageApi = {
    id: string;
    product_id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
};

export type ProductVariantApi = {
    id: string;
    product_id: string;
    sku: string;
    name: string;
    price: number;
    compare_price: number;
    stock: number;
    weight: number;
    image_url: string;
    created_at: string;
    updated_at: string;
};

export type ProductCategoryApi = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    icon_url: string;
    sort_order: number;
    created_at: string;
};

export type ProductBrandApi = {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    created_at: string;
};

export type ProductStoreApi = {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    logo_url: string;
    banner_url: string;
    description: string;
    status: string;
    rating: number;
    total_followers: number;
    created_at: string;
    updated_at: string;
    addresses: StoreAddressApi[],
};

export type ProductApi = {
    id: string;
    store_id: string;
    category_id: string;
    brand_id: string;
    sku: string;
    slug: string;
    name: string;
    short_description: string;
    description: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    min_price: number;
    max_price: number;
    status: string;
    total_sold: number;
    total_views: number;
    published_at: string;
    created_at: string;
    updated_at: string;
    store: ProductStoreApi;
    category: ProductCategoryApi;
    brand: ProductBrandApi;
    variants: ProductVariantApi[];
    images: ProductImageApi[];
};

export type ProductListResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: ProductApi[];
        limit?: number;
        page?: number;
        total?: number;
    };
};

export type ProductDetailResponse = {
    responseMessage: string;
    responseCode: string;
    result: ProductApi;
};

export type ProductVariant = {
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    comparePrice: number;
    stock: number;
    weight: number;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
};

export type Product = {
    id: string;
    storeId: string;
    categoryId: string;
    brandId: string;


    storeAddresses: StoreAddress[];
    storeDefaultAddress?: StoreAddress;

    name: string;
    slug: string;
    sku: string;

    price: number;
    minPrice: number;
    maxPrice: number;
    comparePrice: number;
    stock: number;

    image: string;
    images: string[];

    category: string;
    categorySlug: string;

    brand: string;
    brandSlug: string;
    brandLogoUrl: string;

    storeName: string;
    storeSlug: string;
    storeLogoUrl: string;
    storeBannerUrl: string;
    storeDescription: string;
    storeRating: number;
    storeTotalFollowers: number;

    shortDescription: string;
    description: string;

    weight: number;
    length: number;
    width: number;
    height: number;

    totalSold: number;
    totalViews: number;
    status: string;

    variants: ProductVariant[];
    defaultVariant?: ProductVariant;

    publishedAt: string;
    createdAt: string;
    updatedAt: string;
};

export type StoreAddressApi = {
    id: string;
    store_id: string;
    postal_code: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    is_default: boolean;
    rajaongkir_origin_id: string;

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

export type StoreAddress = {
    id: string;
    storeId: string;
    postalCode: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
    rajaongkirOriginId: string;

    provinceId: string;
    cityId: string;
    districtId: string;
    subdistrictId: string;

    provinceName: string;
    cityName: string;
    districtName: string;
    subdistrictName: string;

    createdAt: string;
    updatedAt: string;
};
