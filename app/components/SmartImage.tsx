import Image, { ImageProps } from "next/image";

const unoptimizedHostnames = (
    process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGE_HOSTNAMES ||
    process.env.NEXT_PUBLIC_IMAGE_STORAGE_HOSTNAME ||
    "nos.wjv-1.neo.id"
)
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);

function shouldUseUnoptimized(src: ImageProps["src"]) {
    if (typeof src !== "string") {
        return false;
    }

    try {
        const url = new URL(src);

        return unoptimizedHostnames.includes(url.hostname);
    } catch {
        return false;
    }
}

export default function SmartImage(props: ImageProps) {
    return (
        <Image
            {...props}
            unoptimized={props.unoptimized || shouldUseUnoptimized(props.src)}
        />
    );
}
