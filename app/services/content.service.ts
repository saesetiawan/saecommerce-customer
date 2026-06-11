import { api } from "@/app/lib/axios";
import {
    WebsiteContent,
    WebsiteContentApi,
    WebsiteContentListResponse,
    WebsiteContentType,
} from "@/app/types/content";

function mapWebsiteContentApiToContent(
    content: WebsiteContentApi,
): WebsiteContent {
    return {
        id: content.id,
        key: content.key,
        type: content.type,
        placement: content.placement,
        title: content.title,
        subtitle: content.subtitle ?? "",
        body: content.body ?? "",
        imageUrl: content.image_url ?? "",
        linkUrl: content.link_url ?? "",
        linkLabel: content.link_label ?? "",
        sortOrder: content.sort_order ?? 0,
        isActive: content.is_active,
        metadata: content.metadata,
    };
}

export async function getPublicWebsiteContents(params?: {
    placement?: string;
    type?: WebsiteContentType;
    limit?: number;
}) {
    const response = await api.get<WebsiteContentListResponse>(
        "/public/website-contents",
        {
            params: {
                placement: params?.placement ?? "home",
                type: params?.type ?? "",
                limit: params?.limit ?? 20,
            },
        },
    );

    const result = response.data.result;

    return {
        data: result.data.map(mapWebsiteContentApiToContent),
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
        },
    };
}
