import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Heart,
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Palette,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { services } from "@/services";
import { useAuth } from "@/context/AuthContext";
import type { Wedding } from "@/types";

const coupleTabs = [
  { label: "Dashboard", icon: Sparkles, path: "/couple/dashboard" },
  { label: "Wedding Overview", icon: Heart, path: "/couple/overview" },
  { label: "Wedding Builder", icon: Palette, path: "/couple/builder" },
  { label: "Ceremonies & Events", icon: Calendar, path: "/couple/events" },
  { label: "Guest List & RSVP", icon: Users, path: "/couple/guests" },
  { label: "Planning Checklist", icon: CheckCircle2, path: "/couple/checklist" },
  { label: "Budget & Payments", icon: DollarSign, path: "/couple/budget" },
];

export const CoupleLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadWedding = async () => {
      try {
        if (!user?.wedding_id) {
          if (mounted) setWedding(null);
          return;
        }
        const selected = await services.weddings.get(user.wedding_id);
        if (mounted) {
          setWedding(selected);
          localStorage.setItem("active_wedding_id", selected.id);
        }
      } catch (err) {
        console.error("Failed to load active wedding in CoupleLayout:", err);
      }
    };
    loadWedding();
    return () => {
      mounted = false;
    };
  }, [user?.wedding_id]);

  const coupleTitle = wedding
    ? `${wedding.bride_name} & ${wedding.groom_name}`
    : "Your couple account";
  const weddingTitle = wedding?.title || "Wedding workspace";
  const locationText = wedding?.destination || "Location not set";
  const datesText = wedding ? `${wedding.start_date} to ${wedding.end_date}` : "Dates not set";
  const guestText = wedding?.guest_estimate ? `${wedding.guest_estimate} Guests` : "Guest count not set";

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Sub-header */}
      <div className="bg-forest-900 text-ivory py-7 sm:py-8 px-4 sm:px-6 lg:px-8 border-b border-gold/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-2 border border-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              Couple portal
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              {wedding ? `${weddingTitle}: ${coupleTitle}` : "Set up your wedding"}
            </h1>
            <p className="text-xs md:text-sm text-ivory-300 mt-1">
              {wedding ? `${locationText} • ${datesText} • ${guestText}` : "Complete the Wedding Builder to create your wedding workspace."}
            </p>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-border sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
            {(user?.wedding_id ? coupleTabs : coupleTabs.filter((tab) => tab.path === "/couple/builder")).map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
              <Link
                  key={tab.path}
                  to={tab.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : "text-forest-700 hover:bg-ivory-100 hover:text-forest-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-forest-500"}`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="ew-app-main flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
