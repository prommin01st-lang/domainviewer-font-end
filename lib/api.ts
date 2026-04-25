import axios from "axios";
import { User, PagedList } from "@/lib/types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function isTokenExpiringSoon(): boolean {
  if (typeof window === "undefined") return false;
  const expiresAt = localStorage.getItem("accessTokenExpiresAt");
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  // Refresh if token expires within 2 minutes
  return expiry.getTime() - now.getTime() < 2 * 60 * 1000;
}

function unwrapApiResponse<T>(responseData: unknown): T {
  // Guard against HTML error pages from proxy
  if (typeof responseData === "string" && responseData.trim().startsWith("<!DOCTYPE html>")) {
    throw new Error(
      `Proxy returned HTML instead of JSON. Backend may be unreachable or Ngrok warning. Response: ${responseData.slice(0, 200)}`
    );
  }

  if (responseData && typeof responseData === "object") {
    const data = responseData as Record<string, unknown>;
    
    // Support both camelCase and PascalCase
    const success = data.success !== undefined ? data.success : data.Success;
    const resultData = data.data !== undefined ? data.data : data.Data;

    if (success !== undefined && resultData !== undefined) {
      return resultData as T;
    }
  }
  
  return responseData as T;
}

export function unwrapPagedList<T>(data: unknown): PagedList<T> {
  const defaultPagedList: PagedList<T> = {
    items: [],
    pageIndex: 1,
    totalPages: 1,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  if (!data || typeof data !== "object") return defaultPagedList;

  const obj = data as Record<string, unknown>;
  
  // Support both camelCase and PascalCase
  const items = (obj.items || obj.Items) as T[] || [];
  const pageIndex = (obj.pageIndex || obj.PageIndex) as number || 1;
  const totalPages = (obj.totalPages || obj.TotalPages) as number || 1;
  const totalCount = (obj.totalCount || obj.TotalCount) as number || 0;
  const hasPreviousPage = (obj.hasPreviousPage !== undefined ? obj.hasPreviousPage : obj.HasPreviousPage) as boolean || false;
  const hasNextPage = (obj.hasNextPage !== undefined ? obj.hasNextPage : obj.HasNextPage) as boolean || false;

  return {
    items,
    pageIndex,
    totalPages,
    totalCount,
    hasPreviousPage,
    hasNextPage,
  };
}

export function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const items = obj.items || obj.Items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: User | null;
}

export async function refreshTokens(): Promise<RefreshResult | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    // Use raw axios to avoid interceptor loop, or add a header
    const response = await axios.post("/api/auth/refresh-token", 
      { refreshToken },
      { headers: { "X-Skip-Auth": "true" } }
    );
    
    const apiResponse = unwrapApiResponse<Record<string, unknown>>(response.data);
    
    // Support both camelCase and PascalCase in the AuthResponse
    const accessToken = (apiResponse.accessToken || apiResponse.AccessToken) as string;
    const newRefreshToken = (apiResponse.refreshToken || apiResponse.RefreshToken) as string;
    const accessTokenExpiresAt = (apiResponse.accessTokenExpiresAt || apiResponse.AccessTokenExpiresAt) as string;
    const user = (apiResponse.user || apiResponse.User) as User | null;

    if (!accessToken || !newRefreshToken) return null;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("accessTokenExpiresAt", accessTokenExpiresAt);
    
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    
    return { accessToken, refreshToken: newRefreshToken, accessTokenExpiresAt, user };
  } catch (error) {
    console.error("[API] Refresh token failed:", error);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessTokenExpiresAt");
    delete api.defaults.headers.common["Authorization"];
    return null;
  }
}

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      // Wait if another request is already refreshing the token
      if (isRefreshing && !config.url?.includes("/auth/refresh-token")) {
        await new Promise<string>((resolve) => subscribeTokenRefresh(resolve));
      }

      const token = localStorage.getItem("accessToken");
      if (token) {
        // Check if token needs refresh before making request
        if (isTokenExpiringSoon() && !config.url?.includes("/auth/refresh-token")) {
          if (!isRefreshing) {
            isRefreshing = true;
            const result = await refreshTokens();
            isRefreshing = false;
            if (result) {
              onTokenRefreshed(result.accessToken);
            }
          } else {
            // Another request triggered refresh; wait for it
            await new Promise<string>((resolve) => subscribeTokenRefresh(resolve));
          }
        }
        config.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap ApiResponse + handle 401
api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Unwrap error response if it's in ApiResponse format
    if (error.response?.data && typeof error.response.data === "object") {
      const apiError = error.response.data as { success?: boolean; message?: string; errorCode?: string };
      if (apiError.success === false && apiError.message) {
        error.response.data = { message: apiError.message, errorCode: apiError.errorCode };
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        // Refresh token itself failed, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const result = await refreshTokens();
        isRefreshing = false;
        
        if (result) {
          const newToken = result.accessToken;
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } else {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
