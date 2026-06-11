type StaticProduct = {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    category: string;
    description: string;
    rating: number;
    stock: number;
    discountPercent?: number;
    isNew?: boolean;
};

export const products: StaticProduct[] = [
    {
        id: "1",
        name: "Popok Bayi Premium Size M",
        slug: "popok-bayi-premium-size-m",
        price: 89000,
        image: "/products/popok.jpg",
        category: "Popok",
        description: "Popok bayi lembut, nyaman, dan anti bocor untuk pemakaian harian.",
        rating: 4.8,
        stock: 30,
        discountPercent: 15,
        isNew: true,
    },
    {
        id: "2",
        name: "Susu Pertumbuhan Anak 1-3 Tahun",
        slug: "susu-pertumbuhan-anak-1-3-tahun",
        price: 165000,
        image: "/products/susu.jpg",
        category: "Makanan Bayi",
        description: "Susu pertumbuhan untuk membantu kebutuhan nutrisi anak.",
        rating: 4.9,
        stock: 18,
        discountPercent: 10,
    },
    {
        id: "3",
        name: "Botol Susu Anti Kolik",
        slug: "botol-susu-anti-kolik",
        price: 79000,
        image: "/products/botol-susu.jpg",
        category: "Menyusui",
        description: "Botol susu dengan desain anti kolik dan mudah dibersihkan.",
        rating: 4.7,
        stock: 24,
        isNew: true,
    },
    {
        id: "4",
        name: "Mainan Edukasi Balok Warna",
        slug: "mainan-edukasi-balok-warna",
        price: 59000,
        image: "/products/mainan-balok.jpg",
        category: "Mainan",
        description: "Mainan edukasi untuk melatih motorik dan kreativitas anak.",
        rating: 4.6,
        stock: 40,
        discountPercent: 20,
    },
    {
        id: "5",
        name: "Baju Anak Katun Premium",
        slug: "baju-anak-katun-premium",
        price: 99000,
        image: "/products/baju-anak.jpg",
        category: "Pakaian Anak",
        description: "Baju anak berbahan katun lembut, adem, dan nyaman.",
        rating: 4.8,
        stock: 14,
    },
    {
        id: "6",
        name: "Tas Sekolah Anak Karakter",
        slug: "tas-sekolah-anak-karakter",
        price: 149000,
        image: "/products/tas-anak.jpg",
        category: "Perlengkapan Sekolah",
        description: "Tas sekolah lucu dan ringan untuk anak usia sekolah.",
        rating: 4.5,
        stock: 10,
        discountPercent: 12,
    },
    {
        id: "7",
        name: "Sabun Mandi Bayi Gentle Care",
        slug: "sabun-mandi-bayi-gentle-care",
        price: 45000,
        image: "/products/sabun-bayi.jpg",
        category: "Perlengkapan Mandi",
        description: "Sabun mandi bayi lembut untuk kulit sensitif.",
        rating: 4.9,
        stock: 35,
    },
    {
        id: "8",
        name: "Stroller Bayi Travel Lite",
        slug: "stroller-bayi-travel-lite",
        price: 899000,
        image: "/products/stroller.jpg",
        category: "Stroller",
        description: "Stroller ringan, compact, dan mudah dilipat.",
        rating: 4.7,
        stock: 6,
        discountPercent: 8,
    },
];
