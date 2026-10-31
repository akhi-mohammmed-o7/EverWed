import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginRequest } from "@/types";
import { services } from "@/services";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isPlanner: boolean;
  isCouple: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: "admin" | "couple" | "planner") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state from storage
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
      }
    } else {
      // Do not auto-authenticate new visitors; require explicit login
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const res = await services.auth.login(credentials);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
  };

  const logout = async () => {
    await services.auth.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const switchRole = (role: "admin" | "couple" | "planner") => {
    let newUser: User;
    const newToken = `session-token-${role}-${Date.now()}`;
    if (role === "couple") {
      newUser = { uid: 2, name: "Aisha & Vikram", email: "couple@everwed.in", role: "couple" };
    } else if (role === "planner") {
      newUser = { uid: 3, name: "Rohan Joshi", email: "rohan@everwed.in", role: "planner" };
    } else {
      newUser = { uid: 1, name: "Priya Arora (Founder)", email: "priya@everwed.in", role: "admin" };
    }
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const isAdmin = user?.role === "admin";
  const isPlanner = user?.role === "planner" || user?.role === "admin";
  const isCouple = user?.role === "couple";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isPlanner,
        isCouple,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
