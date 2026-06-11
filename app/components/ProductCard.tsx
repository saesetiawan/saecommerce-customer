"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Product } from "@/app/types/product";
import { theme } from "@/app/config/theme";
import { addToCart } from "@/app/services/cart.service";

type Props = {
    product: Product;
};

function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
}

function calculateDiscountPercent(price: number, comparePrice: number) {
    if (!comparePrice || comparePrice <= price) {
        return 0;
    }

    return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export default function ProductCard({ product }: Props) {
    const router = useRouter();

    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const discountPercent = calculateDiscountPercent(
        product.price,
        product.comparePrice,
    );

    const hasStock = product.stock > 0;
    const hasMultipleVariants = product.variants.length > 1;

    const handleAddToCart = async () => {
        if (!hasStock || isAddingToCart) {
            return;
        }

        /**
         * Kalau produk punya banyak varian,
         * user harus pilih varian dulu di detail produk.
         */
        if (hasMultipleVariants) {
            router.push(`/products/${product.slug}`);
            return;
        }

        const productVariantId = product.defaultVariant?.id;

        if (!productVariantId) {
            router.push(`/products/${product.slug}`);
            return;
        }

        setIsAddingToCart(true);

        try {
            await addToCart({
                product_id: product.id,
                product_variant_id: productVariantId,
                quantity: 1,
            });
            toast.success("Product berhasil ditambahkan")
            router.refresh();
        } catch (error) {
            toast.error( error instanceof Error
                ? error.message
                : "Gagal menambahkan produk ke keranjang.")
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div
            className={`group overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
        >
            <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                    />

                    {discountPercent > 0 ? (
                        <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            -{discountPercent}%
                        </div>
                    ) : null}

                    {hasMultipleVariants ? (
                        <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-600 shadow-sm">
                            {product.variants.length} Varian
                        </div>
                    ) : null}

                    {!hasStock ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-red-500">
                Stok Habis
              </span>
                        </div>
                    ) : null}
                </div>

                <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p
                            className={`truncate text-xs font-semibold uppercase ${theme.colors.primary.text}`}
                        >
                            {product.category}
                        </p>

                        {product.defaultVariant?.name ? (
                            <span className="max-w-[45%] truncate rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                {product.defaultVariant.name}
              </span>
                        ) : null}
                    </div>

                    <h3
                        className={`line-clamp-2 min-h-[44px] font-semibold ${theme.colors.neutral.title}`}
                    >
                        {product.name}
                    </h3>

                    <p className={`line-clamp-2 text-sm ${theme.colors.neutral.body}`}>
                        {product.shortDescription}
                    </p>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-extrabold ${theme.colors.neutral.title}`}>
                                {formatCurrency(product.price)}
                            </p>

                            {product.comparePrice > product.price ? (
                                <p className="text-xs text-slate-400 line-through">
                                    {formatCurrency(product.comparePrice)}
                                </p>
                            ) : null}
                        </div>

                        {product.minPrice !== product.maxPrice ? (
                            <p className="text-xs text-slate-400">
                                mulai {formatCurrency(product.minPrice)} -{" "}
                                {formatCurrency(product.maxPrice)}
                            </p>
                        ) : null}

                        <p
                            className={`mt-1 text-xs font-semibold ${
                                hasStock ? "text-emerald-600" : "text-red-500"
                            }`}
                        >
                            {hasStock ? `Stok ${product.stock}` : "Stok habis"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
            <span
                className={`max-w-[60%] truncate rounded-full px-3 py-1 text-xs ${theme.colors.accent.soft} ${theme.colors.accent.text}`}
            >
              {product.brand}
            </span>

                        <span className="shrink-0 text-xs text-slate-400">
              Terjual {product.totalSold}
            </span>
                    </div>
                </div>
            </Link>

            <div className="px-4 pb-4">
                <button
                    type="button"
                    disabled={!hasStock || isAddingToCart}
                    onClick={handleAddToCart}
                    className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                >
                    {isAddingToCart ? (
                        <Loader2 size={17} className="animate-spin" />
                    ) : (
                        <ShoppingCart size={17} />
                    )}

                    {isAddingToCart
                        ? "Menambahkan..."
                        : hasStock
                            ? hasMultipleVariants
                                ? "Pilih Varian"
                                : "Tambah"
                            : "Habis"}
                </button>
            </div>
        </div>
    );
}
