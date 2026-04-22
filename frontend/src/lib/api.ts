import { getAuthState } from "@/lib/auth-storage";
import type { ApiResponse } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type ApiClientOptions = {
  auth?: boolean;
};

function normalizePath(path: string) {
  return path.startsWith("/api/v1") ? path.replace(/^\/api\/v1/, "") : path;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const authState = options.auth ? getAuthState() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authState?.token
        ? {
            Authorization: `Bearer ${authState.token}`,
          }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export const apiClient = {
  get: async <T = any>(path: string, options: ApiClientOptions = {}) => ({
    data: await apiRequest<T>(normalizePath(path), { method: "GET", auth: options.auth }),
  }),
  post: async <T = any>(path: string, body?: unknown, options: ApiClientOptions = {}) => ({
    data: await apiRequest<T>(normalizePath(path), { method: "POST", body, auth: options.auth }),
  }),
  put: async <T = any>(path: string, body?: unknown, options: ApiClientOptions = {}) => ({
    data: await apiRequest<T>(normalizePath(path), { method: "PUT", body, auth: options.auth }),
  }),
  patch: async <T = any>(path: string, body?: unknown, options: ApiClientOptions = {}) => ({
    data: await apiRequest<T>(normalizePath(path), { method: "PATCH", body, auth: options.auth }),
  }),
  delete: async <T = any>(path: string, options: ApiClientOptions = {}) => ({
    data: await apiRequest<T>(normalizePath(path), { method: "DELETE", auth: options.auth }),
  }),
};
