import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  DollarSign,
  ArrowRight,
  Plus,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import type { Wedding } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";

export const WeddingsPage: React.FC = () => {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    services.weddings
      .list()
      .then((data) => setWeddings(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Wedding Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Active Weddings Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time status of all contracted luxury destination weddings under management.
          </p>
        </div>

        <Link to="/builder">
          <Button variant="gold" className="font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            New Wedding Workspace
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weddings.map((w) => {
          const taskProgress = w.tasks_count > 0 ? Math.round((w.tasks_completed / w.tasks_count) * 100) : 0;
          const clientPaidPercent =
            w.budget_allocated > 0 ? Math.min(100, Math.round((w.total_paid_by_client / w.budget_allocated) * 100)) : 0;

          return (
            <Card key={w.id} className="p-6 flex flex-col justify-between hover:border-gold/50 transition-all shadow-sm">
              <div>
                <div className="flex justify-between items-start">
                  <Badge status={w.status} />
                  <span className="text-xs font-semibold text-gold-800 bg-gold/10 px-2.5 py-0.5 rounded-full">
                    {w.package_type}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-forest-900 mt-3">{w.title}</h3>

                <p className="flex items-center gap-1.5 text-xs text-forest-700 mt-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {w.primary_venue} • {w.guest_estimate} Guests
                </p>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {formatDate(w.start_date)} - {formatDate(w.end_date)}
                </p>

                {/* Progress Indicators */}
                <div className="mt-5 space-y-3 pt-4 border-t border-border/60 text-xs">
                  {/* Task completion */}
                  <div>
                    <div className="flex justify-between text-forest-800 mb-1">
                      <span>Checklist Completion</span>
                      <span className="font-semibold">
                        {w.tasks_completed} / {w.tasks_count} tasks ({taskProgress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-ivory-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-800 rounded-full transition-all duration-300"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Client payment progress */}
                  <div>
                    <div className="flex justify-between text-forest-800 mb-1">
                      <span>Client Collected ({clientPaidPercent}%)</span>
                      <span className="font-semibold">{formatINR(w.total_paid_by_client)} / {formatINR(w.budget_allocated)}</span>
                    </div>
                    <div className="w-full h-2 bg-ivory-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${clientPaidPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-border/50">
                  <div className="p-2 bg-ivory-100 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">Events</span>
                    <span className="font-bold text-forest-900">{w.events_count}</span>
                  </div>
                  <div className="p-2 bg-ivory-100 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">Agreed Vendors</span>
                    <span className="font-bold text-forest-900">{formatINR(w.total_agreed_vendor_cost)}</span>
                  </div>
                  <div className="p-2 bg-ivory-100 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">Vendors Paid</span>
                    <span className="font-bold text-forest-900">{formatINR(w.total_paid_to_vendors)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <Link to={`/planner/weddings/${w.id}`}>
                  <Button variant="secondary" className="w-full text-xs font-semibold justify-between">
                    <span>Enter Wedding Operations Room</span>
                    <ArrowRight className="w-4 h-4 text-gold-700" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

