import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Heart,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  DollarSign,
  ArrowRight,
  Gift,
  MapPin,
  Palette,
} from "lucide-react";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import type { Wedding, WeddingEvent, Task } from "@/types";
import { formatINR, formatDate, daysUntil } from "@/lib/utils";

export const CoupleDashboardPage: React.FC = () => {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    services.weddings.get("wed-royal-jaipur-001").then(async (w) => {
      setWedding(w);
      const [evts, tsks] = await Promise.all([
        services.events.listForWedding(w.id),
        services.tasks.list(w.id),
      ]);
      setEvents(evts);
      setTasks(tsks);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !wedding) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Opening your couple sanctuary...</div>;
  }

  const daysLeft = daysUntil(wedding.start_date);
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const nextEvent = events[0];

  return (
    <div className="space-y-8 font-sans">
      {/* Wedding Countdown Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-forest-900 text-ivory p-8 md:p-10 border border-gold/40 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider border border-gold/40">
              <Sparkles className="w-3.5 h-3.5" />
              Royal Union Journey
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {wedding.bride_name} & {wedding.groom_name}
            </h1>
            <p className="text-sm text-ivory-300">
              {wedding.primary_venue} • {wedding.guest_estimate} Royal Guests
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="bg-forest-950/80 p-5 rounded-2xl border border-gold/30 text-center shrink-0 min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Countdown to Pheras</p>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-ivory mt-1">
              {Math.max(0, daysLeft)}
            </div>
            <p className="text-xs text-ivory-300 mt-0.5">Days to Celebration</p>
          </div>
        </div>
      </div>

      {/* Key Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Planning Progress"
          value={`${progressPercent}%`}
          subtitle={`${completedTasks} of ${tasks.length} tasks completed`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Ceremonies"
          value={events.length}
          subtitle="Multi-day royal events"
          icon={<Calendar className="w-5 h-5 text-gold-700" />}
        />
        <StatCard
          title="Package Tier"
          value={wedding.package_type}
          subtitle="Full-service coordination"
          icon={<Sparkles className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Agreed Budget"
          value={formatINR(wedding.budget_allocated)}
          subtitle={`Paid: ${formatINR(wedding.total_paid_by_client)}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Two-Column Grid: Next Event & Priority Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Upcoming Ceremony */}
        {nextEvent && (
          <div className="lg:col-span-7">
            <Card className="p-6 h-full flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-800 bg-gold/15 px-2.5 py-0.5 rounded-full">
                  Next Upcoming Event
                </span>
                <h3 className="font-serif text-2xl font-bold text-forest-900 mt-3">{nextEvent.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(nextEvent.date)} • {nextEvent.start_time} - {nextEvent.end_time}
                </p>

                <div className="mt-4 p-4 bg-ivory-100 rounded-xl space-y-2 text-xs">
                  <p className="flex items-center gap-2 text-forest-800">
                    <MapPin className="w-4 h-4 text-gold-700" />
                    <strong>Venue Hall:</strong> {nextEvent.venue_hall}
                  </p>
                  <p className="flex items-center gap-2 text-forest-800">
                    <Users className="w-4 h-4 text-gold-700" />
                    <strong>Guest Estimate:</strong> {nextEvent.guest_estimate} guests
                  </p>
                  <p className="flex items-center gap-2 text-forest-800">
                    <Clock className="w-4 h-4 text-gold-700" />
                    <strong>Lead Coordinator:</strong> {nextEvent.coordinator_name}
                  </p>
                </div>

                {nextEvent.notes && <p className="text-xs text-forest-700 italic mt-3">"{nextEvent.notes}"</p>}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <Link to="/couple/events" className="text-xs font-semibold text-gold-800 hover:underline flex items-center gap-1">
                  View full wedding itinerary <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Decision Checklist */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-forest-900">Pending Decisions for Couple</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Key items awaiting your feedback.</p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-ivory-50 rounded-xl border border-border flex items-start gap-3">
                  <input type="checkbox" className="rounded mt-0.5" defaultChecked />
                  <div>
                    <p className="font-semibold text-forest-900">Approve Tasting Banquet Menu</p>
                    <p className="text-[11px] text-muted-foreground">7-course Marwari feast signed off</p>
                  </div>
                </div>
                <div className="p-3 bg-ivory-50 rounded-xl border border-border flex items-start gap-3">
                  <input type="checkbox" className="rounded mt-0.5" />
                  <div>
                    <p className="font-semibold text-forest-900">Gold-Embossed Welcome Letter Proof</p>
                    <p className="text-[11px] text-muted-foreground">Awaiting bride & groom sign-off on design</p>
                  </div>
                </div>
                <div className="p-3 bg-ivory-50 rounded-xl border border-border flex items-start gap-3">
                  <input type="checkbox" className="rounded mt-0.5" />
                  <div>
                    <p className="font-semibold text-forest-900">Sangeet Family Choreography Songs</p>
                    <p className="text-[11px] text-muted-foreground">DJ Kabir requesting final 6-song medley list</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Link to="/couple/checklist">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Open Complete Couple Checklist
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
