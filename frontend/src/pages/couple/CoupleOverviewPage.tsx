import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  Phone,
  Mail,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import type { Wedding } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";

export const CoupleOverviewPage: React.FC = () => {
  const [wedding, setWedding] = useState<Wedding | null>(null);

  useEffect(() => {
    services.weddings.get("wed-royal-jaipur-001").then((w) => setWedding(w));
  }, []);

  if (!wedding) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading wedding overview...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
          Wedding Story & Overview
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          {wedding.title}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Curated under The Royal Knot signature luxury management standard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-900">Celebration Details</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Key parameters registered for your wedding.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-ivory-100 rounded-xl">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Destination</span>
              <span className="font-bold text-forest-900 text-sm mt-0.5 block">{wedding.destination}</span>
            </div>
            <div className="p-3 bg-ivory-100 rounded-xl">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Guest Headcount</span>
              <span className="font-bold text-forest-900 text-sm mt-0.5 block">{wedding.guest_estimate} Guests</span>
            </div>
            <div className="p-3 bg-ivory-100 rounded-xl">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Package Tier</span>
              <span className="font-bold text-forest-900 text-sm mt-0.5 block">{wedding.package_type}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-3 border-t border-border">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Primary Palace Venue:</span>
              <span className="font-bold text-forest-900">{wedding.primary_venue}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Celebration Dates:</span>
              <span className="font-bold text-forest-900">{formatDate(wedding.start_date)} — {formatDate(wedding.end_date)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Design & Architectural Theme:</span>
              <span className="font-bold text-forest-900">{wedding.theme}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Allocated Overall Budget:</span>
              <span className="font-serif font-bold text-forest-900 text-sm">{formatINR(wedding.budget_allocated)}</span>
            </div>
          </div>
        </Card>

        {/* Agency Entourage Box */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-900">Your Planning Team</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Dedicated entourage for Aisha & Vikram.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-ivory-50 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-gold-800 uppercase block">Senior Lead Planner</span>
              <p className="font-bold text-forest-900 mt-0.5">Pooja Verma</p>
              <p className="text-muted-foreground mt-0.5">+91 98290 99001 • pooja@royalknot.in</p>
            </div>
            <div className="p-3 bg-ivory-50 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-gold-800 uppercase block">Production & Decor Lead</span>
              <p className="font-bold text-forest-900 mt-0.5">Rohan Joshi</p>
              <p className="text-muted-foreground mt-0.5">+91 98290 99002 • rohan@royalknot.in</p>
            </div>
            <div className="p-3 bg-ivory-50 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-gold-800 uppercase block">Hospitality & Guest Concierge</span>
              <p className="font-bold text-forest-900 mt-0.5">Arjun Rathore</p>
              <p className="text-muted-foreground mt-0.5">+91 98290 99003 • arjun@royalknot.in</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

