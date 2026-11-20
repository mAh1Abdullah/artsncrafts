export type ArtisanCategoryId =
  | 'all'
  | 'pottery'
  | 'textiles'
  | 'woodwork'
  | 'jewelry'
  | 'leatherwork'
  | 'paintings'
  | 'weaves';

export interface CustomizationOption {
  id: string;
  type: 'select' | 'text';
  label: string;
  options?: string[];
  placeholder?: string;
  priceModifierUsd: number;
}

export interface ArtisanWorkshop {
  id: string;
  slug: string;
  displayName: string;
  craftSpecialty: string;
  location: string;
  establishedYear: number;
  artisanCount: number;
  description: string;
  signatureTechnique: string;
  rating: number;
  reviewCount: number;
  coverImage: string;
  leadTimeSummary: string;
}

export interface ArtisanProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: Exclude<ArtisanCategoryId, 'all'>;
  categoryLabel: string;
  workshopId: string;
  workshopName: string;
  workshopLocation: string;
  priceUsd: number;
  compareAtPriceUsd?: number;
  stock: number;
  reorderLevel: number;
  image: string;
  materials: string[];
  craftTimeDays: number;
  rating: number;
  reviewCount: number;
  isCustomizable: boolean;
  customizationOptions?: CustomizationOption[];
  isFeatured?: boolean;
}

export interface StorefrontCartItem {
  cartKey: string;
  product: ArtisanProduct;
  quantity: number;
  selectedOptions: Record<string, string>;
  optionModifierUsd: number;
  customNote?: string;
}

export interface StorefrontOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  advanceAmount: number;
  dueBalance: number;
  paymentMethod: 'bkash' | 'nagad' | 'uddoktapay' | 'amarpay' | 'cod' | 'card' | 'cash';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'pending' | 'completed' | 'voided' | 'incomplete' | 'cancelled';
  courierService: 'pathao' | 'steadfast' | null;
  trackingCode: string | null;
  courierStatus?: 'pending_pickup' | 'in_transit' | 'delivered' | 'returned';
  fraudRiskScore: number;
  fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
  createdAt: string;
}
