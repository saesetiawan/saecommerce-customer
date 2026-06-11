export type WebsiteContentType =
    | "hero"
    | "banner"
    | "section"
    | "promo"
    | "announcement";

export type WebsiteContentApi = {
    id: string;
    key: string;
    type: WebsiteContentType;
    placement: string;
    title: string;
    subtitle?: string;
    body?: string;
    image_url?: string;
    link_url?: string;
    link_label?: string;
    sort_order: number;
    is_active: boolean;
    metadata?: unknown;
    publish_start_at?: string;
    publish_end_at?: string;
    created_at?: string;
    updated_at?: string;
};

export type WebsiteContent = {
    id: string;
    key: string;
    type: WebsiteContentType;
    placement: string;
    title: string;
    subtitle: string;
    body: string;
    imageUrl: string;
    linkUrl: string;
    linkLabel: string;
    sortOrder: number;
    isActive: boolean;
    metadata?: unknown;
};

export type WebsiteContentListResponse = {
    responseMessage: string;
    responseCode: string;
    result: {
        data: WebsiteContentApi[];
        total: number;
        page: number;
        limit: number;
    };
};
