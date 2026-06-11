export function toSlug(value: string) {
    return value.toLowerCase().replaceAll(" ", "-");
}

export function fromSlug(value: string) {
    return value
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}