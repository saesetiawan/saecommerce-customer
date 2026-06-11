import { api } from "@/app/lib/axios";
import { AddToCartPayload, AddToCartResponse, CartItem, CartItemApi, CartItemsResponse } from '@/app/types/cart';
import { mapStoreAddressApiToStoreAddress } from '@/app/services/product.service';
import { notifyCartChanged } from "@/app/lib/cart-events";


function mapCartItemApiToCartItem(item: CartItemApi): CartItem {
    const primaryImage =
        item.product.images?.find((image) => image.is_primary) ??
        item.product.images?.[0];

    const productImage =
        item.product_variant?.image_url ||
        primaryImage?.image_url ||
        "/placeholder-product.png";

    const price = item.price || item.product_variant.price;

    const storeAddresses =
        item.product.store?.addresses?.map(mapStoreAddressApiToStoreAddress) ?? [];

    const storeDefaultAddress =
        storeAddresses.find((address) => address.isDefault) ?? storeAddresses[0];

    return {
        storeOriginAddress: storeDefaultAddress,
        storeOriginId: storeDefaultAddress?.rajaongkirOriginId ?? storeDefaultAddress?.subdistrictId,
        id: item.id,
        cartId: item.cart_id,
        productId: item.product_id,
        productVariantId: item.product_variant_id,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,

        productName: item.product.name,
        productSlug: item.product.slug,
        productImage,
        productSku: item.product.sku,

        variantName: item.product_variant.name,
        variantSku: item.product_variant.sku,
        variantPrice: item.product_variant.price,
        variantComparePrice: item.product_variant.compare_price,
        variantStock: item.product_variant.stock,
        variantWeight: item.product_variant.weight,

        storeName: item.product.store?.name ?? "-",
        categoryName: item.product.category?.name ?? "-",
        brandName: item.product.brand?.name ?? "-",
        storeId: item?.product.store_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

export async function addToCart(payload: AddToCartPayload) {
    const response = await api.post<AddToCartResponse>(
        "/customer/cart/items",
        payload,
    );

    notifyCartChanged();

    return response.data;
}

export async function getCartItems() {
    const response = await api.get<CartItemsResponse>("/customer/cart/items");

    return response.data.result.map(mapCartItemApiToCartItem);
}

/**
 * Sesuaikan endpoint ini dengan backend kamu.
 * Rekomendasi backend:
 * PATCH /api/customer/cart/items/:id
 * body: { quantity: number }
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
    const response = await api.patch(`/customer/cart/items/${cartItemId}`, {
        quantity,
    });

    notifyCartChanged();

    return response.data;
}
