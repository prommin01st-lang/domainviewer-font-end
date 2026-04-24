import axios from "axios";

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
  if (
    responseData &&
    typeof responseData === "object" &&
    "success" in responseData &&
    "data" in responseData
  ) {
    return (responseData as { data: T }).data;
  }
  return responseData as T;
}

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await axios.post("/api/auth/refresh-token", { refreshToken });
    const apiResponse = unwrapApiResponse<{
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
    }>(response.data);
    const { accessToken, refreshToken: newRefreshToken, accessTokenExpiresAt } = apiResponse;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("accessTokenExpiresAt", accessTokenExpiresAt);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    return accessToken;
  } catch {
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
            const newToken = await doRefreshToken();
            isRefreshing = false;
            if (newToken) {
              onTokenRefreshed(newToken);
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
        const newToken = await doRefreshToken();
        isRefreshing = false;

        if (newToken) {
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
