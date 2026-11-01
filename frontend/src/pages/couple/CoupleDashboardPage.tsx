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
import type { PlannerDirectoryEntry } from "@/types";
import { formatINR, formatDate, daysUntil } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [planners, setPlanners] = useState<PlannerDirectoryEntry[]>([]);
  const [plannerUid, setPlannerUid] = useState("");
  const [assigningPlanner, setAssigningPlanner] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState("");
  const [plannerError, setPlannerError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const activeId = user?.wedding_id;
        if (!activeId) return;
        const w = await services.weddings.get(activeId);
        if (!mounted || !w) return;
        setWedding(w);
        const [evts, tsks] = await Promise.all([
          services.events.listForWedding(w.id).catch(() => []),
          services.tasks.list(w.id).catch(() => []),
        ]);
        if (!mounted) return;
        setEvents(evts);
        setTasks(tsks);
      } catch (err) {
        console.error("Failed to load couple dashboard:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [user?.wedding_id]);

  useEffect(() => {
    let mounted = true;
    void services.weddings.listPlanners().then((items) => { if (mounted) setPlanners(items); })
      .catch((cause: unknown) => { if (mounted) setPlannerError(cause instanceof Error ? cause.message : "Unable to load planner options."); });
    return () => { mounted = false; };
  }, []);

  const toggleTask = async (task: Task) => {
    if (!wedding) return;
    setError("");
    try {
      await services.tasks.update(task.id, { status: task.status === "done" ? "in_progress" : "done" });
      setTasks(await services.tasks.list(wedding.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this checklist change.");
    }
  };

  const selectPlanner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wedding || !plannerUid) return;
    setAssigningPlanner(true); setPlannerError(""); setPlannerMessage("");
    try {
      const updated = await services.weddings.selectPlanner(wedding.id, Number(plannerUid));
      setWedding(updated); setPlannerUid(""); setPlannerMessage(`${updated.assigned_planner_name || "Your planner"} is now connected to this wedding workspace.`);
    } catch (cause) { setPlannerError(cause instanceof Error ? cause.message : "Unable to select this planner."); }
    finally { setAssigningPlanner(false); }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Opening your couple sanctuary...</div>;
  }

  if (!wedding) {
    return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">We could not load your wedding workspace. Please refresh or contact your planner.</div>;
  }

  const daysLeft = daysUntil(wedding.start_date);
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const nextEvent = events[0];
  const pendingTasks = tasks.filter((task) => task.status !== "done").slice(0, 3);

  return (
    <div className="space-y-8 font-sans">
      {/* Wedding Countdown Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-forest-900 text-ivory p-8 md:p-10 border border-gold/40 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider border border-gold/40">
              <Sparkles className="w-3.5 h-3.5" />
              Your wedding planning
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {wedding.bride_name} & {wedding.groom_name}
            </h1>
            <p className="text-sm text-ivory-300">
              {wedding.primary_venue} • {wedding.guest_estimate} estimated guests
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="bg-forest-950/80 p-5 rounded-2xl border border-gold/30 text-center shrink-0 min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Wedding countdown</p>
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
          subtitle="Functions on your schedule"
          icon={<Calendar className="w-5 h-5 text-gold-700" />}
        />
        <StatCard
          title="Package Tier"
          value={wedding.package_type}
          subtitle="Your saved planning package"
          icon={<Sparkles className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Agreed Budget"
          value={formatINR(wedding.budget_allocated)}
          subtitle={`Paid: ${formatINR(wedding.total_paid_by_client)}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      <Card className="space-y-4 p-5">
        <div><h2 className="font-serif text-lg font-bold text-forest-900">Your connected wedding planner</h2><p className="mt-1 text-sm text-muted-foreground">Your wedding, ceremonies, checklist and confirmed payments are shared with this planner from the same saved workspace.</p></div>
        {wedding.assigned_planner_name ? <p className="text-sm font-semibold text-forest-900">{wedding.assigned_planner_name}{wedding.assigned_planner_email ? <span className="ml-2 font-normal text-muted-foreground">{wedding.assigned_planner_email}</span> : null}</p> : <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No active Planner is assigned yet. Your wedding will be assigned when an approved Planner becomes available.</p>}
        {planners.length > 0 && <form onSubmit={selectPlanner} className="flex flex-col gap-2 sm:flex-row"><select aria-label="Choose a wedding planner" required value={plannerUid} onChange={(event) => setPlannerUid(event.target.value)} className="input-base flex-1"><option value="">Choose a Planner</option>{planners.map((planner) => <option key={planner.uid} value={planner.uid}>{planner.name}{planner.specialties.length ? ` · ${planner.specialties.join(", ")}` : ""}</option>)}</select><button disabled={assigningPlanner || !plannerUid} className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{assigningPlanner ? "Connecting…" : wedding.assigned_planner_name ? "Change planner" : "Connect planner"}</button></form>}
        {plannerMessage && <p role="status" className="text-sm text-emerald-800">{plannerMessage}</p>}{plannerError && <p role="alert" className="text-sm text-rose-800">{plannerError}</p>}
      </Card>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

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
              <h3 className="font-serif text-lg font-bold text-forest-900">Your next checklist items</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Real tasks from your saved wedding plan.</p>

              <div className="mt-4 space-y-3 text-xs">
                {pendingTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {tasks.length === 0
                      ? "Your checklist is generated from your wedding setup and functions. Open the Wedding Builder to add a function."
                      : "You have completed every checklist task."}
                  </p>
                ) : pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-ivory-50 p-3">
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => void toggleTask(task)}
                      className="mt-0.5 rounded"
                      aria-label={`Mark ${task.title} complete`}
                    />
                    <div>
                      <p className="font-semibold text-forest-900">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">{task.category} • Due {formatDate(task.due_date)} • {task.owner}</p>
                    </div>
                  </div>
                ))}
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

