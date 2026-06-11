"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ProductCard";
import { theme } from "@/app/config/theme";
import { Product } from "@/app/types/product";
import { getPublicProducts } from "@/app/services/product.service";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

type OrderType = "asc" | "desc";

const PRODUCT_LIMIT = 20;

export default function ProductsPage() {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") ?? "";
    const [products, setProducts] = useState<Product[]>([]);

    const [search, setSearch] = useState(searchQuery);
    const [searchInput, setSearchInput] = useState("");
    const [category, setCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [orderBy, setOrderBy] = useState("name");
    const [orderType, setOrderType] = useState<OrderType>("desc");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const hasMore = products.length < total || total === 0;

    const fetchProducts = useCallback(
        async (targetPage: number, mode: "replace" | "append") => {
            if (mode === "replace") {
                setIsInitialLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            setErrorMessage("");

            try {
                const response = await getPublicProducts({
                    page: targetPage,
                    limit: PRODUCT_LIMIT,
                    orderBy,
                    searchBy: "name",
                    search,
                    orderType,
                });

                setTotal(response.pagination.total);

                setProducts((previousProducts) => {
                    if (mode === "replace") {
                        return response.data;
                    }

                    const existingIds = new Set(previousProducts.map((item) => item.id));
                    const uniqueNewProducts = response.data.filter(
                        (item) => !existingIds.has(item.id),
                    );

                    return [...previousProducts, ...uniqueNewProducts];
                });

                setPage(targetPage);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error ? error.message : "Gagal mengambil data produk.",
                );
            } finally {
                setIsInitialLoading(false);
                setIsLoadingMore(false);
            }
        },
        [orderBy, orderType, search],
    );

    useEffect(() => {
        setProducts([]);
        setPage(1);
        setTotal(0);
        fetchProducts(1, "replace");
    }, [fetchProducts]);

    useEffect(() => {
        const target = loadMoreRef.current;

        if (!target) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (
                    firstEntry.isIntersecting &&
                    !isInitialLoading &&
                    !isLoadingMore &&
                    hasMore &&
                    products.length > 0
                ) {
                    fetchProducts(page + 1, "append");
                }
            },
            {
                root: null,
                rootMargin: "300px",
                threshold: 0,
            },
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [
        fetchProducts,
        hasMore,
        isInitialLoading,
        isLoadingMore,
        page,
        products.length,
    ]);

    const categories = useMemo(() => {
        return Array.from(new Set(products.map((product) => product.category)));
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (category) {
            result = result.filter((product) => product.category === category);
        }

        if (minPrice) {
            result = result.filter((product) => product.price >= Number(minPrice));
        }

        if (maxPrice) {
            result = result.filter((product) => product.price <= Number(maxPrice));
        }

        return result;
    }, [products, category, minPrice, maxPrice]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearch(searchInput);
    };

    const resetFilter = () => {
        setSearch("");
        setSearchInput("");
        setCategory("");
        setMinPrice("");
        setMaxPrice("");
        setOrderBy("name");
        setOrderType("desc");
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className={`font-semibold ${theme.colors.primary.text}`}>
                            Semua Produk
                        </p>

                        <h1
                            className={`mt-2 text-2xl font-extrabold sm:text-4xl ${theme.colors.neutral.title}`}
                        >
                            Kebutuhan bayi, anak, sampai remaja
                        </h1>

                        <p
                            className={`mt-2 max-w-2xl text-sm sm:text-base ${theme.colors.neutral.body}`}
                        >
                            Cari produk terbaik untuk keluarga.
                        </p>
                    </div>

                    <div
                        className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                    >
                        {filteredProducts.length} Produk
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
                    <aside
                        className={`h-fit rounded-2xl border p-4 lg:sticky lg:top-36 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal
                                    size={18}
                                    className={theme.colors.primary.text}
                                />

                                <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                    Filter
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={resetFilter}
                                className={`flex items-center gap-1 text-sm font-semibold ${theme.colors.primary.text}`}
                            >
                                <X size={14} />
                                Reset
                            </button>
                        </div>

                        <div className="space-y-5">
                            <form onSubmit={handleSearchSubmit}>
                                <label
                                    className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                >
                                    Cari Produk
                                </label>

                                <div
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                                >
                                    <Search size={18} className="text-slate-400" />

                                    <input
                                        value={searchInput}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                        placeholder="Cari produk..."
                                        className="w-full bg-transparent text-sm outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`mt-3 w-full px-4 py-3 text-sm font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Cari
                                </button>
                            </form>

                            <div>
                                <label
                                    className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                >
                                    Kategori
                                </label>

                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                >
                                    <option value="">Semua Kategori</option>

                                    {categories.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                >
                                    Harga
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        value={minPrice}
                                        onChange={(event) => setMinPrice(event.target.value)}
                                        type="number"
                                        placeholder="Min"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                    />

                                    <input
                                        value={maxPrice}
                                        onChange={(event) => setMaxPrice(event.target.value)}
                                        type="number"
                                        placeholder="Max"
                                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                >
                                    Urutkan
                                </label>

                                <select
                                    value={`${orderBy}:${orderType}`}
                                    onChange={(event) => {
                                        const [nextOrderBy, nextOrderType] =
                                            event.target.value.split(":");

                                        setOrderBy(nextOrderBy);
                                        setOrderType(nextOrderType as OrderType);
                                    }}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                >
                                    <option value="name:desc">Nama Z-A</option>
                                    <option value="name:asc">Nama A-Z</option>
                                    <option value="min_price:asc">Harga Terendah</option>
                                    <option value="min_price:desc">Harga Tertinggi</option>
                                    <option value="total_sold:desc">Terlaris</option>
                                    <option value="total_views:desc">Paling Dilihat</option>
                                    <option value="created_at:desc">Terbaru</option>
                                </select>
                            </div>
                        </div>
                    </aside>

                    <div>
                        {isInitialLoading ? (
                            <div
                                className={`flex min-h-[360px] items-center justify-center rounded-2xl border ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Loader2
                                        className={`animate-spin ${theme.colors.primary.text}`}
                                    />

                                    <span className={`font-semibold ${theme.colors.neutral.body}`}>
                    Memuat produk...
                  </span>
                                </div>
                            </div>
                        ) : errorMessage ? (
                            <div
                                className={`rounded-2xl border p-8 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                                    Gagal memuat produk
                                </h2>

                                <p className={`mt-2 ${theme.colors.neutral.body}`}>
                                    {errorMessage}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => fetchProducts(page, "replace")}
                                    className={`mt-5 px-5 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                <div ref={loadMoreRef} className="h-10" />

                                {isLoadingMore ? (
                                    <div className="mt-6 flex items-center justify-center gap-3">
                                        <Loader2
                                            className={`animate-spin ${theme.colors.primary.text}`}
                                        />

                                        <span className={`font-semibold ${theme.colors.neutral.body}`}>
                      Memuat produk lainnya...
                    </span>
                                    </div>
                                ) : null}

                                {!hasMore && products.length > 0 ? (
                                    <div
                                        className={`mt-8 rounded-2xl border p-5 text-center text-sm font-semibold ${theme.colors.neutral.card} ${theme.colors.neutral.border} ${theme.colors.neutral.body}`}
                                    >
                                        Semua produk sudah ditampilkan.
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div
                                className={`rounded-2xl border p-10 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                                    Produk tidak ditemukan
                                </h2>

                                <p className={`mt-2 ${theme.colors.neutral.body}`}>
                                    Coba ubah kata kunci, kategori, atau rentang harga.
                                </p>

                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className={`mt-5 px-5 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                >
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}