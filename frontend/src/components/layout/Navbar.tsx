import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar, UserCheck, Shield, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const location = useLocation();

  const isPlanner = location.pathname.startsWith("/planner");
  const isCouple = location.pathname.startsWith("/couple");

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-forest-800 flex items-center justify-center text-gold shadow-sm group-hover:bg-forest-900 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-forest-900">{APP_NAME}</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest text-gold-700 font-bold px-1.5 py-0.5 rounded bg-gold/15">
                Luxury OS
              </span>
            </div>
          </Link>

          {/* Quick nav switcher */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-border">
            <Link
              to="/planner"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isPlanner ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Planner Workspace
            </Link>
            <Link
              to="/couple/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isCouple ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-200"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Couple Portal
            </Link>
            <Link
              to="/builder"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-forest-700 hover:bg-ivory-200 flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Wedding Builder
            </Link>
          </nav>
        </div>

        {/* Right side: Role Switcher & User Pill */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-ivory-100 p-1 rounded-xl border border-border/80">
            <span className="text-[11px] font-medium text-muted-foreground px-2">Role:</span>
            <button
              onClick={() => switchRole("admin")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "admin" ? "bg-white shadow-xs font-bold text-forest-900" : "text-forest-600 hover:text-forest-900"
              }`}
            >
              Founder/Admin
            </button>
            <button
              onClick={() => switchRole("planner")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "planner" ? "bg-white shadow-xs font-bold text-forest-900" : "text-forest-600 hover:text-forest-900"
              }`}
            >
              Lead Planner
            </button>
            <button
              onClick={() => switchRole("couple")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "couple" ? "bg-white shadow-xs font-bold text-forest-900" : "text-forest-600 hover:text-forest-900"
              }`}
            >
              Couple
            </button>
          </div>

          {/* User Profile display */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-gold/30 text-forest-900 flex items-center justify-center font-bold text-xs border border-gold/50">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-forest-900 leading-none">{user?.name || "Demo User"}</p>
              <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{user?.role || "Admin"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
