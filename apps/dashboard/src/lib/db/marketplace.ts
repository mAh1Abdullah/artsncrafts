import {
  BDT_PER_USD,
  createCuid,
  slugify,
  type AdminAuditLogDTO,
  type BuyerProfileDTO,
  type CouponDTO,
  type CouponValidationResultDTO,
  type CourierProviderDTO,
  type CourierSuggestionDTO,
  type CreateCouponRequest,
  type CreateOrderRequest,
  type CreateRawMaterialRequest,
  type CreateReviewRequest,
  type CreateVendorApplication,
  type CreateWholesaleOrderRequest,
  type DeliveryZoneDTO,
  type OrderDTO,
  type ProductCategory,
  type ProductDTO,
  type RawMaterialDTO,
  type ReviewDTO,
  type ShipmentDTO,
  type UpdateOrderRequest,
  type UpdateVendorRequest,
  type VendorDTO,
  type VendorSettlementDTO,
  type WholesaleOrderDTO,
} from '@waw/contracts';
import {
  adjustProductStock,
  DEFAULT_STORE,
  DEFAULT_TENANT,
  getProducts,
  recordSale,
  type Product as DbProduct,
} from './products';

/**
 * Server-side Marketplace Repository (Next.js App Only)
 * Enriches shared POS products with artisan studio metadata, manages vendors,
 * raw materials, coupons, reviews, delivery zones, shipments, settlements,
 * buyer profiles, and admin audit trails.
 */

const PRODUCT_METADATA_OVERRIDES = new Map<
  string,
  Partial<
    Pick<
      ProductDTO,
      | 'category'
      | 'isCustomizable'
      | 'customizationOptions'
      | 'materialsUsed'
      | 'craftTimeDays'
      | 'tags'
      | 'rating'
      | 'reviewCount'
      | 'moderationStatus'
      | 'rejectionReason'
      | 'featured'
      | 'compareAtPriceBdt'
    >
  >
>([
  [
    'art-1',
    {
      category: 'pottery',
      isCustomizable: true,
      customizationOptions: [
        {
          id: 'opt_engrave',
          type: 'text',
          label: 'Custom Base Calligraphy Engraving',
          placeholder: 'e.g. "Anika & Fahim — 2026"',
          required: false,
          priceModifierBdt: 200,
        },
        {
          id: 'opt_glaze',
          type: 'select',
          label: 'Kiln Clay Finish',
          options: ['Natural Terracotta', 'Smoked Charcoal Matte', 'Warm Ochre Slip'],
          required: true,
          priceModifierBdt: 0,
        },
      ],
      materialsUsed: ['Dhamrai River Clay', 'Organic Earthenware Slip', 'Natural Beeswax'],
      craftTimeDays: 4,
      tags: ['Pottery', 'Terracotta', 'Dhamrai', 'Eco-Friendly'],
      rating: 4.9,
      reviewCount: 32,
      moderationStatus: 'approved',
      featured: true,
      compareAtPriceBdt: 3400,
    },
  ],
  [
    'art-2',
    {
      category: 'textiles',
      isCustomizable: true,
      customizationOptions: [
        {
          id: 'opt_blouse',
          type: 'select',
          label: 'Hand-Stitched Fall & Pico Finish',
          options: ['Standard Loom Finish', 'Hand-Hemmed Silk Pico (+৳450)'],
          required: true,
          priceModifierBdt: 450,
        },
      ],
      materialsUsed: ['80-Count Handspun Muslin', 'Pure Mulberry Silk', 'Zari Metallic Thread'],
      craftTimeDays: 14,
      tags: ['Jamdani', 'Sonargaon', 'UNESCO Heritage', 'Handloom'],
      rating: 4.96,
      reviewCount: 48,
      moderationStatus: 'approved',
      featured: true,
      compareAtPriceBdt: 24500,
    },
  ],
  [
    'art-3',
    {
      category: 'woodwork',
      isCustomizable: true,
      customizationOptions: [
        {
          id: 'opt_monogram',
          type: 'text',
          label: 'Corner Laser Monogram',
          placeholder: 'Up to 18 characters',
          required: false,
          priceModifierBdt: 250,
        },
      ],
      materialsUsed: ['Seasoned Chittagong Teak', 'Mahogany', 'Food-Safe Beeswax'],
      craftTimeDays: 5,
      tags: ['Woodcraft', 'Teak', 'Dining', 'Chittagong'],
      rating: 4.85,
      reviewCount: 24,
      moderationStatus: 'approved',
      featured: true,
    },
  ],
  [
    'art-4',
    {
      category: 'jewelry',
      isCustomizable: false,
      materialsUsed: ['925 Fine Silver Wire', 'Hand-Soldered Tarkashi Filigree'],
      craftTimeDays: 6,
      tags: ['Silver Filigree', 'Tarkashi', 'Sylhet', 'Bridal'],
      rating: 4.92,
      reviewCount: 39,
      moderationStatus: 'approved',
      featured: true,
    },
  ],
  [
    'art-5',
    {
      category: 'leatherwork',
      isCustomizable: true,
      customizationOptions: [
        {
          id: 'opt_emboss',
          type: 'text',
          label: 'Blind-Debossed Initials',
          placeholder: 'e.g. A.R.',
          required: false,
          priceModifierBdt: 300,
        },
      ],
      materialsUsed: ['Vegetable-Tanned Full-Grain Cowhide', 'Solid Brushed Brass'],
      craftTimeDays: 7,
      tags: ['Leathercraft', 'Full-Grain', 'Briefcase', 'Dhaka'],
      rating: 4.88,
      reviewCount: 27,
      moderationStatus: 'approved',
      featured: true,
    },
  ],
  [
    'art-6',
    {
      category: 'paintings',
      isCustomizable: false,
      materialsUsed: ['Enamel Pigment', 'Spun Steel Tray', 'Hand-Rolled Brass Rim'],
      craftTimeDays: 3,
      tags: ['Rickshaw Art', 'Old Dhaka', 'Folk Art', 'Decor'],
      rating: 4.87,
      reviewCount: 41,
      moderationStatus: 'approved',
      featured: true,
    },
  ],
  [
    '5',
    {
      category: 'handicrafts',
      isCustomizable: false,
      materialsUsed: ['Sylhet Murta Cane', 'Natural Shital Pati Reed', 'Organic Khadi Cotton'],
      craftTimeDays: 4,
      tags: ['Shital Pati', 'Cane Basket', 'Sylhet', 'Sustainable'],
      rating: 4.91,
      reviewCount: 36,
      moderationStatus: 'approved',
      featured: true,
    },
  ],
  [
    '8',
    {
      category: 'textiles',
      isCustomizable: false,
      materialsUsed: ['100% Handspun Organic Khadi Cotton', 'Natural Indigo Wash'],
      craftTimeDays: 4,
      tags: ['Khadi', 'Organic Cotton', 'Apparel', 'Handloom'],
      rating: 4.82,
      reviewCount: 19,
      moderationStatus: 'approved',
      featured: false,
    },
  ],
]);

let vendorsStore: VendorDTO[] = [
  {
    id: 'v-dhamrai-clay',
    publicSlug: 'dhamrai-clay-heritage',
    displayName: 'Dhamrai Clay Heritage Studio',
    legalName: 'Dhamrai Pottery Crafts & Arts',
    status: 'approved',
    craftSpecialty: 'Terracotta & Earthenware Pottery',
    description:
      'Third-generation master potters shaping natural earthenware, terracotta pitchers, and kiln-fired homeware using heritage Dhamrai clay techniques.',
    workshopLocation: 'Dhamrai, Dhaka Division',
    supportEmail: 'studio@dhamraiclay.bd',
    supportPhone: '+8801811223344',
    allowCod: true,
    rating: 4.9,
    reviewCount: 48,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
    bannerUrl: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    createdAt: '2025-11-20T08:30:00.000Z',
  },
  {
    id: 'v-sonargaon-loom',
    publicSlug: 'sonargaon-royal-jamdani',
    displayName: 'Sonargaon Royal Jamdani Weavers',
    legalName: 'Sonargaon Loom Guild Ltd.',
    status: 'approved',
    craftSpecialty: 'Handloom Muslin & Jamdani Weaving',
    description:
      'UNESCO-recognized master weavers creating fine-count Jamdani sarees and organic Khadi textiles knot by knot on traditional wooden pit looms.',
    workshopLocation: 'Sonargaon, Narayanganj',
    supportEmail: 'weaver@jamdanisonargaon.bd',
    supportPhone: '+8801755443322',
    allowCod: true,
    rating: 4.96,
    reviewCount: 62,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    bannerUrl: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    createdAt: '2025-10-12T14:20:00.000Z',
  },
  {
    id: 'v-hill-woodcraft',
    publicSlug: 'chittagong-hill-woodcraft',
    displayName: 'Chittagong Hill Woodcraft Guild',
    legalName: 'Hill Tracts Artisan Woodworks',
    status: 'approved',
    craftSpecialty: 'Hand-Carved Teak & Mahogany Tableware',
    description:
      'Sustainably seasoned Chittagong teak and mahogany hand-turned into heirloom serving platters, condiment bowls, and architectural decor.',
    workshopLocation: 'Kaptai Road, Chittagong',
    supportEmail: 'hello@hillwoodcraft.bd',
    supportPhone: '+8801899887766',
    allowCod: true,
    rating: 4.85,
    reviewCount: 35,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    bannerUrl: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    createdAt: '2025-12-01T11:10:00.000Z',
  },
  {
    id: 'v-sylhet-filigree',
    publicSlug: 'sylhet-filigree-silver',
    displayName: 'Sylhet Filigree & Silver Studio',
    legalName: 'Sylhet Metalsmith Guild',
    status: 'approved',
    craftSpecialty: 'Heritage Tarkashi Silver Filigree',
    description:
      'Master silversmiths preserving centuries-old Tarkashi fine silver wirework in featherlight bridal pendants, earrings, and bespoke heirloom jewelry.',
    workshopLocation: 'Zindabazar, Sylhet',
    supportEmail: 'silver@sylhetfiligree.bd',
    supportPhone: '+8801822334455',
    allowCod: true,
    rating: 4.92,
    reviewCount: 41,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    bannerUrl: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    createdAt: '2025-09-18T10:00:00.000Z',
  },
  {
    id: 'v-hazaribagh-leather',
    publicSlug: 'hazaribagh-leather-guild',
    displayName: 'Hazaribagh Heritage Leather Guild',
    legalName: 'Hazaribagh Artisan Leatherworks',
    status: 'approved',
    craftSpecialty: 'Vegetable-Tanned Full-Grain Leatherware',
    description:
      'Small-batch saddle-stitched leather briefcases, folios, and wallets crafted from vegetable-tanned full-grain hides with solid brass hardware.',
    workshopLocation: 'Savar & Hazaribagh, Dhaka',
    supportEmail: 'crafts@hazaribaghleather.bd',
    supportPhone: '+8801944556677',
    allowCod: true,
    rating: 4.88,
    reviewCount: 38,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    bannerUrl: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    createdAt: '2025-10-05T14:15:00.000Z',
  },
  {
    id: 'v-dhaka-rickshaw',
    publicSlug: 'old-dhaka-rickshaw-art',
    displayName: 'Old Dhaka Rickshaw Art Atelier',
    legalName: 'Lalbagh Folk Art Collective',
    status: 'approved',
    craftSpecialty: 'UNESCO Rickshaw Folk Painting',
    description:
      'Veteran rickshaw artists painting vibrant floral, lotus, and peacock motifs in weather-resistant enamel on spun steel trays and studio canvases.',
    workshopLocation: 'Lalbagh, Old Dhaka',
    supportEmail: 'atelier@rickshawart.bd',
    supportPhone: '+8801733445566',
    allowCod: true,
    rating: 4.87,
    reviewCount: 53,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
    bannerUrl: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
    createdAt: '2025-08-25T11:30:00.000Z',
  },
  {
    id: 'v-sylhet-weaves',
    publicSlug: 'balaganj-weaves-sylhet',
    displayName: 'Balaganj Weaves & Sylhet Artisans',
    legalName: 'Balaganj Cane & Shital Pati Cooperative',
    status: 'approved',
    craftSpecialty: 'Shital Pati Water-Reed & Cane Weaving',
    description:
      'Cooperative of Sylhet wetland weavers producing cooling Shital Pati reed mats and hand-woven bamboo cane baskets.',
    workshopLocation: 'Balaganj, Sylhet',
    supportEmail: 'coop@balaganjweaves.bd',
    supportPhone: '+8801711002299',
    allowCod: true,
    rating: 4.91,
    reviewCount: 36,
    verifiedArtisan: true,
    avatarUrl: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    bannerUrl: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    createdAt: '2025-11-02T09:00:00.000Z',
  },
  {
    id: 'v-tangail-brass',
    publicSlug: 'tangail-bell-metal-guild',
    displayName: 'Tangail Bell-Metal Foundry',
    legalName: 'Kagmari Kansa Cooperative',
    status: 'submitted',
    craftSpecialty: 'Hand-Hammered Bell Metal (Kansa) Tableware',
    description:
      'Fourth-generation Kagmari metalsmiths applying to list hand-forged Kansa bowls, water carafes, and ceremonial serving ware.',
    workshopLocation: 'Kagmari, Tangail',
    supportEmail: 'foundry@tangailkansa.bd',
    supportPhone: '+8801788445511',
    allowCod: true,
    rating: 4.8,
    reviewCount: 0,
    verifiedArtisan: false,
    avatarUrl: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    bannerUrl: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

let rawMaterialsStore: RawMaterialDTO[] = [
  {
    id: 'rm-101',
    wholesalerVendorProfileId: 'v-dhamrai-clay',
    supplierName: 'Dhamrai Clay & Mineral Supply',
    name: 'Refined Natural Dhamrai Earthenware Clay (25 kg)',
    category: 'Clay',
    description:
      'Double-sieved alluvial river clay aged for wheel throwing and slab building. Fires to warm terracotta at 980–1060°C.',
    priceBdt: 950,
    unit: 'bag',
    moq: 5,
    stockQuantity: 240,
    status: 'active',
    imageUrl: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'rm-102',
    wholesalerVendorProfileId: 'v-sonargaon-loom',
    supplierName: 'Narayanganj Loom Yarn Collective',
    name: '80-Count Unbleached Handspun Muslin Cotton Cones',
    category: 'Yarn',
    description:
      'Fine staple handspun cotton warp and weft yarn prepared specifically for Jamdani and Tangail pit-loom weaving.',
    priceBdt: 1450,
    unit: 'spool',
    moq: 10,
    stockQuantity: 180,
    status: 'active',
    imageUrl: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    createdAt: '2026-01-14T11:00:00.000Z',
  },
  {
    id: 'rm-103',
    wholesalerVendorProfileId: 'v-hill-woodcraft',
    supplierName: 'Chittagong Kiln-Dried Timber Yard',
    name: 'Kiln-Dried Chittagong Teak Turning Blanks (Pack of 4)',
    category: 'Wood',
    description:
      'FSC-sourced seasoned Burmese/Chittagong teak planks moisture-stabilized at 10% for serving boards and lathe work.',
    priceBdt: 3200,
    unit: 'pack',
    moq: 3,
    stockQuantity: 75,
    status: 'active',
    imageUrl: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    createdAt: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'rm-104',
    wholesalerVendorProfileId: 'v-sylhet-filigree',
    supplierName: 'Sylhet Silver & Brass Bullion Craft Supply',
    name: '925 Fine Silver Filigree Drawing Wire (0.4 mm · 50g)',
    category: 'Metals',
    description:
      'Annealed dead-soft sterling wire ideal for Tarkashi filigree spirals, bezel wrapping, and fine hand-soldered motifs.',
    priceBdt: 6800,
    unit: 'spool',
    moq: 2,
    stockQuantity: 42,
    status: 'active',
    imageUrl: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    createdAt: '2026-01-22T10:30:00.000Z',
  },
  {
    id: 'rm-105',
    wholesalerVendorProfileId: 'v-hazaribagh-leather',
    supplierName: 'Savar Eco-Tannery Hide Supply',
    name: 'Vegetable-Tanned Full-Grain Cognac Cowhide Side (14 sq ft)',
    category: 'Leather',
    description:
      '2.0 mm vegetable-tanned leather dyed with mimosa bark tannins, ready for hand-stitching briefcases, belts, and wallets.',
    priceBdt: 4600,
    unit: 'hide',
    moq: 2,
    stockQuantity: 64,
    status: 'active',
    imageUrl: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    createdAt: '2026-02-01T12:00:00.000Z',
  },
  {
    id: 'rm-106',
    wholesalerVendorProfileId: 'v-sylhet-weaves',
    supplierName: 'Sylhet Eco-Packaging Co-op',
    name: 'Handwoven Jute & Recycled Kraft Gift Boxes (Bundle of 25)',
    category: 'Packaging',
    description:
      'Plastic-free double-wall export-grade craft gift boxes lined with natural jute twine and cotton tissue.',
    priceBdt: 1850,
    unit: 'bundle',
    moq: 4,
    stockQuantity: 310,
    status: 'active',
    imageUrl: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    createdAt: '2026-02-05T15:00:00.000Z',
  },
];

let wholesaleOrdersStore: WholesaleOrderDTO[] = [
  {
    id: 'wo-1001',
    orderNumber: 'WHL-BD-4012',
    buyerVendorName: 'Dhamrai Clay Heritage Studio',
    buyerPhone: '+8801811223344',
    shippingAddress: 'Pottery Lane, Dhamrai, Dhaka 1350',
    paymentMethod: 'bkash',
    totalAmountBdt: 9500,
    status: 'shipped',
    items: [
      {
        rawMaterialId: 'rm-101',
        name: 'Refined Natural Dhamrai Earthenware Clay (25 kg)',
        supplierName: 'Dhamrai Clay & Mineral Supply',
        unit: 'bag',
        unitPriceBdt: 950,
        quantity: 10,
        lineTotalBdt: 9500,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

let couponsStore: CouponDTO[] = [
  {
    id: 'cpn-artisan15',
    code: 'ARTISAN15',
    description: '15% off heritage crafts on orders over ৳2,000 (max ৳1,500)',
    status: 'active',
    type: 'platform',
    discountType: 'percentage',
    discountValue: 15,
    minOrderBdt: 2000,
    maxDiscountCapBdt: 1500,
    usageLimit: 500,
    usageCount: 84,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cpn-craft500',
    code: 'CRAFT500',
    description: 'Flat ৳500 off orders above ৳4,500',
    status: 'active',
    type: 'platform',
    discountType: 'fixed',
    discountValue: 500,
    minOrderBdt: 4500,
    maxDiscountCapBdt: null,
    usageLimit: 250,
    usageCount: 39,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'cpn-sylhet10',
    code: 'SYLHET10',
    description: '10% guild welcome offer for Sylhet silver & cane crafts',
    status: 'active',
    type: 'vendor',
    discountType: 'percentage',
    discountValue: 10,
    minOrderBdt: 1500,
    maxDiscountCapBdt: 1000,
    usageLimit: null,
    usageCount: 18,
    createdAt: '2026-02-15T00:00:00.000Z',
  },
];

let reviewsStore: ReviewDTO[] = [
  {
    id: 'rev-101',
    productId: 'art-1',
    vendorProfileId: 'v-dhamrai-clay',
    userId: 'buyer-anika',
    userName: 'Anika Rahman',
    rating: 5,
    title: 'Naturally cool water and crisp calligraphy engraving',
    comment:
      'Packed securely in jute and double corrugated board. The terracotta finish feels authentic and our family initials on the base came out spotless.',
    status: 'approved',
    createdAt: '2026-02-14T10:00:00.000Z',
  },
  {
    id: 'rev-102',
    productId: 'art-2',
    vendorProfileId: 'v-sonargaon-loom',
    userId: 'buyer-farzana',
    userName: 'Farzana Akter',
    rating: 5,
    title: 'Museum-grade weave from Sonargaon',
    comment:
      'The 80-count drape is airy and luminous. Worth every day of the handloom craft time.',
    status: 'approved',
    createdAt: '2026-02-18T14:30:00.000Z',
  },
  {
    id: 'rev-103',
    productId: 'art-4',
    vendorProfileId: 'v-sylhet-filigree',
    userId: 'buyer-nusrat',
    userName: 'Nusrat Jahan',
    rating: 5,
    title: 'Delicate Tarkashi silverwork, remarkably lightweight',
    comment:
      'Wore the medallion pendant for an entire wedding reception without any heaviness. Arrived with an authenticity card from Sylhet.',
    status: 'submitted',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const deliveryZonesStore: DeliveryZoneDTO[] = [
  {
    id: 'zone-dhaka',
    code: 'dhaka_metro',
    name: 'Dhaka Metro',
    basePriceBdt: 70,
    estimatedDeliveryDaysMin: 1,
    estimatedDeliveryDaysMax: 2,
    isActive: true,
  },
  {
    id: 'zone-outside',
    code: 'outside_dhaka',
    name: 'Outside Dhaka (Divisional Cities)',
    basePriceBdt: 130,
    estimatedDeliveryDaysMin: 2,
    estimatedDeliveryDaysMax: 4,
    isActive: true,
  },
  {
    id: 'zone-remote',
    code: 'remote_area',
    name: 'Remote Upazila & Hill Tracts',
    basePriceBdt: 180,
    estimatedDeliveryDaysMin: 4,
    estimatedDeliveryDaysMax: 6,
    isActive: true,
  },
];

const courierProvidersStore: CourierProviderDTO[] = [
  {
    id: 'cr-pathao',
    code: 'pathao',
    name: 'Pathao Logistics',
    supportsCod: true,
    avgDeliveryHours: 28,
    basePriceBdt: 70,
    isActive: true,
  },
  {
    id: 'cr-steadfast',
    code: 'steadfast',
    name: 'Steadfast Courier',
    supportsCod: true,
    avgDeliveryHours: 36,
    basePriceBdt: 110,
    isActive: true,
  },
  {
    id: 'cr-redx',
    code: 'redx',
    name: 'RedX Delivery',
    supportsCod: true,
    avgDeliveryHours: 42,
    basePriceBdt: 120,
    isActive: true,
  },
];

let ordersStore: OrderDTO[] = [
  {
    id: 'ord-bd-1001',
    orderNumber: 'WAW-BD-8901',
    buyerUserId: 'buyer-anika',
    customerName: 'Anika Rahman',
    customerEmail: 'anika@example.com',
    customerPhone: '+8801712345678',
    shippingAddress: 'House 42, Road 11, Block D, Banani, Dhaka 1213',
    items: [
      {
        productId: 'art-1',
        productName: 'Hand-Carved Earthen Water Pitcher & Tumbler Set',
        sku: 'DC-101',
        vendorId: 'v-dhamrai-clay',
        vendorName: 'Dhamrai Clay Heritage Studio',
        quantity: 1,
        unitPrice: 24.5,
      },
      {
        productId: '5',
        productName: 'Sylhet Cane Basket, Shital Pati Mat & Khadi Tunic Set',
        sku: 'HC-005',
        vendorId: 'v-sylhet-weaves',
        vendorName: 'Balaganj Weaves & Sylhet Artisans',
        quantity: 1,
        unitPrice: 39.99,
      },
    ],
    subtotalAmount: 64.49,
    shippingFee: 0.58,
    discountAmount: 0,
    couponCode: null,
    totalAmount: 65.07,
    advanceAmount: 65.07,
    dueBalance: 0,
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    status: 'shipped',
    courierService: 'pathao',
    trackingCode: 'PTH-8890214-BD',
    courierStatus: 'in_transit',
    fraudRiskScore: 0.08,
    fraudRiskLevel: 'LOW',
    fraudSignals: ['Verified Bangladeshi MNO prefix', 'Prepaid via bKash'],
    notes: 'Deliver after 3 PM',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ord-bd-1002',
    orderNumber: 'WAW-BD-8902',
    buyerUserId: 'buyer-anika',
    customerName: 'Nusrat Jahan Chowdhury',
    customerEmail: 'nusrat@example.com',
    customerPhone: '+8801819987654',
    shippingAddress: 'Amberkhana Point, Sylhet Sadar, Sylhet 3100',
    items: [
      {
        productId: 'art-4',
        productName: 'Tarkashi Heritage Silver Filigree Pendant & Earrings',
        sku: 'SF-104',
        vendorId: 'v-sylhet-filigree',
        vendorName: 'Sylhet Filigree & Silver Studio',
        quantity: 1,
        unitPrice: 88.0,
      },
    ],
    subtotalAmount: 88.0,
    shippingFee: 1.08,
    discountAmount: 8.8,
    couponCode: 'SYLHET10',
    totalAmount: 80.28,
    advanceAmount: 80.28,
    dueBalance: 0,
    paymentMethod: 'nagad',
    paymentStatus: 'paid',
    status: 'delivered',
    courierService: 'steadfast',
    trackingCode: 'STDF-667120-SYL',
    courierStatus: 'delivered',
    fraudRiskScore: 0.05,
    fraudRiskLevel: 'LOW',
    fraudSignals: ['Instant full payment via Nagad'],
    notes: 'Gift packaging requested',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: 'ord-bd-1003',
    orderNumber: 'WAW-BD-8903',
    buyerUserId: 'buyer-shakil',
    customerName: 'Shakil Anwar',
    customerPhone: '+8801923456789',
    shippingAddress: 'Zindabazar Plaza, Level 3, Sylhet 3100',
    items: [
      {
        productId: 'art-2',
        productName: 'Heritage 80-Count Royal Handloom Jamdani Saree',
        sku: 'SJ-102',
        vendorId: 'v-sonargaon-loom',
        vendorName: 'Sonargaon Royal Jamdani Weavers',
        quantity: 1,
        unitPrice: 185.0,
      },
    ],
    subtotalAmount: 185.0,
    shippingFee: 1.08,
    discountAmount: 0,
    couponCode: null,
    totalAmount: 186.08,
    advanceAmount: 0,
    dueBalance: 186.08,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    status: 'pending',
    courierService: null,
    trackingCode: null,
    fraudRiskScore: 0.72,
    fraudRiskLevel: 'HIGH',
    fraudSignals: ['High-value COD order without advance payment'],
    notes: 'Confirm COD call before dispatch',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

let shipmentsStore: ShipmentDTO[] = [
  {
    id: 'shp-1001',
    orderId: 'ord-bd-1001',
    orderNumber: 'WAW-BD-8901',
    courierCode: 'pathao',
    courierName: 'Pathao Logistics',
    trackingNumber: 'PTH-8890214-BD',
    shippingFeeBdt: 70,
    codAmountBdt: 0,
    status: 'in_transit',
    events: [
      {
        id: 'ev-1',
        shipmentId: 'shp-1001',
        status: 'booked',
        location: 'Dhamrai Artisan Hub',
        description: 'Consignment created and artisan parcel labeled.',
        eventTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'ev-2',
        shipmentId: 'shp-1001',
        status: 'picked_up',
        location: 'Savar Collection Point',
        description: 'Collected by Pathao Logistics rider.',
        eventTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'ev-3',
        shipmentId: 'shp-1001',
        status: 'in_transit',
        location: 'Tejgaon Central Sorting Hub, Dhaka',
        description: 'Sorted for Banani last-mile delivery dispatch.',
        eventTimestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'shp-1002',
    orderId: 'ord-bd-1002',
    orderNumber: 'WAW-BD-8902',
    courierCode: 'steadfast',
    courierName: 'Steadfast Courier',
    trackingNumber: 'STDF-667120-SYL',
    shippingFeeBdt: 130,
    codAmountBdt: 0,
    status: 'delivered',
    events: [
      {
        id: 'ev-4',
        shipmentId: 'shp-1002',
        status: 'booked',
        location: 'Zindabazar Silver Studio, Sylhet',
        description: 'Insured jewelry parcel booked with Steadfast.',
        eventTimestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
      {
        id: 'ev-5',
        shipmentId: 'shp-1002',
        status: 'delivered',
        location: 'Amberkhana, Sylhet',
        description: 'Delivered and signed by recipient.',
        eventTimestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const settlementsStore: VendorSettlementDTO[] = [
  {
    id: 'stl-2026-01',
    vendorProfileId: 'v-dhamrai-clay',
    vendorName: 'Dhamrai Clay Heritage Studio',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    grossAmountBdt: 148500,
    commissionBdt: 14850,
    netAmountBdt: 133650,
    status: 'paid',
    payoutAccountMasked: 'bKash Merchant *******3344',
    paidAt: '2026-11-04T11:20:00.000Z',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'stl-2026-02',
    vendorProfileId: 'v-sonargaon-loom',
    vendorName: 'Sonargaon Royal Jamdani Weavers',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
    grossAmountBdt: 264000,
    commissionBdt: 26400,
    netAmountBdt: 237600,
    status: 'pending_review',
    payoutAccountMasked: 'City Bank ****4321',
    paidAt: null,
    createdAt: '2026-11-16T09:00:00.000Z',
  },
  {
    id: 'stl-2026-03',
    vendorProfileId: 'v-sylhet-filigree',
    vendorName: 'Sylhet Filigree & Silver Studio',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
    grossAmountBdt: 98400,
    commissionBdt: 9840,
    netAmountBdt: 88560,
    status: 'approved',
    payoutAccountMasked: 'bKash Merchant *******4455',
    paidAt: null,
    createdAt: '2026-11-16T09:30:00.000Z',
  },
];

const buyerProfilesStore = new Map<string, BuyerProfileDTO>([
  [
    'buyer-anika',
    {
      id: 'buyer-anika',
      name: 'Anika Rahman',
      email: 'anika@example.com',
      phone: '+8801712345678',
      walletBalanceBdt: 1250,
      trustScore: 94,
      codEligible: true,
      riskLevel: 'low',
      wishlistProductIds: ['art-2', 'art-4'],
      savedAddresses: [
        {
          id: 'addr-1',
          label: 'Home',
          recipientName: 'Anika Rahman',
          phone: '+8801712345678',
          addressLine: 'House 42, Road 11, Block D, Banani',
          district: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1213',
          isDefault: true,
        },
        {
          id: 'addr-2',
          label: 'Studio Office',
          recipientName: 'Anika Rahman',
          phone: '+8801712345678',
          addressLine: 'Suite 6B, Gulshan Avenue',
          district: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1212',
          isDefault: false,
        },
      ],
      styleProfile: {
        department: 'Home & Heritage Textiles',
        favoriteCrafts: ['Jamdani Weaving', 'Terracotta Pottery', 'Silver Filigree'],
        preferredColors: ['Alabaster', 'Terracotta', 'Forest Sage'],
      },
      notifications: [
        {
          id: 'ntf-1',
          title: 'Order WAW-BD-8901 is in transit',
          body: 'Pathao Logistics sorted your handcrafted parcel at Tejgaon Hub.',
          type: 'order_shipped',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'ntf-2',
          title: 'Order WAW-BD-8902 delivered',
          body: 'Your Tarkashi Silver Filigree set was delivered via Steadfast Courier.',
          type: 'order_delivered',
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
      ],
    },
  ],
]);

let auditLogsStore: AdminAuditLogDTO[] = [
  {
    id: 'aud-1',
    actorName: 'Sultana Admin',
    actorRole: 'admin',
    action: 'vendor.approved',
    entityType: 'vendor',
    entityId: 'v-dhamrai-clay',
    reason: 'Workshop kiln verification and trade license confirmed.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'aud-2',
    actorName: 'Nafis Owner',
    actorRole: 'owner',
    action: 'settlement.paid',
    entityType: 'settlement',
    entityId: 'stl-2026-01',
    reason: 'October payout cleared via bKash Merchant.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function appendAdminAuditLog(entry: Omit<AdminAuditLogDTO, 'id' | 'createdAt'>): AdminAuditLogDTO {
  const created: AdminAuditLogDTO = {
    ...entry,
    id: createCuid('aud'),
    createdAt: new Date().toISOString(),
  };
  auditLogsStore = [created, ...auditLogsStore];
  return created;
}

export function getAdminAuditLogs(): AdminAuditLogDTO[] {
  return [...auditLogsStore];
}

// ============================================================================
// ENRICHED PRODUCTS (UNIFIED POS + MARKETPLACE CATALOG)
// ============================================================================
function inferCategory(p: DbProduct): ProductCategory {
  const override = PRODUCT_METADATA_OVERRIDES.get(p.id)?.category;
  if (override) return override;
  const text = `${p.name} ${p.brand || ''} ${p.categoryId || ''}`.toLowerCase();
  if (text.includes('pitcher') || text.includes('clay') || text.includes('pottery')) return 'pottery';
  if (text.includes('jamdani') || text.includes('khadi') || text.includes('saree')) return 'textiles';
  if (text.includes('teak') || text.includes('wood')) return 'woodwork';
  if (text.includes('silver') || text.includes('filigree')) return 'jewelry';
  if (text.includes('leather')) return 'leatherwork';
  if (text.includes('rickshaw') || text.includes('paint')) return 'paintings';
  return 'handicrafts';
}

export function mapDbProductToDTO(p: DbProduct): ProductDTO {
  const override = PRODUCT_METADATA_OVERRIDES.get(p.id);
  const vendor =
    vendorsStore.find((v) => v.id === p.vendorId) ||
    vendorsStore.find((v) => p.brand && v.displayName.toLowerCase().includes(p.brand.toLowerCase())) ||
    vendorsStore[0];

  const sellingPriceUsd = Number(p.sellingPrice) || 0;
  const priceBdt = Math.round(sellingPriceUsd * BDT_PER_USD);
  const img = p.imageUrl || '/images/artisans/artisans_hero_workshop_1795181990328.jpg';

  return {
    id: p.id,
    tenantId: p.tenantId ?? DEFAULT_TENANT.id,
    storeId: p.storeId ?? DEFAULT_STORE.id,
    vendorId: vendor.id,
    vendorName: p.brand || vendor.displayName,
    vendorSlug: vendor.publicSlug,
    vendorLocation: vendor.workshopLocation,
    categoryId: p.categoryId ?? null,
    category: inferCategory(p),
    brand: p.brand ?? vendor.displayName,
    name: p.name,
    description: p.description ?? '',
    sku: p.sku,
    barcode: p.barcode ?? null,
    imageUrl: img,
    images: [img],
    unitCost: Number(p.unitCost) || 0,
    sellingPrice: sellingPriceUsd,
    priceBdt,
    compareAtPriceBdt: override?.compareAtPriceBdt,
    currentStock: p.currentStock ?? 0,
    reorderLevel: p.reorderLevel ?? 5,
    isSyncedToEcommerce: p.isSyncedToEcommerce !== false,
    isCustomizable: override?.isCustomizable ?? false,
    customizationOptions: override?.customizationOptions ?? [],
    materialsUsed: override?.materialsUsed ?? ['Locally Sourced Natural Craft Materials'],
    craftTimeDays: override?.craftTimeDays ?? 4,
    tags: override?.tags ?? ['Handcrafted', 'Bangladesh'],
    rating: override?.rating ?? 4.85,
    reviewCount: override?.reviewCount ?? 12,
    moderationStatus: override?.moderationStatus ?? 'approved',
    rejectionReason: override?.rejectionReason ?? null,
    featured: override?.featured ?? false,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

export function setProductMetadataOverride(
  productId: string,
  patch: Partial<
    Pick<
      ProductDTO,
      | 'category'
      | 'isCustomizable'
      | 'customizationOptions'
      | 'materialsUsed'
      | 'craftTimeDays'
      | 'tags'
      | 'moderationStatus'
      | 'rejectionReason'
      | 'featured'
    >
  >
): void {
  const existing = PRODUCT_METADATA_OVERRIDES.get(productId) ?? {};
  PRODUCT_METADATA_OVERRIDES.set(productId, { ...existing, ...patch });
}

export async function getEnrichedProducts(tenantId?: string): Promise<ProductDTO[]> {
  const rows = await getProducts(tenantId);
  return rows.map(mapDbProductToDTO);
}

// ============================================================================
// VENDORS
// ============================================================================
export function listVendors(): VendorDTO[] {
  return [...vendorsStore];
}

export function findVendorByIdOrSlug(idOrSlug: string): VendorDTO | undefined {
  return vendorsStore.find((v) => v.id === idOrSlug || v.publicSlug === idOrSlug);
}

export function createVendorApplication(input: CreateVendorApplication): VendorDTO {
  const id = createCuid('v');
  const baseSlug = slugify(input.displayName) || id;
  const uniqueSlug = vendorsStore.some((v) => v.publicSlug === baseSlug)
    ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
    : baseSlug;

  const created: VendorDTO = {
    id,
    publicSlug: uniqueSlug,
    displayName: input.displayName,
    legalName: input.legalName,
    status: 'submitted',
    craftSpecialty: input.craftSpecialty,
    description: input.description,
    workshopLocation: input.workshopLocation,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    allowCod: input.allowCod,
    rating: 5.0,
    reviewCount: 0,
    verifiedArtisan: false,
    avatarUrl: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    bannerUrl: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    createdAt: new Date().toISOString(),
  };

  vendorsStore = [created, ...vendorsStore];
  appendAdminAuditLog({
    actorName: input.displayName,
    actorRole: 'vendor',
    action: 'vendor.application_submitted',
    entityType: 'vendor',
    entityId: created.id,
    reason: `New artisan studio application from ${input.workshopLocation}`,
  });
  return created;
}

export function updateVendorRecord(
  idOrSlug: string,
  patch: UpdateVendorRequest,
  actorName: string = 'Admin'
): VendorDTO | undefined {
  const idx = vendorsStore.findIndex((v) => v.id === idOrSlug || v.publicSlug === idOrSlug);
  if (idx === -1) return undefined;

  const current = vendorsStore[idx];
  const updated: VendorDTO = {
    ...current,
    ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.workshopLocation !== undefined ? { workshopLocation: patch.workshopLocation } : {}),
    ...(patch.supportEmail !== undefined ? { supportEmail: patch.supportEmail } : {}),
    ...(patch.supportPhone !== undefined ? { supportPhone: patch.supportPhone } : {}),
    ...(patch.allowCod !== undefined ? { allowCod: patch.allowCod } : {}),
    ...(patch.status !== undefined
      ? {
          status: patch.status,
          verifiedArtisan: patch.status === 'approved' ? true : current.verifiedArtisan,
        }
      : {}),
    ...(patch.statusReason !== undefined ? { statusReason: patch.statusReason } : {}),
  };

  vendorsStore[idx] = updated;
  if (patch.status && patch.status !== current.status) {
    appendAdminAuditLog({
      actorName,
      actorRole: 'admin',
      action: `vendor.${patch.status}`,
      entityType: 'vendor',
      entityId: updated.id,
      reason: patch.statusReason || patch.privateNote || `Status changed to ${patch.status}`,
    });
  }
  return updated;
}

// ============================================================================
// RAW MATERIALS & WHOLESALE ORDERS
// ============================================================================
export function listRawMaterials(): RawMaterialDTO[] {
  return [...rawMaterialsStore];
}

export function createRawMaterialListing(input: CreateRawMaterialRequest): RawMaterialDTO {
  const item: RawMaterialDTO = {
    id: createCuid('rm'),
    wholesalerVendorProfileId: input.wholesalerVendorProfileId,
    supplierName: input.supplierName,
    name: input.name,
    category: input.category,
    description: input.description,
    priceBdt: input.priceBdt,
    unit: input.unit,
    moq: input.moq,
    stockQuantity: input.stockQuantity,
    status: input.stockQuantity > 0 ? 'active' : 'out_of_stock',
    imageUrl: input.imageUrl || '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
    createdAt: new Date().toISOString(),
  };
  rawMaterialsStore = [item, ...rawMaterialsStore];
  return item;
}

export function listWholesaleOrders(): WholesaleOrderDTO[] {
  return [...wholesaleOrdersStore];
}

export function createWholesaleOrderRecord(
  input: CreateWholesaleOrderRequest
): { order?: WholesaleOrderDTO; error?: { code: string; detail: string; status: number } } {
  const lineItems: WholesaleOrderDTO['items'] = [];

  for (const reqItem of input.items) {
    const mat = rawMaterialsStore.find((m) => m.id === reqItem.rawMaterialId);
    if (!mat) {
      return {
        error: {
          code: 'RAW_MATERIAL_NOT_FOUND',
          detail: `Raw material ${reqItem.rawMaterialId} was not found.`,
          status: 404,
        },
      };
    }
    if (reqItem.quantity < mat.moq) {
      return {
        error: {
          code: 'MOQ_NOT_MET',
          detail: `${mat.name} requires a minimum order quantity of ${mat.moq} ${mat.unit}(s).`,
          status: 422,
        },
      };
    }
    if (reqItem.quantity > mat.stockQuantity) {
      return {
        error: {
          code: 'INSUFFICIENT_STOCK',
          detail: `Only ${mat.stockQuantity} ${mat.unit}(s) available for ${mat.name}.`,
          status: 409,
        },
      };
    }
    lineItems.push({
      rawMaterialId: mat.id,
      name: mat.name,
      supplierName: mat.supplierName,
      unit: mat.unit,
      unitPriceBdt: mat.priceBdt,
      quantity: reqItem.quantity,
      lineTotalBdt: mat.priceBdt * reqItem.quantity,
    });
  }

  for (const li of lineItems) {
    const mat = rawMaterialsStore.find((m) => m.id === li.rawMaterialId);
    if (mat) {
      mat.stockQuantity = Math.max(0, mat.stockQuantity - li.quantity);
      if (mat.stockQuantity === 0) mat.status = 'out_of_stock';
    }
  }

  const totalAmountBdt = lineItems.reduce((sum, li) => sum + li.lineTotalBdt, 0);
  const order: WholesaleOrderDTO = {
    id: createCuid('wo'),
    orderNumber: `WHL-BD-${Math.floor(1000 + Math.random() * 9000)}`,
    buyerVendorName: input.buyerVendorName,
    buyerPhone: input.buyerPhone,
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
    totalAmountBdt,
    status: 'pending',
    items: lineItems,
    createdAt: new Date().toISOString(),
  };

  wholesaleOrdersStore = [order, ...wholesaleOrdersStore];
  return { order };
}

// ============================================================================
// COUPONS
// ============================================================================
export function listCoupons(): CouponDTO[] {
  return [...couponsStore];
}

export function createCouponRecord(input: CreateCouponRequest): CouponDTO | { conflict: string } {
  const normalizedCode = input.code.toUpperCase().trim();
  if (couponsStore.some((c) => c.code === normalizedCode)) {
    return { conflict: `Coupon code "${normalizedCode}" already exists.` };
  }
  const coupon: CouponDTO = {
    id: createCuid('cpn'),
    code: normalizedCode,
    description: input.description,
    status: 'active',
    type: input.type,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minOrderBdt: input.minOrderBdt,
    maxDiscountCapBdt: input.maxDiscountCapBdt ?? null,
    usageLimit: input.usageLimit ?? null,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  couponsStore = [coupon, ...couponsStore];
  appendAdminAuditLog({
    actorName: 'Admin',
    actorRole: 'admin',
    action: 'coupon.created',
    entityType: 'coupon',
    entityId: coupon.id,
    reason: `Created coupon ${coupon.code}`,
  });
  return coupon;
}

export function validateCouponCode(code: string, subtotalBdt: number): CouponValidationResultDTO {
  const normalized = code.trim().toUpperCase();
  const coupon = couponsStore.find((c) => c.code === normalized);
  if (!coupon) {
    return { valid: false, code: normalized, discountBdt: 0, message: 'Coupon code not recognized.' };
  }
  if (coupon.status !== 'active') {
    return { valid: false, code: normalized, discountBdt: 0, message: 'This coupon is no longer active.' };
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, code: normalized, discountBdt: 0, message: 'Coupon usage limit reached.' };
  }
  if (subtotalBdt < coupon.minOrderBdt) {
    return {
      valid: false,
      code: normalized,
      discountBdt: 0,
      message: `Minimum order of ৳${coupon.minOrderBdt.toLocaleString()} required.`,
    };
  }

  let discountBdt =
    coupon.discountType === 'percentage'
      ? Math.round((subtotalBdt * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maxDiscountCapBdt && discountBdt > coupon.maxDiscountCapBdt) {
    discountBdt = coupon.maxDiscountCapBdt;
  }
  discountBdt = Math.min(discountBdt, subtotalBdt);

  return {
    valid: true,
    code: coupon.code,
    discountBdt,
    message: `Applied ${coupon.code}: saved ৳${discountBdt.toLocaleString()}.`,
    coupon,
  };
}

// ============================================================================
// REVIEWS
// ============================================================================
export function listReviews(filters?: { productId?: string; status?: string }): ReviewDTO[] {
  let result = [...reviewsStore];
  if (filters?.productId) {
    result = result.filter((r) => r.productId === filters.productId);
  }
  if (filters?.status && filters.status !== 'all') {
    result = result.filter((r) => r.status === filters.status);
  }
  return result;
}

export function createReviewRecord(input: CreateReviewRequest): ReviewDTO {
  const review: ReviewDTO = {
    id: createCuid('rev'),
    productId: input.productId,
    vendorProfileId: 'v-dhamrai-clay',
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    status: 'approved',
    createdAt: new Date().toISOString(),
  };
  reviewsStore = [review, ...reviewsStore];
  return review;
}

export function moderateReviewRecord(
  id: string,
  status: 'approved' | 'rejected' | 'hidden',
  reason?: string
): ReviewDTO | undefined {
  const idx = reviewsStore.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  reviewsStore[idx] = {
    ...reviewsStore[idx],
    status,
    rejectionReason: reason ?? null,
  };
  appendAdminAuditLog({
    actorName: 'Admin',
    actorRole: 'admin',
    action: `review.${status}`,
    entityType: 'review',
    entityId: id,
    reason: reason || `Review marked as ${status}`,
  });
  return reviewsStore[idx];
}

// ============================================================================
// DELIVERY ZONES, COURIERS & SHIPMENTS
// ============================================================================
export function listDeliveryZones(): DeliveryZoneDTO[] {
  return [...deliveryZonesStore];
}

export function listCourierProviders(): CourierProviderDTO[] {
  return [...courierProvidersStore];
}

export function updateDeliveryZoneTariff(
  idOrCode: string,
  basePriceBdt: number
): DeliveryZoneDTO | undefined {
  const idx = deliveryZonesStore.findIndex((z) => z.id === idOrCode || z.code === idOrCode);
  if (idx === -1) return undefined;
  deliveryZonesStore[idx] = {
    ...deliveryZonesStore[idx],
    basePriceBdt: Math.max(0, Math.round(basePriceBdt)),
  };
  return deliveryZonesStore[idx];
}

export function suggestCourierForLocation(
  district: string,
  upazila: string = ''
): CourierSuggestionDTO {
  const d = district.trim().toLowerCase();
  const isDhaka = d.includes('dhaka');
  const isRemote =
    d.includes('bandarban') ||
    d.includes('rangamati') ||
    d.includes('khagrachari') ||
    d.includes('sunamganj') ||
    d.includes('bhola');

  const zone =
    deliveryZonesStore.find((z) =>
      isDhaka ? z.code === 'dhaka_metro' : isRemote ? z.code === 'remote_area' : z.code === 'outside_dhaka'
    ) || deliveryZonesStore[1];

  const recommendedCourier = isDhaka
    ? courierProvidersStore[0] // Pathao fastest in Dhaka Metro
    : isRemote
    ? courierProvidersStore[1] // Steadfast strong rural coverage
    : courierProvidersStore[1]; // Steadfast outside Dhaka

  return {
    district,
    upazila: upazila || district,
    zone,
    recommendedCourier,
    confidenceScore: isDhaka ? 96 : isRemote ? 88 : 92,
    estimatedFeeBdt: zone.basePriceBdt,
    scoringBreakdown: {
      codScore: 95,
      priceScore: isDhaka ? 94 : 89,
      speedScore: isDhaka ? 98 : 87,
      availabilityScore: 96,
    },
  };
}

export function listShipments(): ShipmentDTO[] {
  return [...shipmentsStore];
}

export function bookShipmentRecord(input: {
  orderId: string;
  courierCode: 'pathao' | 'steadfast' | 'redx';
  trackingNumber?: string;
  overrideReason?: string;
}): ShipmentDTO {
  const courier =
    courierProvidersStore.find((c) => c.code === input.courierCode) || courierProvidersStore[0];
  const order = ordersStore.find((o) => o.id === input.orderId || o.orderNumber === input.orderId);
  const trackingNumber =
    input.trackingNumber?.trim() ||
    `${courier.code.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}-BD`;

  const shipmentId = createCuid('shp');
  const now = new Date().toISOString();

  const shipment: ShipmentDTO = {
    id: shipmentId,
    orderId: order?.id || input.orderId,
    orderNumber: order?.orderNumber || input.orderId,
    courierCode: courier.code,
    courierName: courier.name,
    trackingNumber,
    shippingFeeBdt: courier.basePriceBdt,
    codAmountBdt: order && order.paymentMethod === 'cod' ? Math.round(order.dueBalance * BDT_PER_USD) : 0,
    status: 'booked',
    overrideReason: input.overrideReason || null,
    events: [
      {
        id: createCuid('ev'),
        shipmentId,
        status: 'booked',
        location: 'Artisan Origin Workshop',
        description: `Consignment booked with ${courier.name} (${trackingNumber}).`,
        eventTimestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  shipmentsStore = [shipment, ...shipmentsStore];

  if (order) {
    order.courierService = courier.code;
    order.trackingCode = trackingNumber;
    order.courierStatus = 'pending_pickup';
    if (order.status === 'pending' || order.status === 'processing') {
      order.status = 'shipped';
    }
  }

  return shipment;
}

export function appendShipmentEventRecord(
  shipmentId: string,
  event: {
    status: 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'returned';
    location: string;
    description: string;
  }
): ShipmentDTO | undefined {
  const shipment = shipmentsStore.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
  if (!shipment) return undefined;

  const now = new Date().toISOString();
  shipment.status = event.status;
  shipment.updatedAt = now;
  shipment.events.push({
    id: createCuid('ev'),
    shipmentId: shipment.id,
    status: event.status,
    location: event.location,
    description: event.description,
    eventTimestamp: now,
  });

  const order = ordersStore.find((o) => o.id === shipment.orderId);
  if (order) {
    order.courierStatus =
      event.status === 'booked' || event.status === 'picked_up'
        ? 'pending_pickup'
        : event.status;
    if (event.status === 'delivered') {
      order.status = 'delivered';
      order.paymentStatus = 'paid';
      order.dueBalance = 0;
    }
  }

  return shipment;
}

// ============================================================================
// ORDERS (LIVE SYNC WITH POS STOCK & LEDGER)
// ============================================================================
export function listOrders(filters?: {
  status?: string;
  paymentMethod?: string;
  courier?: string;
  buyerUserId?: string;
}): OrderDTO[] {
  let result = [...ordersStore];
  if (filters?.status && filters.status !== 'all') {
    result = result.filter((o) => o.status === filters.status);
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    result = result.filter((o) => o.paymentMethod === filters.paymentMethod);
  }
  if (filters?.courier && filters.courier !== 'all') {
    result = result.filter((o) => o.courierService === filters.courier);
  }
  if (filters?.buyerUserId) {
    result = result.filter((o) => o.buyerUserId === filters.buyerUserId);
  }
  return result;
}

export function findOrderById(idOrNumber: string): OrderDTO | undefined {
  return ordersStore.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
}

export async function createOrderWithPosSync(
  input: CreateOrderRequest
): Promise<{ order?: OrderDTO; conflict?: string }> {
  // Validate stock availability against live WAW-POS catalog
  const liveProducts = await getProducts(DEFAULT_TENANT.id);
  for (const item of input.items) {
    const matched = liveProducts.find((p) => p.id === item.productId);
    if (matched && (matched.currentStock ?? 0) < item.quantity) {
      return {
        conflict: `Insufficient stock for "${matched.name}": requested ${item.quantity}, available ${matched.currentStock ?? 0}.`,
      };
    }
  }

  const calculatedSubtotal =
    input.subtotalAmount ??
    input.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const shippingFee = input.shippingFee ?? 0;
  const discountAmount = input.discountAmount ?? 0;
  const totalAmount =
    input.totalAmount ?? Math.max(0, calculatedSubtotal + shippingFee - discountAmount);
  const advanceAmount =
    input.paymentMethod === 'cod'
      ? input.advanceAmount ?? 0
      : input.advanceAmount > 0
      ? input.advanceAmount
      : totalAmount;
  const dueBalance = Math.max(0, totalAmount - advanceAmount);

  // Fraud & trust scoring
  let fraudScore = 0.08;
  const fraudSignals: string[] = [];
  if (input.paymentMethod === 'cod' && totalAmount > 150) {
    fraudScore += 0.45;
    fraudSignals.push('High-value COD order without advance payment');
  }
  if (advanceAmount > 0) {
    fraudScore = Math.max(0.05, fraudScore - 0.15);
    fraudSignals.push('Digital payment verified');
  }
  if (/^(\+?8801[3-9]|01[3-9])/.test(input.customerPhone.replace(/[\s-]/g, ''))) {
    fraudSignals.push('Valid Bangladeshi mobile operator prefix');
  } else {
    fraudScore += 0.25;
    fraudSignals.push('Unverified mobile prefix');
  }

  const fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    fraudScore > 0.65 ? 'HIGH' : fraudScore > 0.35 ? 'MEDIUM' : 'LOW';

  const courierService = input.courierService ?? 'pathao';
  const trackingCode = `${courierService.slice(0, 3).toUpperCase()}-${Math.floor(
    100000 + Math.random() * 900000
  )}-BD`;

  const newOrder: OrderDTO = {
    id: createCuid('ord'),
    orderNumber: `WAW-BD-${Math.floor(1000 + Math.random() * 9000)}`,
    buyerUserId: input.buyerUserId || 'buyer-anika',
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: input.shippingAddress,
    items: input.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      sku: it.sku || 'ART',
      vendorId: it.vendorId,
      vendorName: it.vendorName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      customSelections: it.customSelections,
      customNote: it.customNote,
    })),
    subtotalAmount: Number(calculatedSubtotal.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    couponCode: input.couponCode || null,
    totalAmount: Number(totalAmount.toFixed(2)),
    advanceAmount: Number(advanceAmount.toFixed(2)),
    dueBalance: Number(dueBalance.toFixed(2)),
    paymentMethod: input.paymentMethod,
    paymentStatus: dueBalance === 0 ? 'paid' : advanceAmount > 0 ? 'partial' : 'unpaid',
    status: 'pending',
    courierService,
    trackingCode,
    courierStatus: 'pending_pickup',
    fraudRiskScore: Number(fraudScore.toFixed(2)),
    fraudRiskLevel,
    fraudSignals,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  ordersStore = [newOrder, ...ordersStore];

  if (input.couponCode) {
    const matchedCoupon = couponsStore.find((c) => c.code === input.couponCode?.toUpperCase());
    if (matchedCoupon) matchedCoupon.usageCount += 1;
  }

  // Create companion shipment record
  bookShipmentRecord({
    orderId: newOrder.id,
    courierCode: courierService,
    trackingNumber: trackingCode,
  });

  // Deduct stock atomically in WAW-POS & record audit logs
  for (const item of newOrder.items) {
    try {
      await adjustProductStock({
        productId: item.productId,
        changeAmount: -Math.abs(item.quantity),
        reason: `Storefront Order ${newOrder.orderNumber}`,
        adjustmentType: 'correction',
        userId: 'storefront-astro',
        userName: 'Astro Storefront API',
        userRole: 'E-Commerce Bridge',
        notes: `Checkout by ${newOrder.customerName} (${newOrder.paymentMethod.toUpperCase()})`,
      });
    } catch {
      // External or custom SKU
    }
  }

  // Mirror sale into WAW-POS sales ledger
  try {
    await recordSale({
      tenantId: DEFAULT_TENANT.id,
      storeId: DEFAULT_STORE.code,
      invoiceNumber: newOrder.orderNumber,
      status: 'completed',
      subtotal: newOrder.subtotalAmount,
      discountAmount: newOrder.discountAmount,
      taxAmount: 0,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      customerName: newOrder.customerName,
      notes: `Artisan's Market REST Order (${courierService.toUpperCase()})`,
      items: newOrder.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitCost: Number((it.unitPrice * 0.6).toFixed(2)),
        unitPrice: it.unitPrice,
        totalPrice: Number((it.quantity * it.unitPrice).toFixed(2)),
      })),
    });
  } catch {
    // Non-blocking ledger mirror
  }

  // Push buyer notification
  const buyer = buyerProfilesStore.get(newOrder.buyerUserId || 'buyer-anika');
  if (buyer) {
    buyer.notifications.unshift({
      id: createCuid('ntf'),
      title: `Order ${newOrder.orderNumber} Confirmed`,
      body: `Tracking ${trackingCode} assigned via ${courierService.toUpperCase()}.`,
      type: 'order_placed',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return { order: newOrder };
}

export function updateOrderRecord(
  idOrNumber: string,
  patch: UpdateOrderRequest
): OrderDTO | undefined {
  const order = ordersStore.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
  if (!order) return undefined;

  if (patch.status !== undefined) order.status = patch.status;
  if (patch.courierService !== undefined) order.courierService = patch.courierService;
  if (patch.trackingCode !== undefined) order.trackingCode = patch.trackingCode;
  if (patch.courierStatus !== undefined) order.courierStatus = patch.courierStatus;
  if (patch.advanceAmount !== undefined) {
    order.advanceAmount = patch.advanceAmount;
    order.dueBalance = Math.max(0, Number((order.totalAmount - patch.advanceAmount).toFixed(2)));
    order.paymentStatus =
      order.dueBalance === 0 ? 'paid' : order.advanceAmount > 0 ? 'partial' : 'unpaid';
  }
  return order;
}

// ============================================================================
// VENDOR SETTLEMENTS
// ============================================================================
export function listSettlements(): VendorSettlementDTO[] {
  return [...settlementsStore];
}

export function updateSettlementStatus(
  id: string,
  status: VendorSettlementDTO['status']
): VendorSettlementDTO | undefined {
  const idx = settlementsStore.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  settlementsStore[idx] = {
    ...settlementsStore[idx],
    status,
    paidAt: status === 'paid' ? new Date().toISOString() : settlementsStore[idx].paidAt,
  };
  appendAdminAuditLog({
    actorName: 'Admin',
    actorRole: 'admin',
    action: `settlement.${status}`,
    entityType: 'settlement',
    entityId: id,
    reason: `Settlement marked as ${status}`,
  });
  return settlementsStore[idx];
}

// ============================================================================
// BUYER PROFILE & WISHLIST
// ============================================================================
export function getBuyerProfile(buyerId: string): BuyerProfileDTO {
  const existing = buyerProfilesStore.get(buyerId);
  if (existing) return existing;
  return buyerProfilesStore.get('buyer-anika')!;
}

export function updateBuyerProfile(
  buyerId: string,
  patch: { trustScore?: number; codEligible?: boolean; styleProfile?: BuyerProfileDTO['styleProfile'] }
): BuyerProfileDTO {
  const profile = getBuyerProfile(buyerId);
  if (patch.trustScore !== undefined) {
    profile.trustScore = Math.max(0, Math.min(100, Math.round(patch.trustScore)));
    profile.riskLevel =
      profile.trustScore >= 75 ? 'low' : profile.trustScore >= 45 ? 'medium' : 'high';
  }
  if (patch.codEligible !== undefined) {
    profile.codEligible = patch.codEligible;
  }
  if (patch.styleProfile) {
    profile.styleProfile = patch.styleProfile;
  }
  return profile;
}

export function toggleBuyerWishlist(
  buyerId: string,
  productId: string
): { productId: string; wishlisted: boolean; wishlistProductIds: string[] } {
  const profile = getBuyerProfile(buyerId);
  const exists = profile.wishlistProductIds.includes(productId);
  if (exists) {
    profile.wishlistProductIds = profile.wishlistProductIds.filter((id) => id !== productId);
  } else {
    profile.wishlistProductIds = [productId, ...profile.wishlistProductIds];
  }
  return {
    productId,
    wishlisted: !exists,
    wishlistProductIds: [...profile.wishlistProductIds],
  };
}
