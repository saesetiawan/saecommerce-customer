'use client';


import { theme } from "@/app/config/theme";
import { useEffect, useState } from 'react';
import { Category } from '@/app/types/category';
import { getPublicCategories } from '@/app/services/category.service';
import Link from 'next/link';

export default function CategoryMenu() {
    const [categories, setCategories] = useState<Category[]>([]);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getPublicCategories({
                    page: 1,
                    limit: 20,
                    orderBy: "name",
                    searchBy: "name",
                    search: "",
                    orderType: "desc",
                });

                setCategories(response.data);
            } catch {
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);
    return (
        <section className="app-container-wide flex gap-5 overflow-x-auto py-3">
            <div className="flex gap-3 overflow-x-auto pb-2">
                {categories.map((category) => (
                    <Link href={`/categories/${category.slug}`}
                        key={category.id}
                        className={`whitespace-nowrap border px-5 py-2 text-sm font-semibold ${theme.radius.pill} ${theme.colors.neutral.card} ${theme.colors.neutral.border} ${theme.colors.neutral.body} hover:${theme.colors.primary.soft}`}
                    >
                        {category.name}
                    </Link>
                ))}
            </div>
        </section>
    );
}