import Navbar from "@/app/components/Navbar";
import CategoryMenu from "@/app/components/CategoryMenu";
import ProductGrid from "@/app/components/ProductGrid";
import { theme } from "@/app/config/theme";
import HomeContent from "@/app/components/HomeContent";

export default function HomePage() {
  return (
      <main className={`min-h-screen ${theme.colors.neutral.page}`}>
        <Navbar />
        <CategoryMenu />

        <HomeContent />

        <ProductGrid />
      </main>
  );
}
