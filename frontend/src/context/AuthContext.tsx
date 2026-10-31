import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, LoginRequest, CoupleSignupRequest } from "@/types";
import { services } from "@/services";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isPlanner: boolean;
  isCouple: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  setupFounder: (credentials: { name: string; email: string; password: string }) => Promise<User>;
  registerCouple: (payload: CoupleSignupRequest) => Promise<User>;
  refreshProfile: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        // The real API validates its HttpOnly session cookie on every load.
        // Only the explicitly selected demo adapter restores a local persona.
        const savedUser = services.isDemo ? localStorage.getItem("auth_user") : null;
        const restoredUser = services.isDemo
          ? (savedUser ? (JSON.parse(savedUser) as User) : null)
          : await services.auth.me();
        if (active) {
          setUser(restoredUser);
          if (restoredUser?.wedding_id) localStorage.setItem("active_wedding_id", restoredUser.wedding_id);
          else localStorage.removeItem("active_wedding_id");
        }
      } catch {
        if (services.isDemo) localStorage.removeItem("auth_user");
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<User> => {
    const result = await services.auth.login(credentials);
    setUser(result.user);
    if (result.user.wedding_id) localStorage.setItem("active_wedding_id", result.user.wedding_id);
    else localStorage.removeItem("active_wedding_id");
    return result.user;
  };

  const setupFounder = async (credentials: { name: string; email: string; password: string }): Promise<User> => {
    const result = await services.auth.setupFounder(credentials);
    setUser(result.user);
    localStorage.removeItem("active_wedding_id");
    return result.user;
  };

  const registerCouple = async (payload: CoupleSignupRequest): Promise<User> => {
    const result = await services.auth.registerCouple(payload);
    setUser(result.user);
    localStorage.removeItem("active_wedding_id");
    return result.user;
  };

  const refreshProfile = async (): Promise<User> => {
    const current = await services.auth.me();
    setUser(current);
    if (current.wedding_id) localStorage.setItem("active_wedding_id", current.wedding_id);
    else localStorage.removeItem("active_wedding_id");
    return current;
  };

  const logout = async () => {
    await services.auth.logout();
    setUser(null);
    localStorage.removeItem("active_wedding_id");
    if (services.isDemo) localStorage.removeItem("auth_user");
  };

  const isAdmin = user?.role === "admin";
  const isPlanner = user?.role === "planner" || user?.role === "admin";
  const isCouple = user?.role === "couple";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isPlanner,
        isCouple,
        login,
        setupFounder,
        registerCouple,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
