import {
  ApiList,
  ApiProblemError,
  ApiSuccess,
  ListQueryParams,
  ProblemDetails,
} from './rest.js';
import type {
  BuyerProfileDTO,
  CouponValidationResultDTO,
  CourierSuggestionDTO,
  CraftAdvisorResponseDTO,
  CreateOrderRequest,
  CreateRawMaterialRequest,
  CreateReviewRequest,
  CreateVendorApplication,
  CreateWholesaleOrderRequest,
  DeliveryZoneDTO,
  MarkNotificationsReadRequest,
  OrderDTO,
  ProductDTO,
  ProductStoryResponseDTO,
  RawMaterialDTO,
  ReviewDTO,
  UpdateBuyerProfileRequest,
  VendorDTO,
  WholesaleOrderDTO,
  WholesaleOrderStatus,
} from './dto.js';

export interface WawApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}

export function createWawApiClient(options: WawApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const fetchFn = options.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init?: RequestInit & { idempotencyKey?: string }
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.defaultHeaders ?? {}),
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (init?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (init?.idempotencyKey) {
      headers['Idempotency-Key'] = init.idempotencyKey;
    }

    const res = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson =
      contentType.includes('application/json') ||
      contentType.includes('application/problem+json');
    const payload = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const problem: ProblemDetails =
        payload && typeof payload === 'object' && 'status' in payload && 'title' in payload
          ? (payload as ProblemDetails)
          : {
              type: 'about:blank',
              title: res.statusText || 'Request Failed',
              status: res.status,
              detail:
                (payload && typeof payload === 'object' && 'detail' in payload
                  ? String((payload as { detail: unknown }).detail)
                  : undefined) || `HTTP ${res.status} error calling ${path}`,
              instance: path,
              code: 'HTTP_ERROR',
              requestId: res.headers.get('x-request-id') || 'unknown',
            };
      throw new ApiProblemError(problem);
    }

    return payload as T;
  }

  return {
    getProducts(params?: ListQueryParams): Promise<ApiList<ProductDTO>> {
      return request(`/api/v1/products${buildQuery(params as Record<string, string | number | boolean | undefined>)}`);
    },

    getProduct(id: string): Promise<ApiSuccess<ProductDTO>> {
      return request(`/api/v1/products/${encodeURIComponent(id)}`);
    },

    getVendors(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiList<VendorDTO>> {
      return request(`/api/v1/vendors${buildQuery(params)}`);
    },

    getVendor(idOrSlug: string): Promise<ApiSuccess<VendorDTO & { products: ProductDTO[] }>> {
      return request(`/api/v1/vendors/${encodeURIComponent(idOrSlug)}`);
    },

    submitVendorApplication(body: CreateVendorApplication): Promise<ApiSuccess<VendorDTO>> {
      return request('/api/v1/vendors', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    getRawMaterials(params?: { category?: string; search?: string; inStockOnly?: boolean }): Promise<ApiList<RawMaterialDTO>> {
      return request(`/api/v1/raw-materials${buildQuery(params)}`);
    },

    createRawMaterial(body: CreateRawMaterialRequest): Promise<ApiSuccess<RawMaterialDTO>> {
      return request('/api/v1/raw-materials', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    getWholesaleOrders(): Promise<ApiList<WholesaleOrderDTO>> {
      return request('/api/v1/wholesale-orders');
    },

    createWholesaleOrder(
      body: CreateWholesaleOrderRequest,
      idempotencyKey?: string
    ): Promise<ApiSuccess<WholesaleOrderDTO>> {
      return request('/api/v1/wholesale-orders', {
        method: 'POST',
        body: JSON.stringify(body),
        idempotencyKey,
      });
    },

    updateWholesaleOrderStatus(
      id: string,
      status: WholesaleOrderStatus
    ): Promise<ApiSuccess<WholesaleOrderDTO>> {
      return request(`/api/v1/wholesale-orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    getReviews(params?: { productId?: string; status?: string }): Promise<ApiList<ReviewDTO>> {
      return request(`/api/v1/reviews${buildQuery(params)}`);
    },

    submitReview(body: CreateReviewRequest): Promise<ApiSuccess<ReviewDTO>> {
      return request('/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    validateCoupon(code: string, subtotalBdt: number): Promise<ApiSuccess<CouponValidationResultDTO>> {
      return request('/api/v1/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotalBdt }),
      });
    },

    getDeliveryZones(): Promise<ApiList<DeliveryZoneDTO>> {
      return request('/api/v1/delivery-zones');
    },

    getCourierSuggestion(district: string, upazila?: string): Promise<ApiSuccess<CourierSuggestionDTO>> {
      return request(`/api/v1/delivery-zones${buildQuery({ suggest: 'true', district, upazila })}`);
    },

    getOrders(params?: { buyerUserId?: string; status?: string; page?: number; limit?: number }): Promise<ApiList<OrderDTO>> {
      return request(`/api/v1/orders${buildQuery(params)}`);
    },

    getOrder(id: string): Promise<ApiSuccess<OrderDTO>> {
      return request(`/api/v1/orders/${encodeURIComponent(id)}`);
    },

    createOrder(body: CreateOrderRequest, idempotencyKey: string): Promise<ApiSuccess<OrderDTO>> {
      return request('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(body),
        idempotencyKey,
      });
    },

    getBuyerProfile(buyerId: string): Promise<ApiSuccess<BuyerProfileDTO>> {
      return request(`/api/v1/buyers/${encodeURIComponent(buyerId)}/profile`);
    },

    updateBuyerProfile(
      buyerId: string,
      body: UpdateBuyerProfileRequest
    ): Promise<ApiSuccess<BuyerProfileDTO>> {
      return request(`/api/v1/buyers/${encodeURIComponent(buyerId)}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },

    verifyBuyerPhone(buyerId: string): Promise<ApiSuccess<BuyerProfileDTO>> {
      return request(`/api/v1/buyers/${encodeURIComponent(buyerId)}/verify-phone`, {
        method: 'POST',
      });
    },

    markBuyerNotificationsRead(
      buyerId: string,
      body: MarkNotificationsReadRequest
    ): Promise<ApiSuccess<BuyerProfileDTO>> {
      return request(`/api/v1/buyers/${encodeURIComponent(buyerId)}/notifications/read`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    toggleWishlist(
      buyerId: string,
      productId: string
    ): Promise<ApiSuccess<{ productId: string; wishlisted: boolean; wishlistProductIds: string[] }>> {
      return request(`/api/v1/buyers/${encodeURIComponent(buyerId)}/wishlist`, {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
    },

    askCraftAdvisor(prompt: string): Promise<ApiSuccess<CraftAdvisorResponseDTO>> {
      return request('/api/v1/ai/craft-advisor', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    },

    generateProductStory(body: {
      title: string;
      category: string;
      materials: string;
    }): Promise<ApiSuccess<ProductStoryResponseDTO>> {
      return request('/api/v1/ai/product-story', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  };
}

export type WawApiClient = ReturnType<typeof createWawApiClient>;
