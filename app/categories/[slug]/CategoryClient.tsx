"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "@/app/components/SmartImage";
import {
    ArrowLeft,
    Loader2,
    Search,
    SlidersHorizontal,
    Tags,
    X,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ProductCard";
import { theme } from "@/app/config/theme";
import { Category } from "@/app/types/category";
import { Product } from "@/app/types/product";
import { getPublicCategories } from "@/app/services/category.service";
import { getPublicProducts } from "@/app/services/product.service";

type OrderType = "asc" | "desc";

type Props = {
    slug: string;
};

const PRODUCT_LIMIT = 20;

export default function CategoryClient({ slug }: Props) {
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const [category, setCategory] = useState<Category | null>(null);
    const [otherCategories, setOtherCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [orderBy, setOrderBy] = useState("name");
    const [orderType, setOrderType] = useState<OrderType>("desc");

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [isCategoryLoading, setIsCategoryLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const hasMore = products.length < total || total === 0;

    const fetchCategory = useCallback(async () => {
        setIsCategoryLoading(true);
        setErrorMessage("");

        try {
            const categoryResponse = await getPublicCategories({
                page: 1,
                limit: 200,
                orderBy: "name",
                searchBy: "name",
                search: "",
                orderType: "desc",
            });

            const selectedCategory =
                categoryResponse.data.find((item) => item.slug === slug) ?? null;

            setOtherCategories(categoryResponse.data);
            setCategory(selectedCategory);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil data kategori.",
            );
        } finally {
            setIsCategoryLoading(false);
        }
    }, [slug]);

    const fetchProducts = useCallback(
        async (
            selectedCategory: Category,
            targetPage: number,
            mode: "replace" | "append",
        ) => {
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

                /**
                 * Saat ini produk di-filter berdasarkan categorySlug di frontend.
                 * Kalau backend sudah support search_by=category_id,
                 * bagian ini bisa dibuat lebih efisien langsung dari API.
                 */
                const categoryProducts = response.data.filter((product) => {
                    return product.categorySlug === selectedCategory.slug;
                });

                setTotal(response.pagination.total);

                setProducts((previousProducts) => {
                    if (mode === "replace") {
                        return categoryProducts;
                    }

                    const existingIds = new Set(previousProducts.map((item) => item.id));

                    const uniqueNewProducts = categoryProducts.filter((item) => {
                        return !existingIds.has(item.id);
                    });

                    return [...previousProducts, ...uniqueNewProducts];
                });

                setPage(targetPage);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Gagal mengambil data produk kategori.",
                );
            } finally {
                setIsInitialLoading(false);
                setIsLoadingMore(false);
            }
        },
        [orderBy, orderType, search],
    );

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    useEffect(() => {
        if (!category) {
            setProducts([]);
            setTotal(0);
            setPage(1);
            setIsInitialLoading(false);
            return;
        }

        setProducts([]);
        setPage(1);
        setTotal(0);

        fetchProducts(category, 1, "replace");
    }, [category, fetchProducts]);

    useEffect(() => {
        const target = loadMoreRef.current;

        if (!target || !category) {
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
                    fetchProducts(category, page + 1, "append");
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
        category,
        fetchProducts,
        hasMore,
        isInitialLoading,
        isLoadingMore,
        page,
        products.length,
    ]);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (minPrice) {
            result = result.filter((product) => product.price >= Number(minPrice));
        }

        if (maxPrice) {
            result = result.filter((product) => product.price <= Number(maxPrice));
        }

        return result;
    }, [products, minPrice, maxPrice]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearch(searchInput);
    };

    const resetFilter = () => {
        setSearch("");
        setSearchInput("");
        setMinPrice("");
        setMaxPrice("");
        setOrderBy("name");
        setOrderType("desc");
    };

    const isLoading = isCategoryLoading || isInitialLoading;

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <div
                    className={`mb-6 overflow-hidden rounded-3xl border ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                >
                    <div className={`p-6 sm:p-8 ${theme.colors.primary.soft}`}>
                        <Link
                            href="/categories"
                            className={`mb-5 inline-flex items-center gap-2 text-sm font-semibold ${theme.colors.neutral.body} hover:text-pink-600`}
                        >
                            <ArrowLeft size={16} />
                            Semua kategori
                        </Link>

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div
                                    className={`relative mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white ${theme.colors.primary.text}`}
                                >
                                    {category?.iconUrl ? (
                                        <Image
                                            src={category.iconUrl}
                                            alt={category.name}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Tags size={28} />
                                    )}
                                </div>

                                <p className={`font-semibold ${theme.colors.primary.text}`}>
                                    Kategori
                                </p>

                                <h1
                                    className={`mt-2 text-3xl font-extrabold sm:text-5xl ${theme.colors.neutral.title}`}
                                >
                                    {category?.name ?? "Kategori"}
                                </h1>

                                <p
                                    className={`mt-3 max-w-2xl text-sm sm:text-base ${theme.colors.neutral.body}`}
                                >
                                    Temukan pilihan produk terbaik untuk kategori{" "}
                                    {category?.name ?? "ini"}.
                                </p>
                            </div>

                            <div
                                className={`w-fit rounded-full bg-white px-5 py-3 text-sm font-bold ${theme.colors.primary.text}`}
                            >
                                {filteredProducts.length} Produk
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div
                        className={`flex min-h-[360px] items-center justify-center rounded-2xl border ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div className="flex items-center gap-3">
                            <Loader2 className={`animate-spin ${theme.colors.primary.text}`} />

                            <span className={`font-semibold ${theme.colors.neutral.body}`}>
                Memuat kategori...
              </span>
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div
                        className={`rounded-2xl border p-8 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                            Gagal memuat kategori
                        </h2>

                        <p className={`mt-2 ${theme.colors.neutral.body}`}>
                            {errorMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                fetchCategory();

                                if (category) {
                                    fetchProducts(category, page, "replace");
                                }
                            }}
                            className={`mt-5 px-5 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : !category ? (
                    <div
                        className={`rounded-2xl border p-10 text-center ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <div
                            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                        >
                            <Search size={30} />
                        </div>

                        <h2 className={`mt-5 text-xl font-bold ${theme.colors.neutral.title}`}>
                            Kategori tidak ditemukan
                        </h2>

                        <p className={`mt-2 ${theme.colors.neutral.body}`}>
                            Kategori yang kamu cari tidak tersedia.
                        </p>

                        <Link
                            href="/categories"
                            className={`mt-6 inline-flex px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            Lihat Kategori
                        </Link>
                    </div>
                ) : (
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
                                        Cari di kategori ini
                                    </label>

                                    <div
                                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                                    >
                                        <Search size={18} className="text-slate-400" />

                                        <input
                                            value={searchInput}
                                            onChange={(event) => setSearchInput(event.target.value)}
                                            placeholder={`Cari ${category.name.toLowerCase()}...`}
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

                                <div>
                                    <label
                                        className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                    >
                                        Kategori Lain
                                    </label>

                                    <div className="flex flex-wrap gap-2 lg:block lg:space-y-2">
                                        {otherCategories.map((item) => {
                                            const isActive = item.id === category.id;

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/categories/${item.slug}`}
                                                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold lg:flex ${
                                                        isActive
                                                            ? `${theme.colors.primary.bg} border-transparent text-white`
                                                            : `${theme.colors.neutral.border} ${theme.colors.neutral.body} hover:bg-pink-50 hover:text-pink-600`
                                                    }`}
                                                >
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div>
                            {filteredProducts.length > 0 ? (
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

                                            <span
                                                className={`font-semibold ${theme.colors.neutral.body}`}
                                            >
                        Memuat produk lainnya...
                      </span>
                                        </div>
                                    ) : null}

                                    {!hasMore && products.length > 0 ? (
                                        <div
                                            className={`mt-8 rounded-2xl border p-5 text-center text-sm font-semibold ${theme.colors.neutral.card} ${theme.colors.neutral.border} ${theme.colors.neutral.body}`}
                                        >
                                            Semua produk kategori ini sudah ditampilkan.
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div
                                    className={`rounded-2xl border p-8 text-center sm:p-12 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                                >
                                    <div
                                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                    >
                                        <Search size={30} />
                                    </div>

                                    <h2
                                        className={`mt-5 text-xl font-bold ${theme.colors.neutral.title}`}
                                    >
                                        Produk tidak ditemukan
                                    </h2>

                                    <p
                                        className={`mx-auto mt-2 max-w-md ${theme.colors.neutral.body}`}
                                    >
                                        Tidak ada produk yang cocok dengan filter kamu di kategori{" "}
                                        {category.name}.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={resetFilter}
                                        className={`mt-6 px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
