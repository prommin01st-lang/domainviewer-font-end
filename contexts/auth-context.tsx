"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import api, { refreshTokens } from "@/lib/api";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessTokenExpiresAt");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  const setAuthData = useCallback(
    (accessToken: string, refreshToken: string, accessTokenExpiresAt: string, userData: User) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("accessTokenExpiresAt", accessTokenExpiresAt);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setUser(userData);
    },
    []
  );

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await refreshTokens();
      if (result) {
        if (result.user) setUser(result.user);
        return true;
      }
      clearAuth();
      return false;
    } catch {
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const expiresAt = localStorage.getItem("accessTokenExpiresAt");

      if (accessToken && expiresAt) {
        const expiry = new Date(expiresAt);
        const now = new Date();

        // If token expires within 2 minutes, refresh it
        if (expiry.getTime() - now.getTime() < 2 * 60 * 1000) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            setIsLoading(false);
            return;
          }
        } else {
          api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        }

        // Fetch current user
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            try {
              const response = await api.get("/auth/me");
              setUser(response.data);
            } catch {
              clearAuth();
            }
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [refreshAccessToken, clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;
    
    // Support both camelCase and PascalCase
    const accessToken = data.accessToken || data.AccessToken;
    const refreshToken = data.refreshToken || data.RefreshToken;
    const accessTokenExpiresAt = data.accessTokenExpiresAt || data.AccessTokenExpiresAt;
    const userData = data.user || data.User;

    setAuthData(accessToken, refreshToken, accessTokenExpiresAt, userData);
    router.push("/domains");
  }, [setAuthData, router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch {
      // silent fail
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshAccessToken,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshAccessToken, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
