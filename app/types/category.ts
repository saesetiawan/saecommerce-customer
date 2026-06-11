export type CategoryApi = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    icon_url: string;
    sort_order: number;
    created_at: string;
};

export type CategoryListResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: CategoryApi[];
        limit: number;
        page: number;
        total: number;
    };
};

export type Category = {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    iconUrl: string;
    sortOrder: number;
    createdAt: string;
};

export type CategoryPagination = {
    page: number;
    limit: number;
    total: number;
};

export type CategoryListResult = {
    data: Category[];
    pagination: CategoryPagination;
};