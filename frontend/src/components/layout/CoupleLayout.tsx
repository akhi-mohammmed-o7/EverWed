import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Heart,
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  Palette,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { services } from "@/services";
import type { Wedding } from "@/types";

const coupleTabs = [
  { label: "Dashboard", icon: Sparkles, path: "/couple/dashboard" },
  { label: "Wedding Overview", icon: Heart, path: "/couple/overview" },
  { label: "Ceremonies & Events", icon: Calendar, path: "/couple/events" },
  { label: "Guest List & RSVP", icon: Users, path: "/couple/guests" },
  { label: "Planning Checklist", icon: CheckCircle2, path: "/couple/checklist" },
  { label: "Budget & Payments", icon: DollarSign, path: "/couple/budget" },
  { label: "Curated Vendors", icon: ShoppingBag, path: "/couple/vendors" },
  { label: "Inspiration Board", icon: Palette, path: "/couple/moodboard" },
];

export const CoupleLayout: React.FC = () => {
  const location = useLocation();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadWedding = async () => {
      try {
        const list = await services.weddings.list();
        if (mounted && list && list.length > 0) {
          // If a custom created wedding is stored in session, prefer it
          const savedId = localStorage.getItem("active_wedding_id");
          const found = savedId ? list.find((w) => w.id === savedId) : null;
          setWedding(found || list[0]);
        }
      } catch (err) {
        console.error("Failed to load active wedding in CoupleLayout:", err);
      }
    };
    loadWedding();
    return () => {
      mounted = false;
    };
  }, []);

  const coupleTitle = wedding
    ? `${wedding.bride_name} & ${wedding.groom_name}`
    : "Aisha & Vikram";
  const weddingTitle = wedding?.title || "The Royal Union";
  const locationText = wedding?.destination || "City Palace & Rambagh, Jaipur";
  const datesText = wedding ? `${wedding.start_date} to ${wedding.end_date}` : "10-13 December 2026";
  const guestText = wedding?.guest_estimate ? `${wedding.guest_estimate} Guests` : "450 Guests";

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Sub-header */}
      <div className="bg-forest-900 text-ivory py-8 px-4 sm:px-6 lg:px-8 border-b border-gold/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-2 border border-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              Couple Sanctuary
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              {weddingTitle}: {coupleTitle}
            </h1>
            <p className="text-xs md:text-sm text-ivory-300 mt-1">
              {locationText} • {datesText} • {guestText}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/builder"
              className="px-4 py-2 rounded-xl bg-gold text-forest-950 text-xs font-bold hover:bg-gold-400 transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Customize Package
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-border sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
            {coupleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : "text-forest-700 hover:bg-ivory-100 hover:text-forest-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-forest-500"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
