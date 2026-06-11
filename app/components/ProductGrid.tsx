"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import ProductCard from "./ProductCard";
import { getPublicProducts } from "@/app/services/product.service";
import { Product } from "@/app/types/product";
import { theme } from "@/app/config/theme";
import { siteConfig } from "@/app/config/site";

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchProducts = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await getPublicProducts({
                page: 1,
                limit: 10,
                orderBy: "created_at",
                searchBy: "name",
                search: "",
                orderType: "desc",
            });

            setProducts(response.data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil data produk.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <section id="products" className="app-container-wide py-12 lg:py-16">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className={`font-semibold ${theme.tokens.textColor}`}>Produk Pilihan</p>

                    <h2 className={`mt-2 text-3xl font-extrabold ${theme.tokens.textColor}`}>
                        Produk Terbaru
                    </h2>

                    <p className={`mt-2 ${theme.tokens.mutedTextColor}`}>
                        {siteConfig.description}
                    </p>
                </div>

                <Link
                    href="/products"
                    className={`inline-flex w-fit hover:${theme.colors.secondary.border} hover:${theme.colors.secondary.bg} items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                >
                    Lihat Semua
                    <ArrowRight size={16} />
                </Link>
            </div>

            {isLoading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-100 bg-white">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Loader2 className="animate-spin text-pink-500" />
                        <span className="font-semibold">Memuat produk...</span>
                    </div>
                </div>
            ) : errorMessage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                    <h3 className="text-lg font-bold text-red-600">
                        Gagal memuat produk
                    </h3>

                    <p className="mt-2 text-sm text-red-500">{errorMessage}</p>

                    <button
                        type="button"
                        onClick={fetchProducts}
                        className="mt-5 rounded-full bg-pink-500 px-5 py-3 text-sm font-bold text-white hover:bg-pink-600"
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        Produk belum tersedia
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Silakan cek kembali beberapa saat lagi.
                    </p>
                </div>
            )}
        </section>
    );
}