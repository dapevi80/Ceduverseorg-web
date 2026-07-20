import { createContext, useContext, useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth-token";

type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  isExecutive?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  sendCode: (email: string, fullName?: string, extra?: { joinCoop?: boolean; acceptedTerms?: boolean; phone?: string; curp?: string; mode?: "login" | "register" }) => Promise<{ autoLogin?: boolean }>;
  verifyCode: (email: string, code: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch("/api/auth/me", {
      credentials: "include",
      headers,
    })
      .then((res) => {
        if (!res.ok) {
          clearAuthToken();
          setUser(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser({
            id: data.id,
            email: data.email,
            fullName: data.fullName,
            role: data.role,
            isExecutive: data.isExecutive,
          });
        }
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const sendCode = async (email: string, fullName?: string, extra?: { joinCoop?: boolean; acceptedTerms?: boolean; phone?: string; curp?: string; mode?: "login" | "register" }): Promise<{ autoLogin?: boolean }> => {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, ...extra }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.message || "Error al enviar el código") as Error & { code?: string };
      if (data.code) err.code = data.code;
      throw err;
    }

    const data = await res.json();
    if (data.autoLogin && data.token) {
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
      });
      return { autoLogin: true };
    }
    return {};
  };

  const verifyCode = async (email: string, code: string) => {
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Código inválido");
    }

    const data = await res.json();
    setAuthToken(data.token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName,
      role: data.user.role,
    });
  };

  const adminLogin = async (email: string, password: string) => {
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Credenciales inválidas");
    }

    const data = await res.json();
    setAuthToken(data.token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName,
      role: data.user.role,
    });
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors — still clear client state below
    }
    clearAuthToken();
    setUser(null);
    queryClient.clear();
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sendCode, verifyCode, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
