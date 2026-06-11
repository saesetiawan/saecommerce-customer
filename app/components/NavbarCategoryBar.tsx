import Link from "next/link";
import { theme } from "@/app/config/theme";
import { useEffect, useState } from 'react';
import { getPublicCategories } from '@/app/services/category.service';
import { Category } from '@/app/types/category';

export default function NavbarCategoryBar() {
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
        <div className="hidden border-t border-slate-100 bg-white md:block">
            <div className="app-container-wide flex gap-5 overflow-x-auto py-3">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className={`whitespace-nowrap text-sm font-medium ${theme.colors.neutral.body} hover:${theme.colors.primary.text}`}
                    >
                        {category.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}