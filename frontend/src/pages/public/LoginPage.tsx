import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Shield, Heart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ username, password });
      navigate(username === "couple" ? "/couple/dashboard" : "/planner");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "admin" | "couple") => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === "admin") {
        await login({ username: "admin", password: "admin" });
        navigate("/planner");
      } else {
        await login({ username: "couple", password: "password" });
        navigate("/couple/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-forest-800 flex items-center justify-center text-gold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-forest-900">{APP_NAME}</span>
          </Link>
          <h2 className="font-serif text-2xl font-bold text-forest-900 mt-2">Sign in to your Sanctuary</h2>
          <p className="text-xs text-muted-foreground">Access wedding planning operations or couple portal</p>
        </div>

        <Card className="p-6 md:p-8 space-y-5 shadow-lg border-border">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="label-base">Username / Email</label>
              <input
                type="text"
                required
                className="input-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Password</label>
              <input
                type="password"
                required
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="gold" className="w-full font-bold" isLoading={isLoading}>
              Sign In to Platform
            </Button>
          </form>

          {/* Quick Demo Logins for Hackathon Evaluators */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
              Quick 1-Click Evaluation Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemo("admin")}
                className="text-xs font-semibold"
              >
                <Shield className="w-3.5 h-3.5 text-gold-700 mr-1" />
                Planner OS
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemo("couple")}
                className="text-xs font-semibold"
              >
                <Heart className="w-3.5 h-3.5 text-rose-600 mr-1" />
                Couple Portal
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

