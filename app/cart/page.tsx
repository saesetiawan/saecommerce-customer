"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import {
    ArrowLeft,
    Loader2,
    Minus,
    Package,
    Plus,
    ShoppingBag,
    ShoppingCart,
    Store,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import {
    getCartItems,
    updateCartItemQuantity,
} from "@/app/services/cart.service";
import { CartItem } from '@/app/types/cart';
import { useRouter } from 'next/navigation';

function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
}

function getSelectedStoreIds(items: CartItem[]) {
    return Array.from(
        new Set(
            items
                .map((item) => item.storeId)
                .filter(Boolean),
        ),
    );
}

export default function CartPage() {
    const router = useRouter()
    const [items, setItems] = useState<CartItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [updatingItemIds, setUpdatingItemIds] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchCartItems = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const data = await getCartItems();

            setItems(data);

            /**
             * Default: semua item langsung dipilih.
             * Kalau mau default tidak dipilih, ganti jadi setSelectedItemIds([]).
             */
            setSelectedItemIds(data.map((item) => item.id));
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil data keranjang.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, []);

    const selectedItems = useMemo(() => {
        return items.filter((item) => selectedItemIds.includes(item.id));
    }, [items, selectedItemIds]);

    const isAllSelected = useMemo(() => {
        return items.length > 0 && selectedItemIds.length === items.length;
    }, [items.length, selectedItemIds.length]);

    const totalQuantity = useMemo(() => {
        return selectedItems.reduce((total, item) => total + item.quantity, 0);
    }, [selectedItems]);

    const totalPrice = useMemo(() => {
        return selectedItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0,
        );
    }, [selectedItems]);
    const selectedStoreIds = useMemo(() => {
        return getSelectedStoreIds(selectedItems);
    }, [selectedItems]);
    const selectedStoreNames = useMemo(() => {
        return Array.from(
            new Set(
                selectedItems
                    .map((item) => item.storeName)
                    .filter(Boolean),
            ),
        );
    }, [selectedItems]);
    const isMultiStoreSelection =
        selectedStoreIds.length > 1;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedItemIds([]);
            return;
        }

        setSelectedItemIds(items.map((item) => item.id));
    };

    const handleSelectItem = (cartItemId: string) => {
        setSelectedItemIds((previous) => {
            const isSelected = previous.includes(cartItemId);

            if (isSelected) {
                return previous.filter((id) => id !== cartItemId);
            }

            return [...previous, cartItemId];
        });
    };

    const setItemUpdating = (cartItemId: string, isUpdating: boolean) => {
        setUpdatingItemIds((previous) => {
            if (isUpdating) {
                return previous.includes(cartItemId)
                    ? previous
                    : [...previous, cartItemId];
            }

            return previous.filter((id) => id !== cartItemId);
        });
    };

    const updateQuantityLocal = (cartItemId: string, quantity: number) => {
        setItems((previous) =>
            previous.map((item) => {
                if (item.id !== cartItemId) {
                    return item;
                }

                return {
                    ...item,
                    quantity,
                    subtotal: item.price * quantity,
                };
            }),
        );
    };

    const handleChangeQuantity = async (
        cartItem: CartItem,
        nextQuantity: number,
    ) => {
        if (nextQuantity < 0) {
            return;
        }

        if (nextQuantity > cartItem.variantStock) {
            toast.error("Quantity tidak boleh melebihi stok.");
            return;
        }

        const previousQuantity = cartItem.quantity;

        /**
         * Optimistic update: UI berubah dulu.
         */
        updateQuantityLocal(cartItem.id, nextQuantity);
        setItemUpdating(cartItem.id, true);

        try {
            /**
             * Kalau backend belum punya endpoint update quantity,
             * comment baris ini dulu.
             */
            await updateCartItemQuantity(cartItem.id, nextQuantity);

            toast.success("Quantity keranjang berhasil diperbarui.");
        } catch (error) {
            /**
             * Rollback kalau API gagal.
             */
            updateQuantityLocal(cartItem.id, previousQuantity);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal memperbarui quantity keranjang.",
            );
        } finally {
            setItemUpdating(cartItem.id, false);
        }
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            toast.error("Pilih minimal satu item untuk checkout.");
            return;
        }

        if (isMultiStoreSelection) {
            toast.error("Checkout hanya bisa untuk 1 toko. Pilih item dari satu toko saja.");
            return;
        }

        localStorage.setItem(
            "checkout_cart_item_ids",
            JSON.stringify(selectedItemIds),
        );

        router.push('/checkout')
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <Link
                    href="/products"
                    className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.colors.neutral.body} hover:text-pink-600`}
                >
                    <ArrowLeft size={16} />
                    Lanjut Belanja
                </Link>

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className={`font-semibold ${theme.colors.primary.text}`}>
                            Keranjang
                        </p>

                        <h1
                            className={`mt-2 text-2xl font-extrabold sm:text-4xl ${theme.colors.neutral.title}`}
                        >
                            Keranjang Belanja
                        </h1>

                        <p className={`mt-2 text-sm sm:text-base ${theme.colors.neutral.body}`}>
                            Pilih produk yang ingin checkout dan atur jumlah belanja.
                        </p>
                    </div>

                    <div
                        className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                    >
                        {selectedItems.length} Produk Dipilih
                    </div>
                </div>

                {isLoading ? (
                    <div
                        className={`flex min-h-[360px] items-center justify-center rounded-2xl border ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div className="flex items-center gap-3">
                            <Loader2 className={`animate-spin ${theme.colors.primary.text}`} />

                            <span className={`font-semibold ${theme.colors.neutral.body}`}>
                Memuat keranjang...
              </span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div
                        className={`rounded-2xl border p-10 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                            Gagal memuat keranjang
                        </h2>

                        <p className={`mt-2 ${theme.colors.neutral.body}`}>
                            {errorMessage}
                        </p>

                        <button
                            type="button"
                            onClick={fetchCartItems}
                            className={`mt-6 px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div
                        className={`rounded-2xl border p-10 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div
                            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                        >
                            <ShoppingCart size={30} />
                        </div>

                        <h2 className={`mt-5 text-xl font-bold ${theme.colors.neutral.title}`}>
                            Keranjang masih kosong
                        </h2>

                        <p className={`mt-2 ${theme.colors.neutral.body}`}>
                            Yuk pilih produk kebutuhan anak dan keluarga.
                        </p>

                        <Link
                            href="/products"
                            className={`mt-6 inline-flex px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                        <div className="space-y-4">
                            <div
                                className={`flex items-center justify-between rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="h-5 w-5 rounded border-slate-300 accent-pink-500"
                                    />

                                    <span className={`font-bold ${theme.colors.neutral.title}`}>
                    Pilih Semua
                  </span>
                                </label>

                                <span className={`text-sm ${theme.colors.neutral.body}`}>
                  {selectedItems.length} dari {items.length} produk dipilih
                </span>
                            </div>

                            {items.filter((item) =>  item.quantity > 0).map((item) => {
                                const isSelected = selectedItemIds.includes(item.id);
                                const isUpdating = updatingItemIds.includes(item.id);
                                const isMaxQuantity = item.quantity >= item.variantStock;

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-2xl border p-4 transition ${
                                            isSelected
                                                ? `${theme.colors.neutral.card} ${theme.colors.primary.border}`
                                                : `${theme.colors.neutral.card} ${theme.colors.neutral.border}`
                                        }`}
                                    >
                                        <div className="grid gap-4 sm:grid-cols-[32px_120px_1fr]">
                                            <div className="pt-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectItem(item.id)}
                                                    className="h-5 w-5 rounded border-slate-300 accent-pink-500"
                                                />
                                            </div>

                                            <Link
                                                href={`/products/${item.productSlug}`}
                                                className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                                            >
                                                <Image
                                                    src={item.productImage}
                                                    alt={item.productName}
                                                    fill
                                                    sizes="120px"
                                                    className="object-cover"
                                                />
                                            </Link>

                                            <div className="min-w-0">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/products/${item.productSlug}`}
                                                            className={`line-clamp-2 text-lg font-bold ${theme.colors.neutral.title} hover:text-pink-600`}
                                                        >
                                                            {item.productName}
                                                        </Link>

                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                              >
                                {item.variantName}
                              </span>

                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs ${theme.colors.accent.soft} ${theme.colors.accent.text}`}
                                                            >
                                {item.brandName}
                              </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-left sm:text-right">
                                                        <p
                                                            className={`text-lg font-extrabold ${theme.colors.primary.text}`}
                                                        >
                                                            {formatCurrency(item.price)}
                                                        </p>

                                                        {item.variantComparePrice > item.price ? (
                                                            <p className="text-xs text-slate-400 line-through">
                                                                {formatCurrency(item.variantComparePrice)}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                                                    <div
                                                        className={`rounded-xl border p-3 ${theme.colors.neutral.border}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Store
                                                                size={15}
                                                                className={theme.colors.primary.text}
                                                            />
                                                            <span className={theme.colors.neutral.body}>
                                Toko
                              </span>
                                                        </div>

                                                        <p
                                                            className={`mt-1 truncate font-bold ${theme.colors.neutral.title}`}
                                                        >
                                                            {item.storeName}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`rounded-xl border p-3 ${theme.colors.neutral.border}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Package
                                                                size={15}
                                                                className={theme.colors.primary.text}
                                                            />
                                                            <span className={theme.colors.neutral.body}>
                                SKU
                              </span>
                                                        </div>

                                                        <p
                                                            className={`mt-1 truncate font-bold ${theme.colors.neutral.title}`}
                                                        >
                                                            {item.variantSku}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`rounded-xl border p-3 ${theme.colors.neutral.border}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <ShoppingBag
                                                                size={15}
                                                                className={theme.colors.primary.text}
                                                            />
                                                            <span className={theme.colors.neutral.body}>
                                Stok
                              </span>
                                                        </div>

                                                        <p
                                                            className={`mt-1 font-bold ${
                                                                item.variantStock > 0
                                                                    ? "text-emerald-600"
                                                                    : "text-red-500"
                                                            }`}
                                                        >
                                                            {item.variantStock}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p
                                                            className={`mb-2 text-sm font-semibold ${theme.colors.neutral.body}`}
                                                        >
                                                            Jumlah
                                                        </p>

                                                        <div className="flex w-fit items-center overflow-hidden rounded-full border border-slate-200">
                                                            <button
                                                                type="button"
                                                                disabled={item.quantity < 0 || isUpdating}
                                                                onClick={() =>
                                                                    handleChangeQuantity(item, item.quantity - 1)
                                                                }
                                                                className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Minus size={16} />
                                                            </button>

                                                            <div className="flex h-10 w-14 items-center justify-center text-sm font-bold text-slate-900">
                                                                {isUpdating ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isMaxQuantity ||
                                                                    item.variantStock <= 0 ||
                                                                    isUpdating
                                                                }
                                                                onClick={() =>
                                                                    handleChangeQuantity(item, item.quantity + 1)
                                                                }
                                                                className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>

                                                        {isMaxQuantity ? (
                                                            <p className="mt-2 text-xs font-semibold text-orange-500">
                                                                Sudah mencapai stok maksimum.
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="text-left sm:text-right">
                            <span
                                className={`text-sm font-semibold ${theme.colors.neutral.body}`}
                            >
                              Subtotal
                            </span>

                                                        <p
                                                            className={`text-xl font-extrabold ${theme.colors.neutral.title}`}
                                                        >
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <aside
                            className={`h-fit rounded-2xl border p-5 lg:sticky lg:top-32 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                        >
                            <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                                Ringkasan Belanja
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-center justify-between">
                  <span className={theme.colors.neutral.body}>
                    Produk Dipilih
                  </span>

                                    <span className={`font-bold ${theme.colors.neutral.title}`}>
                    {selectedItems.length}
                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={theme.colors.neutral.body}>Total Item</span>

                                    <span className={`font-bold ${theme.colors.neutral.title}`}>
                    {totalQuantity}
                  </span>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center justify-between">
                    <span className={`font-bold ${theme.colors.neutral.title}`}>
                      Total Harga
                    </span>

                                        <span
                                            className={`text-2xl font-extrabold ${theme.colors.primary.text}`}
                                        >
                      {formatCurrency(totalPrice)}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={selectedItems.length === 0 || isMultiStoreSelection}
                                onClick={handleCheckout}
                                className={`mt-6 flex w-full items-center justify-center gap-2 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                            >
                                Checkout
                            </button>

                            {isMultiStoreSelection ? (
                                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-700">
                                    <p className="font-extrabold text-orange-800">
                                        Checkout hanya bisa untuk 1 toko.
                                    </p>
                                    <p className="mt-1">
                                        Kamu memilih produk dari {selectedStoreIds.length} toko
                                        {selectedStoreNames.length > 0
                                            ? `: ${selectedStoreNames.join(", ")}`
                                            : "."}
                                        . Hapus centang produk dari toko lain untuk melanjutkan.
                                    </p>
                                </div>
                            ) : null}

                            <Link
                                href="/products"
                                className={`mt-3 flex w-full items-center justify-center gap-2 border px-5 py-3 font-bold ${theme.radius.button} ${theme.colors.neutral.border} ${theme.colors.neutral.title} hover:bg-slate-50`}
                            >
                                Tambah Produk Lain
                            </Link>

                            {selectedItems.length > 0 ? (
                                <p className={`mt-4 text-xs leading-5 ${theme.colors.neutral.body}`}>
                                    Hanya produk yang dicentang yang akan diproses ke checkout.
                                </p>
                            ) : null}
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}
