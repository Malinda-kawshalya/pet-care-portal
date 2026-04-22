import { apiRequest } from "@/lib/api";
import type { ShopListResponse, ShopProduct, ShopProductInput } from "@/types/shop";

export async function fetchShopProducts(): Promise<ShopListResponse> {
  const response = await apiRequest<ShopListResponse>("/shop/products", {
    method: "GET",
  });

  if (!response.data) {
    throw new Error("Invalid shop products response");
  }

  return response.data;
}

export async function fetchMyShopProducts(includeInactive = true): Promise<ShopProduct[]> {
  const response = await apiRequest<{ products: ShopProduct[] }>(
    `/shop/products/mine?includeInactive=${includeInactive ? "true" : "false"}`,
    {
      method: "GET",
      auth: true,
    }
  );

  if (!response.data?.products) {
    return [];
  }

  return response.data.products;
}

export async function createShopProduct(input: ShopProductInput): Promise<ShopProduct> {
  const response = await apiRequest<{ product: ShopProduct }>("/shop/products", {
    method: "POST",
    body: input,
    auth: true,
  });

  if (!response.data?.product) {
    throw new Error("Invalid product creation response");
  }

  return response.data.product;
}

export async function updateShopProduct(
  productId: string,
  input: Partial<ShopProductInput>
): Promise<ShopProduct> {
  const response = await apiRequest<{ product: ShopProduct }>(`/shop/products/${productId}`, {
    method: "PATCH",
    body: input,
    auth: true,
  });

  if (!response.data?.product) {
    throw new Error("Invalid product update response");
  }

  return response.data.product;
}

export async function deleteShopProduct(productId: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/shop/products/${productId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function fetchPendingShopProducts(): Promise<ShopListResponse> {
  const response = await apiRequest<ShopListResponse>("/shop/products/pending", {
    method: "GET",
    auth: true,
  });

  if (!response.data) {
    throw new Error("Invalid pending products response");
  }

  return response.data;
}

export async function approveShopProduct(productId: string): Promise<ShopProduct> {
  const response = await apiRequest<{ product: ShopProduct }>(`/shop/products/${productId}/approve`, {
    method: "POST",
    auth: true,
  });

  if (!response.data?.product) {
    throw new Error("Invalid product approval response");
  }

  return response.data.product;
}

export async function rejectShopProduct(productId: string): Promise<ShopProduct> {
  const response = await apiRequest<{ product: ShopProduct }>(`/shop/products/${productId}/reject`, {
    method: "POST",
    auth: true,
  });

  if (!response.data?.product) {
    throw new Error("Invalid product rejection response");
  }

  return response.data.product;
}
