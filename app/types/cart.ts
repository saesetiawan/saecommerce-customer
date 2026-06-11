import { ProductStoreApi, StoreAddress, StoreAddressApi } from '@/app/types/product';

export type AddToCartPayload = {
    product_id: string;
    product_variant_id: string;
    quantity: number;
};

export type AddToCartResponse = {
    responseMessage: string;
    responseCode: string;
    result?: unknown;
};

export type CartProductImageApi = {
    id: string;
    product_id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
};

export type CartProductStoreApi = {
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
};

export type CartProductCategoryApi = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    icon_url: string;
    sort_order: number;
    created_at: string;
};

export type CartProductBrandApi = {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    created_at: string;
};

export type CartProductApi = {
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
    category: CartProductCategoryApi;
    brand: CartProductBrandApi;
    variants: null;
    images: CartProductImageApi[];
};

export type CartProductVariantApi = {
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

export type CartItemApi = {
    id: string;
    cart_id: string;
    product_id: string;
    product_variant_id: string;
    quantity: number;
    price: number;
    product: CartProductApi;
    product_variant: CartProductVariantApi;
    created_at: string;
    updated_at: string;
};

export type CartItemsResponse = {
    responseMessage: string;
    responseCode: string;
    result: CartItemApi[];
};

export type CartItem = {
    id: string;
    cartId: string;
    productId: string;
    productVariantId: string;
    quantity: number;
    price: number;
    subtotal: number;
    storeId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    productSku: string;
    storeOriginId: string;
    variantName: string;
    variantSku: string;
    variantPrice: number;
    variantComparePrice: number;
    variantStock: number;
    variantWeight: number;
    storeOriginAddress: StoreAddress;
    storeName: string;
    categoryName: string;
    brandName: string;

    createdAt: string;
    updatedAt: string;
};