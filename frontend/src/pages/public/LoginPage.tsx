import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Heart, Briefcase, ArrowRight, Lock, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EverWedLogo } from "@/components/ui/EverWedLogo";
import { useAuth } from "@/context/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ username, password });
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(username === "couple" ? "/couple/dashboard" : "/planner", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Invalid login credentials. Please check username and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "admin" | "planner" | "couple") => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === "admin") {
        await login({ username: "admin", password: "admin" });
        navigate(from || "/planner", { replace: true });
      } else if (role === "planner") {
        await login({ username: "planner", password: "password" });
        navigate(from || "/planner", { replace: true });
      } else {
        await login({ username: "couple", password: "password" });
        navigate(from || "/couple/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Quick demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Refined ambient background */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-burgundy-900/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block transition-transform hover:scale-102">
            <EverWedLogo variant="stacked" size="xl" showTagline={true} />
          </Link>
          <div className="pt-2">
            <h2 className="font-serif text-2xl font-bold text-forest-900">Sign In to EverWed</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your workspace to access wedding planning operations or couple portal
            </p>
          </div>
        </div>

        <Card className="p-6 sm:p-8 space-y-5 shadow-xl border-border bg-white/95 backdrop-blur-sm">
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="label-base flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Username or Email
              </label>
              <input
                type="text"
                required
                className="input-base"
                placeholder="e.g. admin or couple"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label-base flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Password
              </label>
              <input
                type="password"
                required
                className="input-base"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="gold" className="w-full font-bold shadow-md hover:shadow-lg transition-all" isLoading={isLoading}>
              Sign In to Platform
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-5 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                1-Click Role Testing Access
              </span>
              <span className="text-[10px] text-gold-700 font-semibold bg-gold/15 px-2 py-0.5 rounded-full">
                Demo Ready
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemo("admin")}
                className="text-[11px] font-semibold flex flex-col items-center py-2 h-auto hover:bg-forest-50 hover:border-forest-700"
              >
                <Shield className="w-4 h-4 text-forest-800 mb-1" />
                Founder/Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemo("planner")}
                className="text-[11px] font-semibold flex flex-col items-center py-2 h-auto hover:bg-gold/15 hover:border-gold-600"
              >
                <Briefcase className="w-4 h-4 text-gold-700 mb-1" />
                Lead Planner
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemo("couple")}
                className="text-[11px] font-semibold flex flex-col items-center py-2 h-auto hover:bg-rose-50 hover:border-rose-300"
              >
                <Heart className="w-4 h-4 text-rose-600 mb-1" />
                Couple
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground">
          Protected by EverWed Enterprise Security • Standard XML-RPC API
        </p>
      </div>
    </div>
  );
};
