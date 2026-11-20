import { getProducts, DEFAULT_TENANT } from "@/lib/db/products";
import { ArtisansStorefront } from "@/components/artisans/ArtisansStorefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts(DEFAULT_TENANT.id);
  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    brand: p.brand,
    categoryId: p.categoryId,
    imageUrl: p.imageUrl,
    sellingPrice: p.sellingPrice,
    currentStock: p.currentStock,
    reorderLevel: p.reorderLevel,
    isSyncedToEcommerce: p.isSyncedToEcommerce,
  }));

  return <ArtisansStorefront initialProducts={serialized} />;
}
