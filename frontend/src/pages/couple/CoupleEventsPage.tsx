import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { WeddingEvent } from "@/types";
import { formatDate, getActiveWeddingId } from "@/lib/utils";

export const CoupleEventsPage: React.FC = () => {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activeId = getActiveWeddingId();
    services.events.listForWedding(activeId)
      .then((list) => {
        setEvents(list);
        setIsLoading(false);
      })
      .catch(async () => {
        const list = await services.events.listForWedding("wed-royal-jaipur-001");
        setEvents(list);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
          Celebration Itinerary
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          Multi-Day Ceremonies & Celebrations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Detailed schedule of all sacred rituals, music nights, and banquet feasts.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading ceremony timeline...</div>
      ) : (
        <div className="space-y-4">
          {events.map((ev, index) => (
            <Card key={ev.id} className="p-6 hover:border-gold/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-forest-800 text-gold flex items-center justify-center font-serif text-lg font-bold shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl font-bold text-forest-900">{ev.name}</h3>
                      <Badge status={ev.status} />
                    </div>
                    <p className="text-xs text-forest-700 mt-1">{ev.notes || "Royal celebrations in progress."}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-forest-800 mt-3 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gold-700" />
                        {formatDate(ev.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gold-700" />
                        {ev.start_time} - {ev.end_time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold-700" />
                        {ev.venue_hall}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gold-700" />
                        {ev.guest_estimate} guests
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-ivory-100 rounded-xl text-right text-xs shrink-0 self-start md:self-auto">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">On-Site Coordinator</span>
                  <span className="font-bold text-forest-900">{ev.coordinator_name}</span>
                  {ev.coordinator_phone && (
                    <span className="block text-gold-800 font-medium text-[11px]">{ev.coordinator_phone}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

