import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Sparkles,
  CheckSquare,
  Building2,
  ChevronRight,
  Menu,
  X,
  Users,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/planner" },
  { label: "Weddings", icon: Sparkles, path: "/planner/weddings" },
  { label: "Planning Tasks", icon: CheckSquare, path: "/planner/tasks" },
  { label: "Vendors", icon: Building2, path: "/planner/vendors" },
  { label: "Enquiries", icon: Inbox, path: "/planner/enquiries", adminOnly: true },
  { label: "Team & Access", icon: Users, path: "/planner/team", adminOnly: true },
];

export const PlannerLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => !("adminOnly" in item) || user?.role === "admin");

  const currentItem = visibleNavItems.find((item) =>
    item.path === "/planner" ? location.pathname === "/planner" : location.pathname.startsWith(item.path)
  ) || navItems[0];

  const CurrentIcon = currentItem.icon;

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      {/* Mobile Planner Quick Sub-bar */}
      <div className="md:hidden bg-white border-b border-border px-4 py-2.5 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-forest-900 truncate">
          <CurrentIcon className="w-4 h-4 text-gold-700 shrink-0" />
          <span className="truncate">{currentItem.label}</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="px-2.5 py-1.5 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-xs font-semibold text-forest-800 flex items-center gap-1.5 border border-border"
        >
          {mobileNavOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          <span>Planner Menu</span>
        </button>
      </div>

      {/* Mobile Planner Navigation Overlay */}
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-border p-4 shadow-lg sticky top-28 z-30 space-y-1 animate-fade-in">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Wedding management
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/planner"
                  ? location.pathname === "/planner"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : "text-forest-800 hover:bg-ivory-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-forest-600"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-gold/80" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="sticky top-24 bg-white rounded-2xl border border-border p-4 shadow-sm space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
              <img
                src="/logo.png"
                alt="EverWed"
                className="w-8 h-8 object-contain rounded-lg border border-gold/30 p-0.5 bg-white shadow-xs"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">EverWed workspace</p>
                <h4 className="font-serif text-sm font-semibold text-forest-900">{user?.role === "admin" ? "Founder portal" : "Planner portal"}</h4>
              </div>
            </div>

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/planner"
                  ? location.pathname === "/planner"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : "text-forest-700 hover:bg-ivory-100 hover:text-forest-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-forest-600"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-gold/80" />}
                </Link>
              );
            })}

            {/* Quick Status Badge */}
            <div className="pt-4 mt-4 border-t border-border/60 px-3">
              <div className="p-3 bg-gold/10 rounded-xl border border-gold/30 text-[11px] text-forest-800">
                <span className="font-bold text-forest-900 block mb-0.5">Saved to SQLite</span>
                Weddings, events, guests and tasks persist between sessions.
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
