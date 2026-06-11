"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { theme } from "@/app/config/theme";
import { categories } from "@/app/data/categories";

type Props = {
    search: string;
    category: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onMinPriceChange: (value: string) => void;
    onMaxPriceChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onReset: () => void;
};

export default function ProductFilter({
                                          search,
                                          category,
                                          minPrice,
                                          maxPrice,
                                          sort,
                                          onSearchChange,
                                          onCategoryChange,
                                          onMinPriceChange,
                                          onMaxPriceChange,
                                          onSortChange,
                                          onReset,
                                      }: Props) {
    return (
        <aside
            className={`h-fit rounded-2xl border p-4 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
        >
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className={theme.colors.primary.text} />
                    <h2 className={`font-bold ${theme.colors.neutral.title}`}>Filter</h2>
                </div>

                <button
                    type="button"
                    onClick={onReset}
                    className={`flex items-center gap-1 text-sm font-semibold ${theme.colors.primary.text}`}
                >
                    <X size={14} />
                    Reset
                </button>
            </div>

            <div className="space-y-5">
                <div>
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
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Cari nama produk..."
                            className="w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label
                        className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                    >
                        Kategori
                    </label>

                    <select
                        value={category}
                        onChange={(event) => onCategoryChange(event.target.value)}
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
                            onChange={(event) => onMinPriceChange(event.target.value)}
                            type="number"
                            placeholder="Min"
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                        />

                        <input
                            value={maxPrice}
                            onChange={(event) => onMaxPriceChange(event.target.value)}
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
                        value={sort}
                        onChange={(event) => onSortChange(event.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                    >
                        <option value="latest">Terbaru</option>
                        <option value="price-low">Harga Terendah</option>
                        <option value="price-high">Harga Tertinggi</option>
                        <option value="rating">Rating Tertinggi</option>
                        <option value="discount">Diskon Terbesar</option>
                    </select>
                </div>
            </div>
        </aside>
    );
}