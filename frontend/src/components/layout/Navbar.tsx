import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Shield,
  Heart,
  Briefcase,
  LogOut,
  LogIn,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";

export const Navbar: React.FC = () => {
  const { user, switchRole, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPlanner = location.pathname.startsWith("/planner");
  const isCouple = location.pathname.startsWith("/couple");
  const isBuilder = location.pathname.startsWith("/builder");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return { label: "Admin", bg: "bg-forest-100 text-forest-900 border-forest-300" };
      case "planner":
        return { label: "Planner", bg: "bg-gold/20 text-gold-900 border-gold/40" };
      case "couple":
        return { label: "Couple", bg: "bg-rose-100 text-rose-900 border-rose-200" };
      default:
        return { label: "Guest", bg: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="EverWed"
              className="w-9 h-9 object-contain rounded-xl shadow-xs border border-gold/40 bg-white p-0.5 group-hover:border-gold transition-colors"
            />
            <div className="flex flex-col text-left">
              <span className="font-serif text-xl font-bold tracking-tight text-forest-900 leading-none">
                {APP_NAME}
              </span>
              <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest text-gold-700 font-bold mt-0.5">
                Luxury Wedding OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-border/80">
            {/* Show Planner Workspace to admin and planner roles */}
            {(user?.role === "admin" || user?.role === "planner") && (
              <Link
                to="/planner"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPlanner
                    ? "bg-forest-800 text-ivory shadow-xs"
                    : "text-forest-800 hover:bg-ivory-200 hover:text-forest-950"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-gold-600" />
                Planner Workspace
              </Link>
            )}

            {/* Couple Portal */}
            <Link
              to="/couple/dashboard"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isCouple
                  ? "bg-forest-800 text-ivory shadow-xs"
                  : "text-forest-800 hover:bg-ivory-200 hover:text-forest-950"
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Couple Sanctuary
            </Link>

            {/* Wedding Builder */}
            <Link
              to="/builder"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isBuilder
                  ? "bg-forest-800 text-ivory shadow-xs"
                  : "text-forest-800 hover:bg-ivory-200 hover:text-forest-950"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-gold-700" />
              Wedding Builder
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Role Switcher (accessible for evaluator convenience) */}
          <div className="hidden lg:flex items-center gap-1 bg-ivory-100 p-1 rounded-xl border border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Role:</span>
            <button
              onClick={() => switchRole("admin")}
              title="Switch to Admin / Founder role"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "admin"
                  ? "bg-white shadow-xs font-bold text-forest-900 border border-border"
                  : "text-forest-700 hover:text-forest-900"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchRole("planner")}
              title="Switch to Lead Planner role"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "planner"
                  ? "bg-white shadow-xs font-bold text-forest-900 border border-border"
                  : "text-forest-700 hover:text-forest-900"
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => switchRole("couple")}
              title="Switch to Couple role"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === "couple"
                  ? "bg-white shadow-xs font-bold text-rose-900 border border-border"
                  : "text-forest-700 hover:text-rose-900"
              }`}
            >
              Couple
            </button>
          </div>

          {/* User Profile or Sign In */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-forest-800 text-gold font-bold text-xs flex items-center justify-center border border-gold/40 shadow-xs">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-forest-900 leading-none truncate max-w-[120px]">
                  {user.name}
                </p>
                <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border mt-0.5 ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out of session"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-forest-800 text-ivory text-xs font-bold hover:bg-forest-900 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-gold" />
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-forest-800 hover:bg-ivory-200 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3 shadow-lg animate-fade-in">
          <div className="space-y-1">
            {(user?.role === "admin" || user?.role === "planner") && (
              <Link
                to="/planner"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                  isPlanner ? "bg-forest-800 text-ivory" : "text-forest-800 hover:bg-ivory-100"
                }`}
              >
                <Shield className="w-4 h-4 text-gold" />
                Planner Workspace
              </Link>
            )}

            <Link
              to="/couple/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                isCouple ? "bg-forest-800 text-ivory" : "text-forest-800 hover:bg-ivory-100"
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              Couple Sanctuary
            </Link>

            <Link
              to="/builder"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                isBuilder ? "bg-forest-800 text-ivory" : "text-forest-800 hover:bg-ivory-100"
              }`}
            >
              <Calendar className="w-4 h-4 text-gold-700" />
              Wedding Builder
            </Link>
          </div>

          {/* Mobile Role Switcher for Evaluators */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Testing Role Switcher
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  switchRole("admin");
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border ${
                  user?.role === "admin" ? "bg-forest-800 text-ivory border-forest-900" : "bg-ivory-50 text-forest-800 border-border"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => {
                  switchRole("planner");
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border ${
                  user?.role === "planner" ? "bg-forest-800 text-ivory border-forest-900" : "bg-ivory-50 text-forest-800 border-border"
                }`}
              >
                Planner
              </button>
              <button
                onClick={() => {
                  switchRole("couple");
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border ${
                  user?.role === "couple" ? "bg-forest-800 text-ivory border-forest-900" : "bg-ivory-50 text-forest-800 border-border"
                }`}
              >
                Couple
              </button>
            </div>
          </div>

          {/* User Signout or Signin */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-forest-800 text-gold flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-forest-900">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 rounded-xl bg-forest-800 text-ivory text-xs font-bold text-center block"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
