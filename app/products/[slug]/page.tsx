"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    Eye,
    Loader2,
    Package,
    Ruler,
    ShoppingCart,
    Store,
    Tag,
    Truck,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import { Product, ProductVariant } from "@/app/types/product";
import { getPublicProductBySlug } from "@/app/services/product.service";
import { addToCart } from "@/app/services/cart.service";
import { toast } from 'sonner';

function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
}

function calculateDiscountPercent(price: number, comparePrice: number) {
    if (!comparePrice || comparePrice <= price) {
        return 0;
    }

    return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export default function ProductDetailPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] =
        useState<ProductVariant | null>(null);
    const [selectedImage, setSelectedImage] = useState("");
    const [quantity, setQuantity] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchProduct = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const data = await getPublicProductBySlug(params.slug);

            const defaultVariant = data.defaultVariant ?? data.variants[0] ?? null;
            const defaultImage =
                defaultVariant?.imageUrl || data.image || "/placeholder-product.png";

            setProduct(data);
            setSelectedVariant(defaultVariant);
            setSelectedImage(defaultImage);
            setQuantity(1);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil detail produk.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [params.slug]);

    const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
    const currentComparePrice =
        selectedVariant?.comparePrice ?? product?.comparePrice ?? 0;
    const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
    const currentSku = selectedVariant?.sku ?? product?.sku ?? "-";
    const currentWeight = selectedVariant?.weight ?? product?.weight ?? 0;

    const hasStock = currentStock > 0;
    const hasMultipleVariants = (product?.variants.length ?? 0) > 1;

    const discountPercent = calculateDiscountPercent(
        currentPrice,
        currentComparePrice,
    );

    const totalPrice = useMemo(() => {
        return currentPrice * quantity;
    }, [currentPrice, quantity]);

    const increaseQuantity = () => {
        setQuantity((value) => {
            if (currentStock <= 0) {
                return 1;
            }

            return Math.min(value + 1, currentStock);
        });
    };

    const decreaseQuantity = () => {
        setQuantity((value) => Math.max(1, value - 1));
    };

    const handleSelectVariant = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        setQuantity(1);

        if (variant.imageUrl) {
            setSelectedImage(variant.imageUrl);
        }
    };

    const handleAddToCart = async () => {
        if (!product || !selectedVariant || isAddingToCart) {
            return;
        }

        if (selectedVariant.stock <= 0) {
            return;
        }

        setIsAddingToCart(true);

        try {
            await addToCart({
                product_id: product.id,
                product_variant_id: selectedVariant.id,
                quantity,
            });

            toast.success("Product berhasil ditambahkan")
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal menambahkan produk ke keranjang.",
            );
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product || !selectedVariant || isAddingToCart) {
            return;
        }

        if (selectedVariant.stock <= 0) {
            return;
        }
        setIsAddingToCart(true);
        try {
            await addToCart({
                product_id: product.id,
                product_variant_id: selectedVariant.id,
                quantity,
            });
            router.push("/cart");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal menambahkan produk ke keranjang.",
            );
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (isLoading) {
        return (
            <main className={`min-h-screen ${theme.colors.neutral.page}`}>
                <Navbar />

                <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
                    <div
                        className={`flex min-h-[420px] items-center justify-center rounded-2xl border ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div className="flex items-center gap-3">
                            <Loader2 className={`animate-spin ${theme.colors.primary.text}`} />

                            <span className={`font-semibold ${theme.colors.neutral.body}`}>
                Memuat detail produk...
              </span>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    if (errorMessage || !product) {
        return (
            <main className={`min-h-screen ${theme.colors.neutral.page}`}>
                <Navbar />

                <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
                    <div
                        className={`rounded-2xl border p-10 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <h1 className={`text-2xl font-bold ${theme.colors.neutral.title}`}>
                            Produk tidak ditemukan
                        </h1>

                        <p className={`mt-2 ${theme.colors.neutral.body}`}>
                            {errorMessage || "Produk yang kamu cari tidak tersedia."}
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={fetchProduct}
                                className={`px-5 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                            >
                                Coba Lagi
                            </button>

                            <Link
                                href="/products"
                                className={`border px-5 py-3 font-bold ${theme.radius.button} ${theme.colors.neutral.border} ${theme.colors.neutral.title} hover:bg-slate-50`}
                            >
                                Kembali ke Produk
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <Link
                    href="/products"
                    className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.colors.neutral.body} hover:text-pink-600`}
                >
                    <ArrowLeft size={16} />
                    Kembali ke produk
                </Link>

                <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                    <div className="grid gap-6 lg:grid-cols-[520px_1fr]">
                        <div>
                            <div
                                className={`relative aspect-square overflow-hidden rounded-3xl border bg-white ${theme.colors.neutral.border}`}
                            >
                                <Image
                                    src={selectedImage || product.image}
                                    alt={product.name}
                                    fill
                                    priority
                                    sizes="(min-width: 1024px) 520px, 100vw"
                                    className="object-cover"
                                />
                            </div>

                            {product.images.length > 1 ? (
                                <div className="mt-4 grid grid-cols-5 gap-3">
                                    {product.images.map((image) => {
                                        const isActive = selectedImage === image;

                                        return (
                                            <button
                                                key={image}
                                                type="button"
                                                onClick={() => setSelectedImage(image)}
                                                className={`relative aspect-square overflow-hidden rounded-2xl border ${
                                                    isActive
                                                        ? theme.colors.primary.border
                                                        : theme.colors.neutral.border
                                                }`}
                                            >
                                                <Image
                                                    src={image}
                                                    alt={product.name}
                                                    fill
                                                    sizes="96px"
                                                    className="object-cover"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={`/categories/${product.categorySlug}`}
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                >
                                    {product.category}
                                </Link>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${theme.colors.accent.soft} ${theme.colors.accent.text}`}
                                >
                  {product.brand}
                </span>

                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                  {product.status}
                </span>
                            </div>

                            <h1
                                className={`mt-4 text-2xl font-extrabold leading-tight sm:text-4xl ${theme.colors.neutral.title}`}
                            >
                                {product.name}
                            </h1>

                            <p className={`mt-3 text-sm sm:text-base ${theme.colors.neutral.body}`}>
                                {product.shortDescription}
                            </p>

                            <div className="mt-5">
                                <div className="flex flex-wrap items-end gap-3">
                                    <p
                                        className={`text-3xl font-extrabold ${theme.colors.primary.text}`}
                                    >
                                        {formatCurrency(currentPrice)}
                                    </p>

                                    {currentComparePrice > currentPrice ? (
                                        <p className="pb-1 text-sm font-semibold text-slate-400 line-through">
                                            {formatCurrency(currentComparePrice)}
                                        </p>
                                    ) : null}

                                    {discountPercent > 0 ? (
                                        <span className="mb-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                      Hemat {discountPercent}%
                    </span>
                                    ) : null}
                                </div>

                                {product.minPrice !== product.maxPrice ? (
                                    <p className={`mt-1 text-sm ${theme.colors.neutral.body}`}>
                                        Rentang harga {formatCurrency(product.minPrice)} -{" "}
                                        {formatCurrency(product.maxPrice)}
                                    </p>
                                ) : null}
                            </div>

                            {product.variants.length > 0 ? (
                                <section
                                    className={`mt-6 rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                            Pilih Varian
                                        </h2>

                                        <span className={`text-sm ${theme.colors.neutral.body}`}>
                      {product.variants.length} varian tersedia
                    </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {product.variants.map((variant) => {
                                            const isActive = selectedVariant?.id === variant.id;
                                            const isOutOfStock = variant.stock <= 0;

                                            return (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    disabled={isOutOfStock}
                                                    onClick={() => handleSelectVariant(variant)}
                                                    className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        isActive
                                                            ? `${theme.colors.primary.border} ${theme.colors.primary.soft}`
                                                            : `${theme.colors.neutral.border} hover:bg-pink-50`
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p
                                                                className={`font-bold ${theme.colors.neutral.title}`}
                                                            >
                                                                {variant.name}
                                                            </p>

                                                            <p className={`mt-1 text-xs ${theme.colors.neutral.body}`}>
                                                                SKU: {variant.sku}
                                                            </p>
                                                        </div>

                                                        {isActive ? (
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-bold ${theme.colors.primary.bg} text-white`}
                                                            >
                                Dipilih
                              </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-3">
                                                        <p className={`font-extrabold ${theme.colors.primary.text}`}>
                                                            {formatCurrency(variant.price)}
                                                        </p>

                                                        {variant.comparePrice > variant.price ? (
                                                            <p className="text-xs text-slate-400 line-through">
                                                                {formatCurrency(variant.comparePrice)}
                                                            </p>
                                                        ) : null}

                                                        <p
                                                            className={`mt-1 text-xs font-semibold ${
                                                                variant.stock > 0
                                                                    ? "text-emerald-600"
                                                                    : "text-red-500"
                                                            }`}
                                                        >
                                                            {variant.stock > 0
                                                                ? `Stok ${variant.stock}`
                                                                : "Stok habis"}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : null}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div
                                    className={`rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Package size={18} className={theme.colors.primary.text} />
                                        <span className={`text-sm font-bold ${theme.colors.neutral.title}`}>
                      SKU
                    </span>
                                    </div>

                                    <p className={`mt-2 break-all text-sm ${theme.colors.neutral.body}`}>
                                        {currentSku}
                                    </p>
                                </div>

                                <div
                                    className={`rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Eye size={18} className={theme.colors.primary.text} />
                                        <span className={`text-sm font-bold ${theme.colors.neutral.title}`}>
                      Dilihat
                    </span>
                                    </div>

                                    <p className={`mt-2 text-sm ${theme.colors.neutral.body}`}>
                                        {product.totalViews} kali
                                    </p>
                                </div>

                                <div
                                    className={`rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Truck size={18} className={theme.colors.primary.text} />
                                        <span className={`text-sm font-bold ${theme.colors.neutral.title}`}>
                      Berat
                    </span>
                                    </div>

                                    <p className={`mt-2 text-sm ${theme.colors.neutral.body}`}>
                                        {currentWeight} gram
                                    </p>
                                </div>

                                <div
                                    className={`rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Ruler size={18} className={theme.colors.primary.text} />
                                        <span className={`text-sm font-bold ${theme.colors.neutral.title}`}>
                      Dimensi
                    </span>
                                    </div>

                                    <p className={`mt-2 text-sm ${theme.colors.neutral.body}`}>
                                        {product.length} x {product.width} x {product.height} cm
                                    </p>
                                </div>
                            </div>

                            <section
                                className={`mt-6 rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <h2 className={`text-lg font-bold ${theme.colors.neutral.title}`}>
                                    Deskripsi Produk
                                </h2>

                                <p
                                    className={`mt-3 whitespace-pre-line text-sm leading-6 ${theme.colors.neutral.body}`}
                                >
                                    {product.description}
                                </p>
                            </section>

                            <section
                                className={`mt-6 rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-100">
                                        {product.storeLogoUrl ? (
                                            <Image
                                                src={product.storeLogoUrl}
                                                alt={product.storeName}
                                                fill
                                                sizes="56px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={`flex h-full w-full items-center justify-center ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                            >
                                                <Store size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                            {product.storeName}
                                        </h2>

                                        <p className={`text-sm ${theme.colors.neutral.body}`}>
                                            Rating {product.storeRating} •{" "}
                                            {product.storeTotalFollowers} followers
                                        </p>
                                    </div>
                                </div>

                                {product.storeDescription ? (
                                    <p className={`mt-4 text-sm ${theme.colors.neutral.body}`}>
                                        {product.storeDescription}
                                    </p>
                                ) : null}
                            </section>
                        </div>
                    </div>

                    <aside
                        className={`h-fit rounded-2xl border p-5 lg:sticky lg:top-32 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                            Atur Pembelian
                        </h2>

                        <div
                            className={`mt-4 rounded-2xl border p-4 ${theme.colors.neutral.border}`}
                        >
                            <p className={`text-sm font-semibold ${theme.colors.neutral.body}`}>
                                Varian dipilih
                            </p>

                            <p className={`mt-1 font-bold ${theme.colors.neutral.title}`}>
                                {selectedVariant?.name ?? "Belum ada varian"}
                            </p>

                            <p
                                className={`mt-1 text-xs font-semibold ${
                                    hasStock ? "text-emerald-600" : "text-red-500"
                                }`}
                            >
                                {hasStock ? `Stok tersedia ${currentStock}` : "Stok habis"}
                            </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
              <span className={`font-semibold ${theme.colors.neutral.body}`}>
                Jumlah
              </span>

                            <div className="flex items-center overflow-hidden rounded-full border border-slate-200">
                                <button
                                    type="button"
                                    onClick={decreaseQuantity}
                                    disabled={!hasStock || quantity <= 1}
                                    className="h-10 w-10 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    -
                                </button>

                                <div className="flex h-10 w-12 items-center justify-center text-sm font-bold text-slate-900">
                                    {quantity}
                                </div>

                                <button
                                    type="button"
                                    onClick={increaseQuantity}
                                    disabled={!hasStock || quantity >= currentStock}
                                    className="h-10 w-10 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {hasStock && quantity >= currentStock ? (
                            <p className="mt-2 text-right text-xs font-semibold text-orange-500">
                                Jumlah sudah mencapai stok maksimum.
                            </p>
                        ) : null}

                        <div className="mt-5 border-t border-slate-100 pt-5">
                            <div className="flex items-center justify-between">
                <span className={`font-semibold ${theme.colors.neutral.body}`}>
                  Subtotal
                </span>

                                <span className={`text-xl font-extrabold ${theme.colors.primary.text}`}>
                  {formatCurrency(totalPrice)}
                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                            <button
                                type="button"
                                disabled={!selectedVariant || !hasStock || isAddingToCart}
                                onClick={handleAddToCart}
                                className={`flex items-center justify-center gap-2 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                            >
                                <ShoppingCart size={18} />

                                {isAddingToCart
                                    ? "Menambahkan..."
                                    : hasStock
                                        ? "Tambah ke Keranjang"
                                        : "Stok Habis"}
                            </button>

                            <button
                                type="button"
                                disabled={!selectedVariant || !hasStock || isAddingToCart}
                                onClick={handleBuyNow}
                                className={`flex items-center justify-center gap-2 border px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${theme.radius.button} ${theme.colors.neutral.border} ${theme.colors.neutral.title} hover:bg-slate-50`}
                            >
                                Beli Sekarang
                            </button>
                        </div>

                        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                            <div className={`flex items-center gap-2 text-sm ${theme.colors.neutral.body}`}>
                                <Tag size={16} />
                                Kategori: {product.category}
                            </div>

                            <div className={`flex items-center gap-2 text-sm ${theme.colors.neutral.body}`}>
                                <Building2 size={16} />
                                Brand: {product.brand}
                            </div>

                            <div className={`flex items-center gap-2 text-sm ${theme.colors.neutral.body}`}>
                                <Package size={16} />
                                Terjual: {product.totalSold}
                            </div>

                            {hasMultipleVariants ? (
                                <div
                                    className={`flex items-center gap-2 text-sm ${theme.colors.neutral.body}`}
                                >
                                    <Package size={16} />
                                    Total Varian: {product.variants.length}
                                </div>
                            ) : null}
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
