import { api } from "@/app/lib/axios";
import {
    Category,
    CategoryApi,
    CategoryListResponse,
    CategoryListResult,
} from "@/app/types/category";

function mapCategoryApiToCategory(category: CategoryApi): Category {
    return {
        id: category.id,
        parentId: category.parent_id,
        name: category.name,
        slug: category.slug,
        iconUrl: category.icon_url,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
    };
}

export type GetPublicCategoriesParams = {
    page?: number;
    limit?: number;
    orderBy?: string;
    searchBy?: string;
    search?: string;
    orderType?: "asc" | "desc";
};

export async function getPublicCategories(
    params?: GetPublicCategoriesParams,
): Promise<CategoryListResult> {
    const response = await api.get<CategoryListResponse>("/public/categories", {
        params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            order_by: params?.orderBy ?? "name",
            search_by: params?.searchBy ?? "name",
            search: params?.search ?? "",
            order_type: params?.orderType ?? "desc",
        },
    });

    return {
        data: response.data.result.data.map(mapCategoryApiToCategory),
        pagination: {
            page: response.data.result.page,
            limit: response.data.result.limit,
            total: response.data.result.total,
        },
    };
}