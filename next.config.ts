import type { NextConfig } from "next";

const imageHostnames = (
    process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAMES ||
    process.env.NEXT_PUBLIC_IMAGE_STORAGE_HOSTNAME ||
    "nos.wjv-1.neo.id,images.unsplash.com,picsum.photos"
)
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);

const nextConfig: NextConfig = {
    images: {
        remotePatterns: imageHostnames.map((hostname) => ({
            protocol: "https",
            hostname,
            pathname: "/**",
        })),
        formats: ["image/avif", "image/webp"],
    },
};

export default nextConfig;
