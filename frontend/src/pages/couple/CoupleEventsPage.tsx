import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Wedding, WeddingEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEvents = async (weddingId: string) => setEvents(await services.events.listForWedding(weddingId));

  useEffect(() => {
    const activeId = user?.wedding_id;
    if (!activeId) { setEvents([]); setIsLoading(false); return; }
    Promise.all([services.weddings.get(activeId), loadEvents(activeId)]).then(([details]) => { setWedding(details); setVenue(details.primary_venue); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load wedding events.")).finally(() => setIsLoading(false));
  }, [user?.wedding_id]);

  const submitFunction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.wedding_id) return;
    setSaving(true); setError("");
    try {
      await services.events.create(user.wedding_id, { name: eventName.trim(), date: eventDate, start_time: startTime, end_time: endTime, venue_hall: venue.trim(), coordinator_name: user.name, guest_estimate: wedding?.guest_estimate });
      await loadEvents(user.wedding_id); setEventName(""); setShowForm(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to add this function."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
          Celebration Itinerary
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          Multi-Day Ceremonies & Celebrations
        </h1>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Your selected ceremonies and celebrations.</p><Button type="button" variant="gold" onClick={() => setShowForm((open) => !open)}><Plus className="h-4 w-4" /> Add function</Button></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      {showForm && <Card className="p-4 sm:p-6"><form onSubmit={submitFunction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium">Function name<input required maxLength={120} value={eventName} onChange={(e) => setEventName(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium">Date<input required type="date" min={wedding?.start_date} max={wedding?.end_date} value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium">Venue<input required maxLength={200} value={venue} onChange={(e) => setVenue(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium">Starts<input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium">Ends<input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-base mt-1" /></label>
        <div className="flex items-end"><Button type="submit" variant="gold" isLoading={saving}>Save function</Button></div>
      </form></Card>}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading ceremony timeline...</div>
      ) : (
        <div className="space-y-4">
          {events.length === 0 && <Card className="p-8 text-center"><h2 className="font-serif text-xl font-semibold text-forest-900">No functions scheduled yet</h2><p className="mt-2 text-sm text-muted-foreground">Add ceremonies and celebrations during wedding setup, or ask your assigned planner to add them.</p></Card>}
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

