import {
  ArtisanCategoryId,
  ArtisanProduct,
  ArtisanWorkshop,
  CustomizationOption,
} from '@/components/artisans/types';

export const BDT_PER_USD = 110;

export const ARTISAN_HERO_IMAGE =
  '/images/artisans/artisans_hero_workshop_1795181990328.jpg';

export const ARTISAN_CATEGORIES: Array<{
  id: ArtisanCategoryId;
  label: string;
}> = [
  { id: 'all', label: 'All Works' },
  { id: 'pottery', label: 'Pottery & Clay' },
  { id: 'textiles', label: 'Jamdani & Textiles' },
  { id: 'woodwork', label: 'Teak & Woodcraft' },
  { id: 'jewelry', label: 'Silver Filigree' },
  { id: 'leatherwork', label: 'Heritage Leather' },
  { id: 'paintings', label: 'Rickshaw Folk Art' },
  { id: 'weaves', label: 'Cane & Shital Pati' },
];

export const ARTISAN_WORKSHOPS: ArtisanWorkshop[] = [
  {
    id: 'v-dhamrai-clay',
    slug: 'dhamrai-clay-heritage',
    displayName: 'Dhamrai Clay Heritage Studio',
    craftSpecialty: 'Terracotta & Earthenware Pottery',
    location: 'Dhamrai, Dhaka Division',
    establishedYear: 1968,
    artisanCount: 14,
    description:
      'Third-generation master potters throwing natural river-bed clay vessels, terracotta dinnerware, and carved water pitchers fired in traditional wood-ash kilns.',
    signatureTechnique: 'Hand-carved floral relief & mineral slip glazing',
    rating: 4.9,
    reviewCount: 48,
    coverImage: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
    leadTimeSummary: 'Ships in 3–5 days',
  },
  {
    id: 'v-sonargaon-loom',
    slug: 'sonargaon-royal-jamdani',
    displayName: 'Sonargaon Royal Jamdani Weavers',
    craftSpecialty: 'Handloom Muslin & Jamdani Weaving',
    location: 'Sonargaon, Narayanganj',
    establishedYear: 1954,
    artisanCount: 22,
    description:
      'UNESCO-recognized handloom weavers crafting 80-count Jamdani sarees and organic Khadi garments knot-by-knot on traditional wooden pit looms.',
    signatureTechnique: 'Discontinuous supplementary weft Panna Hazar motifs',
    rating: 4.95,
    reviewCount: 62,
    coverImage: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    leadTimeSummary: 'Ready to ship or custom loom',
  },
  {
    id: 'v-hill-woodcraft',
    slug: 'hill-tracts-woodcraft',
    displayName: 'Chittagong Hill Woodcraft Guild',
    craftSpecialty: 'Hand-Carved Teak & Mahogany',
    location: 'Kaptai Road, Chittagong',
    establishedYear: 1982,
    artisanCount: 11,
    description:
      'Sustainably seasoned Burmese teak and mahogany sculpted by chisel into heirloom serving boards, turned condiment vessels, and warm architectural tableware.',
    signatureTechnique: 'Single-slab chisel hollowing & raw beeswax burnishing',
    rating: 4.86,
    reviewCount: 35,
    coverImage: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    leadTimeSummary: 'Ships in 2–4 days',
  },
  {
    id: 'v-sylhet-filigree',
    slug: 'sylhet-filigree-silver',
    displayName: 'Sylhet Filigree & Silver Studio',
    craftSpecialty: 'Tarkashi Silver Filigree & Metalsmithing',
    location: 'Zindabazar, Sylhet',
    establishedYear: 1974,
    artisanCount: 9,
    description:
      'Fine sterling silver drawn into hair-thin threads, twisted and soldered by hand into weightless floral medallions, pendants, and heritage bridal jewelry.',
    signatureTechnique: 'Tarkashi micro-wire lacework & oxidized detailing',
    rating: 4.92,
    reviewCount: 41,
    coverImage: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    leadTimeSummary: 'Ships in 3–4 days',
  },
  {
    id: 'v-hazaribagh-leather',
    slug: 'hazaribagh-heritage-leather',
    displayName: 'Hazaribagh Heritage Leather Guild',
    craftSpecialty: 'Vegetable-Tanned Full-Grain Leather',
    location: 'Dhaka Leather Craft Cluster',
    establishedYear: 1989,
    artisanCount: 16,
    description:
      'Eco-conscious vegetable-tanned full-grain cowhide hand-stitched with waxed linen thread and solid brass hardware for lifelong patina.',
    signatureTechnique: 'Two-needle saddle stitching & burnished raw edges',
    rating: 4.88,
    reviewCount: 38,
    coverImage: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    leadTimeSummary: 'Ships in 2–3 days',
  },
  {
    id: 'v-dhaka-rickshaw',
    slug: 'old-dhaka-rickshaw-art',
    displayName: 'Old Dhaka Rickshaw Art Atelier',
    craftSpecialty: 'UNESCO Folk Enamel & Canvas Painting',
    location: 'Lalbagh, Old Dhaka',
    establishedYear: 1979,
    artisanCount: 8,
    description:
      'Master rickshaw painters translating vibrant Bangladeshi peacock, lotus, and river motifs onto enamel serving trays and collectible studio pieces.',
    signatureTechnique: 'Freehand glossy enamel brushwork on metal & canvas',
    rating: 4.9,
    reviewCount: 53,
    coverImage: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
    leadTimeSummary: 'Ships in 2–4 days',
  },
  {
    id: 'v-sylhet-weaves',
    slug: 'balaganj-sylhet-weaves',
    displayName: 'Balaganj Weaves & Sylhet Artisans',
    craftSpecialty: 'Cane Basketry & Shital Pati Reed Weaving',
    location: 'Balaganj, Sylhet',
    establishedYear: 1962,
    artisanCount: 19,
    description:
      'Community cooperative weaving cool water-reed Shital Pati mats and split bamboo cane baskets harvested from Sylhet wetlands.',
    signatureTechnique: 'Split murta-reed geometric twill weaving',
    rating: 4.85,
    reviewCount: 44,
    coverImage: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    leadTimeSummary: 'Ships in 1–3 days',
  },
];

interface EditorialMeta {
  category: Exclude<ArtisanCategoryId, 'all'>;
  categoryLabel: string;
  workshopId: string;
  compareAtPriceUsd?: number;
  materials: string[];
  craftTimeDays: number;
  rating: number;
  reviewCount: number;
  isCustomizable: boolean;
  customizationOptions?: CustomizationOption[];
  isFeatured?: boolean;
  fallbackImage: string;
}

const SKU_EDITORIAL_MAP: Record<string, EditorialMeta> = {
  'DC-101': {
    category: 'pottery',
    categoryLabel: 'Pottery & Clay',
    workshopId: 'v-dhamrai-clay',
    compareAtPriceUsd: 29.0,
    materials: ['Natural Dhamrai River Clay', 'Mineral Slip', 'Raw Beeswax Polish'],
    craftTimeDays: 4,
    rating: 4.9,
    reviewCount: 32,
    isCustomizable: true,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
    customizationOptions: [
      {
        id: 'glaze',
        type: 'select',
        label: 'Clay Finish',
        options: ['Natural Terracotta', 'Smoked Charcoal Matte', 'Warm Ochre Slip'],
        priceModifierUsd: 0,
      },
      {
        id: 'engraving',
        type: 'text',
        label: 'Base Calligraphy Engraving (Optional)',
        placeholder: 'e.g. Anika & Fahim, 2026',
        priceModifierUsd: 2.5,
      },
    ],
  },
  'SJ-102': {
    category: 'textiles',
    categoryLabel: 'Jamdani & Textiles',
    workshopId: 'v-sonargaon-loom',
    compareAtPriceUsd: 215.0,
    materials: ['80-Count Handspun Cotton', 'Mulberry Silk Weft', 'Pure Gold Zari'],
    craftTimeDays: 30,
    rating: 5.0,
    reviewCount: 24,
    isCustomizable: true,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    customizationOptions: [
      {
        id: 'blouse',
        type: 'select',
        label: 'Unstitched Blouse Piece',
        options: ['Matching Ivory Muslin', 'Contrast Crimson Silk'],
        priceModifierUsd: 0,
      },
      {
        id: 'monogram',
        type: 'text',
        label: 'Woven Pallu Initials (Optional)',
        placeholder: 'e.g. A & R',
        priceModifierUsd: 12.0,
      },
    ],
  },
  'HT-103': {
    category: 'woodwork',
    categoryLabel: 'Teak & Woodcraft',
    workshopId: 'v-hill-woodcraft',
    compareAtPriceUsd: 49.0,
    materials: ['Seasoned Burmese Teak', 'Chittagong Mahogany', 'Organic Beeswax'],
    craftTimeDays: 5,
    rating: 4.86,
    reviewCount: 21,
    isCustomizable: true,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    customizationOptions: [
      {
        id: 'oil_finish',
        type: 'select',
        label: 'Wood Finish',
        options: ['Natural Beeswax Satin', 'Deep Walnut Oil'],
        priceModifierUsd: 0,
      },
      {
        id: 'monogram',
        type: 'text',
        label: 'Underside Laser Monogram (Optional)',
        placeholder: 'e.g. The Rahman Table',
        priceModifierUsd: 4.0,
      },
    ],
  },
  'SF-104': {
    category: 'jewelry',
    categoryLabel: 'Silver Filigree',
    workshopId: 'v-sylhet-filigree',
    compareAtPriceUsd: 98.0,
    materials: ['925 Sterling Silver Wire', 'Hand-Soldered Granules', 'Silk Gift Box'],
    craftTimeDays: 7,
    rating: 4.94,
    reviewCount: 29,
    isCustomizable: true,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    customizationOptions: [
      {
        id: 'chain_length',
        type: 'select',
        label: 'Silver Chain Length',
        options: ['18 inch (Classic)', '20 inch (Matinee)', '22 inch (Layered)'],
        priceModifierUsd: 0,
      },
      {
        id: 'finish',
        type: 'select',
        label: 'Silver Tone',
        options: ['Antique Oxidized Silver', 'Bright Mirror Polish'],
        priceModifierUsd: 0,
      },
    ],
  },
  'HL-105': {
    category: 'leatherwork',
    categoryLabel: 'Heritage Leather',
    workshopId: 'v-hazaribagh-leather',
    compareAtPriceUsd: 135.0,
    materials: ['Full-Grain Vegetable-Tanned Hide', 'Solid Brushed Brass', 'Waxed Linen Thread'],
    craftTimeDays: 6,
    rating: 4.89,
    reviewCount: 38,
    isCustomizable: true,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    customizationOptions: [
      {
        id: 'leather_tone',
        type: 'select',
        label: 'Hide Patina Tone',
        options: ['Cognac Saddle Tan', 'Espresso Chestnut'],
        priceModifierUsd: 0,
      },
      {
        id: 'deboss',
        type: 'text',
        label: 'Blind-Debossed Initials (Up to 3 letters)',
        placeholder: 'e.g. M.A.R',
        priceModifierUsd: 5.0,
      },
    ],
  },
  'DR-106': {
    category: 'paintings',
    categoryLabel: 'Rickshaw Folk Art',
    workshopId: 'v-dhaka-rickshaw',
    compareAtPriceUsd: 42.0,
    materials: ['Spun Steel Tray', 'Brass Rim', 'Hand-Brushed Enamel Lacquer'],
    craftTimeDays: 4,
    rating: 4.91,
    reviewCount: 41,
    isCustomizable: false,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
  },
  'HC-005': {
    category: 'weaves',
    categoryLabel: 'Cane & Shital Pati',
    workshopId: 'v-sylhet-weaves',
    compareAtPriceUsd: 46.0,
    materials: ['Split Sylhet Bamboo Cane', 'Natural Murta Water Reed', 'Handspun Cotton'],
    craftTimeDays: 3,
    rating: 4.85,
    reviewCount: 44,
    isCustomizable: false,
    isFeatured: true,
    fallbackImage: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
  },
  'AK-008': {
    category: 'textiles',
    categoryLabel: 'Jamdani & Textiles',
    workshopId: 'v-sonargaon-loom',
    compareAtPriceUsd: 52.0,
    materials: ['100% Organic Handspun Khadi Cotton', 'Mother-of-Pearl Buttons'],
    craftTimeDays: 4,
    rating: 4.87,
    reviewCount: 19,
    isCustomizable: true,
    isFeatured: false,
    fallbackImage: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    customizationOptions: [
      {
        id: 'size',
        type: 'select',
        label: 'Tailored Fit Size',
        options: ['Small', 'Medium', 'Large', 'Extra Large'],
        priceModifierUsd: 0,
      },
    ],
  },
};

export interface RawBackendProduct {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  brand?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  sellingPrice: string | number;
  currentStock?: number | null;
  reorderLevel?: number | null;
  isSyncedToEcommerce?: boolean | null;
}

export function mapBackendProductToArtisan(raw: RawBackendProduct): ArtisanProduct {
  const meta = SKU_EDITORIAL_MAP[raw.sku];
  const workshop =
    ARTISAN_WORKSHOPS.find((w) => w.id === meta?.workshopId) ||
    ARTISAN_WORKSHOPS.find(
      (w) =>
        raw.brand &&
        w.displayName.toLowerCase().includes(raw.brand.toLowerCase())
    ) ||
    ARTISAN_WORKSHOPS[0];

  const categoryFallback: Exclude<ArtisanCategoryId, 'all'> = meta
    ? meta.category
    : raw.categoryId === 'cat-apparel'
    ? 'textiles'
    : raw.categoryId === 'cat-accessories'
    ? 'jewelry'
    : raw.categoryId === 'cat-home-living' || raw.categoryId === 'cat-furniture'
    ? 'woodwork'
    : 'weaves';

  const categoryLabel =
    meta?.categoryLabel ||
    ARTISAN_CATEGORIES.find((c) => c.id === categoryFallback)?.label ||
    'Handcrafted';

  const safeImage =
    raw.imageUrl && raw.imageUrl.startsWith('/images/artisans/')
      ? raw.imageUrl
      : meta?.fallbackImage || '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg';

  return {
    id: raw.id,
    sku: raw.sku,
    title: raw.name,
    description:
      raw.description ||
      'Small-batch handcrafted piece made in a verified Bangladeshi artisan workshop and fulfilled through WAW-POS.',
    category: categoryFallback,
    categoryLabel,
    workshopId: workshop.id,
    workshopName: raw.brand || workshop.displayName,
    workshopLocation: workshop.location,
    priceUsd: Number(raw.sellingPrice) || 0,
    compareAtPriceUsd: meta?.compareAtPriceUsd,
    stock: Number(raw.currentStock ?? 0),
    reorderLevel: Number(raw.reorderLevel ?? 5),
    image: safeImage,
    materials: meta?.materials || ['Natural Local Materials', 'Hand-Finished'],
    craftTimeDays: meta?.craftTimeDays || 3,
    rating: meta?.rating || 4.8,
    reviewCount: meta?.reviewCount || 12,
    isCustomizable: Boolean(meta?.isCustomizable),
    customizationOptions: meta?.customizationOptions,
    isFeatured: meta?.isFeatured ?? false,
  };
}

export function formatArtisanPrice(
  priceUsd: number,
  currency: 'BDT' | 'USD'
): string {
  if (currency === 'BDT') {
    const bdt = Math.round(priceUsd * BDT_PER_USD);
    return `৳${bdt.toLocaleString('en-US')}`;
  }
  return `$${priceUsd.toFixed(2)}`;
}
