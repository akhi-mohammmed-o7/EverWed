import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Heart,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { PACKAGE_TIERS, WEDDING_TRADITIONS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory-50 text-forest-900 font-sans flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-forest-900 text-ivory">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold mb-6 uppercase tracking-wider animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Unified Wedding Operations & Client OS
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
            Curate Grand Weddings. <br />
            <span className="text-gold italic font-normal">Command Every Minute.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-ivory-200 max-w-2xl mx-auto leading-relaxed">
            The luxury platform built for contemporary couples and high-end wedding planning agencies in Jaipur, Udaipur, and beyond.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/builder">
              <Button variant="gold" size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-gold/20">
                Launch Wedding Setup Wizard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/planner">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-ivory border-ivory/40 hover:bg-ivory/10">
                <Shield className="w-4 h-4 mr-1 text-gold" />
                Open Planner Workspace
              </Button>
            </Link>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 pt-10 border-t border-ivory/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div>
              <p className="text-xs uppercase tracking-wider text-ivory-300">Operational Precision</p>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-gold mt-1">25+ Playbooks</h4>
              <p className="text-xs text-ivory-300 mt-0.5">Pre-engineered tasks</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ivory-300">Quote Engine</p>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-gold mt-1">Fair Per-Plate</h4>
              <p className="text-xs text-ivory-300 mt-0.5">Normalized comparisons</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ivory-300">Financial Integrity</p>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-gold mt-1">Zero Variance</h4>
              <p className="text-xs text-ivory-300 mt-0.5">Mandatory bill audits</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ivory-300">Platform Sync</p>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-gold mt-1">Odoo XML-RPC</h4>
              <p className="text-xs text-ivory-300 mt-0.5">Dual-mode resilience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cultural Traditions Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-700">Cultural Customization</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 mt-2">
            Tailored to Your Heritage & Traditions
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Every family and wedding is unique. Select, reorder, customize, or craft your multi-day rituals freely.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WEDDING_TRADITIONS.map((tradition) => (
            <div
              key={tradition.id}
              className="bg-white rounded-2xl border border-border p-5 hover:border-gold/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl">{tradition.icon}</span>
                <h3 className="font-serif text-base font-bold text-forest-900 mt-3">{tradition.label}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{tradition.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <span className="text-[11px] font-semibold text-gold-800 bg-gold/15 px-2 py-0.5 rounded-md">
                  {tradition.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-ivory-100 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-gold-700">Transparent Pricing</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 mt-2">
              Curated Luxury Wedding Packages
            </h2>
            <p className="text-sm text-muted-foreground mt-3">
              Clear deliverables, dedicated teams, and zero hidden markups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGE_TIERS.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  pkg.highlighted
                    ? "border-gold shadow-lg ring-1 ring-gold/40 relative"
                    : "border-border shadow-sm hover:border-gold/30"
                }`}
              >
                {pkg.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-forest-900 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/40">
                    {pkg.badge}
                  </span>
                )}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-forest-900">{pkg.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{pkg.tier}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="font-serif text-3xl font-bold text-forest-900">{formatINR(pkg.base_price)}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">base package</span>
                  </div>

                  <p className="text-xs text-forest-700 mt-3 leading-relaxed">{pkg.description}</p>

                  <div className="mt-6 pt-5 border-t border-border space-y-2.5">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-forest-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <Link to={`/builder?package=${pkg.id}`}>
                    <Button variant={pkg.highlighted ? "gold" : "outline"} className="w-full font-bold">
                      Select {pkg.name}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Experience Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm hover:border-gold/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-terracotta flex items-center justify-center mb-5">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-forest-900">Couple Sanctuary Portal</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                A warm, editorial experience where couples review ceremonies, build service packages, manage VIP guest lists & RSVPs, track payments, and review inspiration boards.
              </p>
              <ul className="mt-6 space-y-2 text-xs text-forest-800">
                <li className="flex items-center gap-2">✓ Wedding countdown & ceremony timeline</li>
                <li className="flex items-center gap-2">✓ Real-time guest RSVP & dietary table mapping</li>
                <li className="flex items-center gap-2">✓ Transparent milestone payment schedule</li>
              </ul>
            </div>
            <div className="mt-8">
              <Link to="/couple/dashboard">
                <Button variant="secondary" className="w-full">
                  Explore Couple Portal
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-forest-900 text-ivory rounded-3xl border border-forest-800 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold">Planner Operations Workspace</h3>
              <p className="text-sm text-ivory-300 mt-2 leading-relaxed">
                Designed for high-intensity agency operations: CRM pipeline, side-by-side vendor quote normalization, minute-by-minute day-of command center, and true agency net profit statements.
              </p>
              <ul className="mt-6 space-y-2 text-xs text-ivory-200">
                <li className="flex items-center gap-2">✓ Minute-by-minute Baraat & Varmala schedule</li>
                <li className="flex items-center gap-2">✓ Late vendor arrival detection & incident logs</li>
                <li className="flex items-center gap-2">✓ Mandatory variance rules on vendor invoices</li>
              </ul>
            </div>
            <div className="mt-8">
              <Link to="/planner">
                <Button variant="gold" className="w-full font-bold">
                  Enter Planner Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-forest-950 text-ivory-400 py-10 border-t border-forest-900 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-serif text-base text-gold font-bold mb-1">EverWed • Luxury Wedding Operations & Planning Platform</p>
          <p>© 2026 EverWed. Designed and engineered for luxury destination weddings and premier celebration management.</p>
        </div>
      </footer>
    </div>
  );
};

