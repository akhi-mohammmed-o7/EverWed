import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Sparkles,
  Users,
  CheckSquare,
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "./Navbar";

const navItems = [
  { label: "Executive Overview", icon: LayoutDashboard, path: "/planner" },
  { label: "Enquiries & Leads", icon: Inbox, path: "/planner/enquiries" },
  { label: "Active Weddings", icon: Sparkles, path: "/planner/weddings" },
  { label: "Vendor Directory", icon: Building2, path: "/planner/vendors" },
  { label: "Quote Comparison", icon: FileText, path: "/planner/quotes" },
  { label: "Planning Tasks", icon: CheckSquare, path: "/planner/tasks" },
  { label: "Day-of Operations", icon: Clock, path: "/planner/operations" },
  { label: "Financial Statement", icon: DollarSign, path: "/planner/finance" },
  { label: "Wedding Risk Radar", icon: AlertTriangle, path: "/planner/risk-radar" },
];

export const PlannerLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="sticky top-24 bg-white rounded-2xl border border-border p-4 shadow-sm space-y-1">
            <div className="px-3 py-2 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Operations OS</p>
              <h4 className="font-serif text-sm font-semibold text-forest-900">The Royal Knot</h4>
            </div>

            {navItems.map((item) => {
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

            {/* Quick Helper Badge */}
            <div className="pt-4 mt-4 border-t border-border/60 px-3">
              <div className="p-3 bg-gold/10 rounded-xl border border-gold/30 text-[11px] text-forest-800">
                <span className="font-bold text-forest-900 block mb-0.5">Dual-Mode Persistence</span>
                FastAPI ↔ Odoo XML-RPC active. Ready for live operations.
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
