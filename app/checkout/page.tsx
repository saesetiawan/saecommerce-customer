"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    Loader2,
    MapPin,
    MessageSquareText,
    QrCode,
    ShieldCheck,
    ShoppingCart,
    Store,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import { getCartItems } from "@/app/services/cart.service";
import {
    calculateDomesticCost,
    DomesticCourierOption,
} from "@/app/services/address-option.service";
import {
    getActivePaymentMethods,
    PaymentMethod,
    PaymentMethodType,
} from "@/app/services/payment-method.service";
import { processCheckout, ProcessCheckoutPayload } from '@/app/services/checkout.service';
import CheckoutAddressForm, {
    CheckoutAddressFormValue,
    initialCheckoutAddressValue,
} from "@/app/components/CheckoutAddressForm";
import { CartItem } from '@/app/types/cart';
import { notifyCartChanged } from "@/app/lib/cart-events";

type StoreCheckoutGroup = {
    storeId: string;
    storeName: string;
    items: CartItem[];
    subtotal: number;
    totalWeight: number;
};

type CourierOptionsByStore = Record<string, DomesticCourierOption[]>;
type SelectedCourierByStore = Record<string, DomesticCourierOption | undefined>;
type LoadingCourierByStore = Record<string, boolean>;

function formatCurrency(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}`;
}

function groupCartItemsByStore(items: CartItem[]) {
    return items.reduce<Record<string, CartItem[]>>((groups, item) => {
        const storeId = item.storeId || "unknown-store";

        if (!groups[storeId]) {
            groups[storeId] = [];
        }

        groups[storeId].push(item);

        return groups;
    }, {});
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

function getAddressSummary(address: CheckoutAddressFormValue) {
    const location = [
        address.subdistrict_name,
        address.district_name,
        address.city_name,
        address.province_name,
        address.postal_code,
    ]
        .filter(Boolean)
        .join(", ");

    return [address.address, location].filter(Boolean).join(", ");
}

function getCourierKey(option: DomesticCourierOption) {
    return `${option.code}:${option.service}:${option.cost}`;
}

export default function CheckoutPage() {
    const router = useRouter();
    const checkoutSubmitRef = useRef(false);

    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
    const [address, setAddress] = useState<CheckoutAddressFormValue>(
        initialCheckoutAddressValue,
    );

    const [isAddressFormOpen, setIsAddressFormOpen] = useState(true);

    const [courierOptionsByStore, setCourierOptionsByStore] =
        useState<CourierOptionsByStore>({});
    const [selectedCourierByStore, setSelectedCourierByStore] =
        useState<SelectedCourierByStore>({});
    const [loadingCourierByStore, setLoadingCourierByStore] =
        useState<LoadingCourierByStore>({});

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [paymentType, setPaymentType] =
        useState<PaymentMethodType>("virtual_account");
    const [selectedPaymentMethod, setSelectedPaymentMethod] =
        useState<PaymentMethod | null>(null);
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

    const [isLoadingCart, setIsLoadingCart] = useState(true);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchCheckoutItems = async () => {
        setIsLoadingCart(true);
        setErrorMessage("");

        try {
            const selectedCartItemIds = JSON.parse(
                localStorage.getItem("checkout_cart_item_ids") || "[]",
            ) as string[];

            const cartItems = await getCartItems();

            if (selectedCartItemIds.length === 0) {
                setCheckoutItems([]);
                return;
            }

            const selectedItems = cartItems.filter((item) =>
                selectedCartItemIds.includes(item.id),
            );

            if (getSelectedStoreIds(selectedItems).length > 1) {
                toast.error("Checkout hanya bisa untuk 1 toko. Pilih item dari satu toko saja.");
                router.replace("/cart");
                return;
            }

            setCheckoutItems(selectedItems);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil data checkout.",
            );
        } finally {
            setIsLoadingCart(false);
        }
    };

    const fetchPaymentMethods = async () => {
        setIsLoadingPaymentMethods(true);

        try {
            const data = await getActivePaymentMethods();

            setPaymentMethods(data);

            const defaultVa = data.find(
                (item) => item.type === "virtual_account" && item.isActive,
            );

            const defaultQris = data.find(
                (item) => item.type === "qris" && item.isActive,
            );

            if (defaultVa) {
                setPaymentType("virtual_account");
                setSelectedPaymentMethod(defaultVa);
                return;
            }

            if (defaultQris) {
                setPaymentType("qris");
                setSelectedPaymentMethod(defaultQris);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil metode pembayaran.",
            );
        } finally {
            setIsLoadingPaymentMethods(false);
        }
    };

    useEffect(() => {
        fetchCheckoutItems();
        fetchPaymentMethods();
    }, []);

    const groupedItemsByStore = useMemo(() => {
        return groupCartItemsByStore(checkoutItems);
    }, [checkoutItems]);

    const storeCheckoutGroups = useMemo<StoreCheckoutGroup[]>(() => {
        return Object.entries(groupedItemsByStore).map(([storeId, items]) => {
            const subtotal = items.reduce((total, item) => {
                return total + item.price * item.quantity;
            }, 0);

            const totalWeight = items.reduce((total, item) => {
                return total + item.variantWeight * item.quantity;
            }, 0);

            return {
                storeId,
                storeName: items[0]?.storeName ?? "-",
                items,
                subtotal,
                totalWeight,
            };
        });
    }, [groupedItemsByStore]);

    const virtualAccountMethods = useMemo(() => {
        return paymentMethods.filter(
            (item) => item.type === "virtual_account" && item.isActive,
        );
    }, [paymentMethods]);

    const qrisMethods = useMemo(() => {
        return paymentMethods.filter((item) => item.type === "qris" && item.isActive);
    }, [paymentMethods]);

    const selectedQrisMethod = qrisMethods[0];

    const totalQuantity = useMemo(() => {
        return checkoutItems.reduce((total, item) => total + item.quantity, 0);
    }, [checkoutItems]);

    const totalSubtotal = useMemo(() => {
        return storeCheckoutGroups.reduce((total, group) => {
            return total + group.subtotal;
        }, 0);
    }, [storeCheckoutGroups]);

    const totalShippingCost = useMemo(() => {
        return storeCheckoutGroups.reduce((total, group) => {
            const selectedCourier = selectedCourierByStore[group.storeId];

            return total + (selectedCourier?.cost ?? 0);
        }, 0);
    }, [storeCheckoutGroups, selectedCourierByStore]);

    const [serviceFee, setServiceFee] = useState(0)

    useEffect(() => {
        setServiceFee(selectedPaymentMethod?.serviceFee ?? 0)
    }, [selectedPaymentMethod]);

    const total = totalSubtotal + totalShippingCost + serviceFee;

    const isAddressComplete = Boolean(
        address.id &&
        address.receiver_name &&
        address.receiver_phone &&
        address.province_id &&
        address.city_id &&
        address.district_id &&
        address.subdistrict_id &&
        address.address &&
        address.rajaongkir_destination_id,
    );

    const handleSelectPaymentType = (type: PaymentMethodType) => {
        setPaymentType(type);

        if (type === "virtual_account") {
            const defaultVa =
                selectedPaymentMethod?.type === "virtual_account"
                    ? selectedPaymentMethod
                    : virtualAccountMethods[0];

            setSelectedPaymentMethod(defaultVa ?? null);
            return;
        }

        const defaultQris =
            selectedPaymentMethod?.type === "qris"
                ? selectedPaymentMethod
                : qrisMethods[0];

        setSelectedPaymentMethod(defaultQris ?? null);
    };

    const fetchCourierOptionsForStore = async (group: StoreCheckoutGroup) => {
        const firstItem = group.items[0];
        const origin = firstItem?.storeOriginId;
        const destination = address.rajaongkir_destination_id;

        if (!origin || !destination) {
            return;
        }

        setLoadingCourierByStore((previous) => ({
            ...previous,
            [group.storeId]: true,
        }));

        try {
            /**
             * API kamu contohkan weight: 1.
             * Di sini total berat gram dikonversi ke kg minimum 1.
             * Kalau backend kamu butuh gram, ganti ke:
             * const weight = Math.max(group.totalWeight, 1);
             */
            const weight = Math.max(Math.ceil(group.totalWeight / 1000), 1);

            const courierOptions = await calculateDomesticCost({
                origin,
                destination,
                weight,
            });

            const sortedCourierOptions = [...courierOptions].sort((a, b) => {
                return a.cost - b.cost;
            });

            setCourierOptionsByStore((previous) => ({
                ...previous,
                [group.storeId]: sortedCourierOptions,
            }));

            setSelectedCourierByStore((previous) => {
                if (previous[group.storeId]) {
                    return previous;
                }

                return {
                    ...previous,
                    [group.storeId]: sortedCourierOptions[0],
                };
            });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Gagal menghitung ongkir ${group.storeName}.`,
            );

            setCourierOptionsByStore((previous) => ({
                ...previous,
                [group.storeId]: [],
            }));

            setSelectedCourierByStore((previous) => ({
                ...previous,
                [group.storeId]: undefined,
            }));
        } finally {
            setLoadingCourierByStore((previous) => ({
                ...previous,
                [group.storeId]: false,
            }));
        }
    };

    useEffect(() => {
        if (!isAddressComplete || storeCheckoutGroups.length === 0) {
            setCourierOptionsByStore({});
            setSelectedCourierByStore({});
            return;
        }

        storeCheckoutGroups.forEach((group) => {
            fetchCourierOptionsForStore(group);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        address.id,
        address.rajaongkir_destination_id,
        isAddressComplete,
        storeCheckoutGroups.length,
    ]);

    const validateAddress = () => {
        if (!address.id) {
            toast.error("Pilih atau buat alamat pengiriman terlebih dahulu.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.receiver_name.trim()) {
            toast.error("Nama penerima wajib diisi.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.receiver_phone.trim()) {
            toast.error("Nomor HP penerima wajib diisi.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.province_id) {
            toast.error("Provinsi wajib dipilih.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.city_id) {
            toast.error("Kota/Kabupaten wajib dipilih.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.district_id) {
            toast.error("Kecamatan wajib dipilih.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.subdistrict_id) {
            toast.error("Kelurahan/Desa wajib dipilih.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.address.trim()) {
            toast.error("Alamat lengkap wajib diisi.");
            setIsAddressFormOpen(true);
            return false;
        }

        if (!address.rajaongkir_destination_id) {
            toast.error("Destination ID RajaOngkir belum tersedia.");
            setIsAddressFormOpen(true);
            return false;
        }

        return true;
    };

    const handleSelectCourier = (storeId: string, selectedKey: string) => {
        const courierOptions = courierOptionsByStore[storeId] ?? [];
        const selectedCourier = courierOptions.find((option) => {
            return getCourierKey(option) === selectedKey;
        });

        setSelectedCourierByStore((previous) => ({
            ...previous,
            [storeId]: selectedCourier,
        }));
    };

    const handleProcessCheckout = async () => {
        if (checkoutSubmitRef.current || isCreatingOrder) {
            return;
        }

        if (checkoutItems.length === 0) {
            toast.error("Tidak ada item yang dipilih untuk checkout.");
            return;
        }

        if (storeCheckoutGroups.length === 0) {
            toast.error("Order tidak bisa dibuat karena data toko tidak tersedia.");
            return;
        }

        if (storeCheckoutGroups.length > 1) {
            toast.error("Checkout hanya bisa untuk 1 toko. Kembali ke cart dan pilih item dari satu toko saja.");
            router.replace("/cart");
            return;
        }

        if (!validateAddress()) {
            return;
        }

        if (!selectedPaymentMethod) {
            toast.error("Pilih metode pembayaran terlebih dahulu.");
            return;
        }

        const storeWithoutOrigin = storeCheckoutGroups.find((group) => {
            const firstItem = group.items[0];
            return !firstItem?.storeOriginId;
        });

        if (storeWithoutOrigin) {
            toast.error(
                `Toko ${storeWithoutOrigin.storeName} belum memiliki alamat origin.`,
            );
            return;
        }

        const storeWithoutCourier = storeCheckoutGroups.find((group) => {
            return !selectedCourierByStore[group.storeId];
        });

        if (storeWithoutCourier) {
            toast.error(
                `Pilih courier untuk pesanan dari ${storeWithoutCourier.storeName}.`,
            );
            return;
        }

        checkoutSubmitRef.current = true;
        setIsCreatingOrder(true);

        try {
            /**
             * Payload aman:
             * Tidak mengirim price, subtotal, ongkir final, weight, product name, atau total.
             * Backend wajib hitung ulang semuanya dari database dan API ongkir.
             */
            const payload: ProcessCheckoutPayload = {
                address_id: address.id as string,
                payment_method_id: selectedPaymentMethod.id,

                orders: storeCheckoutGroups.map((group) => {
                    const selectedCourier = selectedCourierByStore[group.storeId]!;

                    return {
                        store_id: group.storeId as string,

                        cart_item_ids: group.items.map((item) => item.id),

                        shipping: {
                            origin_address_id: group.items[0]?.storeOriginAddress?.id as string,
                            destination_address_id: address.id as string,
                            courier_code: selectedCourier.code,
                            courier_service: selectedCourier.service,
                        },
                    };
                }),
            };

            const response = await processCheckout(payload);

            const order_number = response.result.order_number;

            localStorage.removeItem("checkout_cart_item_ids");
            notifyCartChanged();

            if (response.result.payment_status === "failed_to_generate") {
                toast.error(
                    "Order berhasil dibuat, tetapi instruksi pembayaran gagal dibuat. Silakan pilih metode pembayaran lain.",
                );
                router.push(`/orders/${order_number}`);
                return;
            }

            router.push(`/checkout/success?order_number=${order_number}`);
        } catch (error) {
            checkoutSubmitRef.current = false;
            setIsCreatingOrder(false);
            toast.error(
                error instanceof Error ? error.message : "Gagal membuat pesanan.",
            );
        }
    };

    return (
        <main className="min-h-screen bg-slate-100">
            <Navbar />

            <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <div className="mb-8">
                    <Link
                        href="/cart"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-pink-600"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke keranjang
                    </Link>

                    <h1 className="text-3xl font-extrabold text-slate-950">Checkout</h1>
                </div>

                {isLoadingCart ? (
                    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-100 bg-white">
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin text-pink-500" />
                            <span className="font-semibold text-slate-500">
                Memuat checkout...
              </span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center">
                        <h2 className="text-xl font-bold text-slate-950">
                            Gagal memuat checkout
                        </h2>

                        <p className="mt-2 text-slate-500">{errorMessage}</p>

                        <button
                            type="button"
                            onClick={fetchCheckoutItems}
                            className={`mt-6 px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : checkoutItems.length === 0 ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                            <ShoppingCart size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-slate-950">
                            Tidak ada item checkout
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Pilih item dari keranjang terlebih dahulu.
                        </p>

                        <Link
                            href="/cart"
                            className={`mt-6 inline-flex px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Kembali ke Keranjang
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_410px]">
                        <div className="space-y-5">
                            <section className="rounded-3xl bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-extrabold uppercase text-slate-500">
                                            Alamat Pengiriman
                                        </h2>

                                        {isAddressComplete ? (
                                            <div className="mt-5">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={18} className="text-emerald-600" />

                                                    <p className="font-extrabold text-slate-950">
                                                        Rumah • {address.receiver_name}
                                                    </p>
                                                </div>

                                                <p className="mt-3 max-w-4xl text-base leading-7 text-slate-950">
                                                    {getAddressSummary(address)}{" "}
                                                    <span className="font-semibold">
                            {address.receiver_phone}
                          </span>
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                                <p className="font-bold text-slate-950">
                                                    Alamat belum lengkap
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    Pilih atau buat alamat pengiriman terlebih dahulu.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddressFormOpen((value) => !value)}
                                        className="shrink-0 rounded-xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        {isAddressFormOpen ? "Tutup" : "Ganti"}
                                    </button>
                                </div>

                                {isAddressFormOpen ? (
                                    <div className="mt-6">
                                        <CheckoutAddressForm
                                            value={address}
                                            onChange={(nextAddress) => {
                                                setAddress(nextAddress);
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </section>

                            {storeCheckoutGroups.length > 1 ? (
                                <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <Store size={20} className="text-orange-600" />

                                        <div>
                                            <p className="font-extrabold text-orange-900">
                                                Checkout hanya bisa untuk 1 toko
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-orange-700">
                                                Kamu memilih produk dari {storeCheckoutGroups.length} toko.
                                                Kembali ke cart dan pilih item dari satu toko saja.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            ) : null}

                            {storeCheckoutGroups.map((group, index) => {
                                const courierOptions =
                                    courierOptionsByStore[group.storeId] ?? [];
                                const selectedCourier = selectedCourierByStore[group.storeId];
                                const isLoadingCourier =
                                    loadingCourierByStore[group.storeId] ?? false;

                                return (
                                    <section
                                        key={group.storeId}
                                        className="rounded-3xl bg-white p-6 shadow-sm"
                                    >
                                        <div>
                                            <h2 className="text-sm font-extrabold uppercase text-slate-500">
                                                Pesanan {index + 1}
                                            </h2>

                                            <div className="mt-5 flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                                    <Store size={15} />
                                                </div>

                                                <div>
                                                    <p className="font-extrabold text-slate-950">
                                                        {group.storeName}
                                                    </p>

                                                    {group.items[0]?.storeOriginAddress ? (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Dikirim dari{" "}
                                                            {group.items[0].storeOriginAddress.cityName},{" "}
                                                            {group.items[0].storeOriginAddress.provinceName}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs font-semibold text-red-500">
                                                            Origin toko belum tersedia
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-5">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="grid gap-4 sm:grid-cols-[92px_1fr_auto]"
                                                >
                                                    <Link
                                                        href={`/products/${item.productSlug}`}
                                                        className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-100"
                                                    >
                                                        <Image
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            fill
                                                            sizes="96px"
                                                            className="object-cover"
                                                        />
                                                    </Link>

                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/products/${item.productSlug}`}
                                                            className="line-clamp-2 text-base font-semibold leading-7 text-slate-950 hover:text-pink-600"
                                                        >
                                                            {item.productName}
                                                        </Link>

                                                        <p className="mt-2 text-sm text-slate-500">
                                                            {item.variantName}
                                                        </p>
                                                    </div>

                                                    <div className="text-left sm:text-right">
                                                        <p className="text-base font-extrabold text-slate-950">
                                                            {item.quantity} x {formatCurrency(item.price)}
                                                        </p>

                                                        <p className="mt-2 text-sm font-semibold text-slate-500">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6">
                                            <label className="mb-2 block text-sm font-bold text-slate-600">
                                                Pilih Courier
                                            </label>

                                            {!isAddressComplete ? (
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-400">
                                                    Lengkapi alamat terlebih dahulu
                                                </div>
                                            ) : isLoadingCourier ? (
                                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-500">
                                                    <Loader2 size={17} className="animate-spin" />
                                                    Menghitung ongkir...
                                                </div>
                                            ) : courierOptions.length === 0 ? (
                                                <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-500">
                                                    Pengiriman tidak tersedia
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select
                                                        value={
                                                            selectedCourier
                                                                ? getCourierKey(selectedCourier)
                                                                : ""
                                                        }
                                                        onChange={(event) =>
                                                            handleSelectCourier(
                                                                group.storeId,
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-pink-400"
                                                    >
                                                        {courierOptions.map((option) => (
                                                            <option
                                                                key={getCourierKey(option)}
                                                                value={getCourierKey(option)}
                                                            >
                                                                {option.name} - {option.service} •{" "}
                                                                {option.etd || "-"} •{" "}
                                                                {formatCurrency(option.cost)}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <ChevronRight
                                                        size={18}
                                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500"
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-slate-500">Berat pesanan</span>
                                                    <span className="font-bold text-slate-950">
                            {group.totalWeight} gram
                          </span>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-slate-500">Ongkir</span>
                                                    <span className="font-bold text-slate-950">
                            {selectedCourier
                                ? formatCurrency(selectedCourier.cost)
                                : "-"}
                          </span>
                                                </div>

                                                {selectedCourier ? (
                                                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                                        <span className="text-slate-500">Estimasi</span>
                                                        <span className="font-bold text-slate-950">
                              {selectedCourier.etd || "-"}
                            </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-between gap-3 py-2 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MessageSquareText
                                                        size={18}
                                                        className="text-slate-500"
                                                    />

                                                    <span className="font-semibold text-slate-950">
                            Kasih Catatan
                          </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                                                    <span>0/200</span>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </button>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        <aside className="h-fit overflow-hidden rounded-3xl bg-white shadow-sm lg:sticky lg:top-32">
                            <div className="p-6">
                                <h2 className="text-xl font-extrabold text-slate-950">
                                    Cek ringkasan transaksimu, yuk
                                </h2>

                                <div className="mt-6 space-y-5">
                                    {storeCheckoutGroups.map((group, index) => {
                                        const selectedCourier =
                                            selectedCourierByStore[group.storeId];

                                        return (
                                            <div
                                                key={group.storeId}
                                                className="rounded-2xl border border-slate-100 p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className="font-bold text-slate-950">
                                                        Pesanan {index + 1}
                                                    </p>

                                                    <p className="text-xs font-semibold text-slate-500">
                                                        {group.storeName}
                                                    </p>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between gap-3 text-slate-500">
                                                        <span>Subtotal</span>
                                                        <span>{formatCurrency(group.subtotal)}</span>
                                                    </div>

                                                    <div className="flex justify-between gap-3 text-slate-500">
                                                        <span>Courier</span>
                                                        <span className="text-right">
                              {selectedCourier
                                  ? `${selectedCourier.code.toUpperCase()} ${selectedCourier.service}`
                                  : "-"}
                            </span>
                                                    </div>

                                                    <div className="flex justify-between gap-3 text-slate-500">
                                                        <span>Ongkir</span>
                                                        <span>
                              {selectedCourier
                                  ? formatCurrency(selectedCourier.cost)
                                  : "-"}
                            </span>
                                                    </div>

                                                    <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 font-bold text-slate-950">
                                                        <span>Total order</span>
                                                        <span>
                              {formatCurrency(
                                  group.subtotal + (selectedCourier?.cost ?? 0),
                              )}
                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <section className="mt-6 rounded-2xl border border-slate-100 p-4">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Wallet size={20} className="text-pink-600" />

                                        <h3 className="font-extrabold text-slate-950">
                                            Metode Pembayaran
                                        </h3>
                                    </div>

                                    {isLoadingPaymentMethods ? (
                                        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                                            <Loader2 size={17} className="animate-spin text-pink-500" />
                                            Memuat metode pembayaran...
                                        </div>
                                    ) : paymentMethods.length === 0 ? (
                                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-500">
                                            Metode pembayaran belum tersedia.
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {virtualAccountMethods.length > 0 ? (
                                                <label
                                                    className={`cursor-pointer rounded-2xl border p-4 ${
                                                        paymentType === "virtual_account"
                                                            ? "border-pink-300 bg-pink-50"
                                                            : "border-slate-200"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_type"
                                                        className="mb-3"
                                                        checked={paymentType === "virtual_account"}
                                                        onChange={() =>
                                                            handleSelectPaymentType("virtual_account")
                                                        }
                                                    />

                                                    <Building2 size={22} className="text-pink-600" />

                                                    <p className="mt-3 font-bold text-slate-950">
                                                        Virtual Account
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Bayar lewat transfer bank VA.
                                                    </p>
                                                </label>
                                            ) : null}

                                            {qrisMethods.length > 0 ? (
                                                <label
                                                    className={`cursor-pointer rounded-2xl border p-4 ${
                                                        paymentType === "qris"
                                                            ? "border-pink-300 bg-pink-50"
                                                            : "border-slate-200"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_type"
                                                        className="mb-3"
                                                        checked={paymentType === "qris"}
                                                        onChange={() => handleSelectPaymentType("qris")}
                                                    />

                                                    <QrCode size={22} className="text-pink-600" />

                                                    <p className="mt-3 font-bold text-slate-950">
                                                        QRIS
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Scan QR dari mobile banking atau e-wallet.
                                                    </p>
                                                </label>
                                            ) : null}
                                        </div>
                                    )}

                                    {paymentType === "virtual_account" &&
                                    virtualAccountMethods.length > 0 ? (
                                        <div className="mt-4">
                                            <label className="mb-2 block text-sm font-bold text-slate-600">
                                                Pilih Bank
                                            </label>

                                            <select
                                                value={selectedPaymentMethod?.code ?? ""}
                                                onChange={(event) => {
                                                    const paymentMethod = virtualAccountMethods.find(
                                                        (item) => item.code === event.target.value,
                                                    );

                                                    setSelectedPaymentMethod(paymentMethod ?? null);
                                                }}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-pink-400"
                                            >
                                                {virtualAccountMethods.map((method) => (
                                                    <option key={method.id} value={method.code}>
                                                        {method.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : null}

                                    {paymentType === "qris" && selectedQrisMethod ? (
                                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                                                    <QrCode size={24} />
                                                </div>

                                                <div>
                                                    <p className="font-bold text-slate-950">
                                                        {selectedQrisMethod.name}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        Kode: {selectedQrisMethod.code}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </section>
                            </div>

                            <div className="border-t border-slate-100 p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Total item</span>
                                        <span>{totalQuantity}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Subtotal produk</span>
                                        <span>{formatCurrency(totalSubtotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Total ongkir</span>
                                        <span>
                      {totalShippingCost > 0
                          ? formatCurrency(totalShippingCost)
                          : "-"}
                    </span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Biaya layanan</span>
                                        <span>{formatCurrency(serviceFee)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Metode bayar</span>
                                        <span className="text-right font-semibold">
                      {selectedPaymentMethod?.name ?? "-"}
                    </span>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-base font-semibold text-slate-950">
                    Total Tagihan
                  </span>

                                    <span className="text-2xl font-extrabold text-slate-950">
                    {formatCurrency(total)}
                  </span>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        isCreatingOrder ||
                                        checkoutItems.length === 0 ||
                                        !isAddressComplete ||
                                        !selectedPaymentMethod ||
                                        storeCheckoutGroups.length > 1 ||
                                        storeCheckoutGroups.some(
                                            (group) => !selectedCourierByStore[group.storeId],
                                        )
                                    }
                                    onClick={handleProcessCheckout}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-4 text-base font-extrabold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                    {isCreatingOrder ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Membuat Pesanan...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} />
                                            Bayar Sekarang
                                        </>
                                    )}
                                </button>

                                {!isAddressComplete ? (
                                    <p className="mt-3 text-center text-xs font-semibold text-orange-500">
                                        Pilih atau buat alamat terlebih dahulu.
                                    </p>
                                ) : null}

                                {storeCheckoutGroups.length > 1 ? (
                                    <p className="mt-3 text-center text-xs font-semibold text-orange-500">
                                        Checkout hanya bisa untuk 1 toko.
                                    </p>
                                ) : null}

                                {isAddressComplete &&
                                storeCheckoutGroups.length <= 1 &&
                                storeCheckoutGroups.some(
                                    (group) => !selectedCourierByStore[group.storeId],
                                ) ? (
                                    <p className="mt-3 text-center text-xs font-semibold text-orange-500">
                                        Pilih courier untuk semua pesanan.
                                    </p>
                                ) : null}

                                {!selectedPaymentMethod ? (
                                    <p className="mt-3 text-center text-xs font-semibold text-orange-500">
                                        Pilih metode pembayaran terlebih dahulu.
                                    </p>
                                ) : null}

                                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                                    Dengan membuat pesanan, kamu menyetujui syarat dan kebijakan
                                    toko.
                                </p>
                            </div>
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}
