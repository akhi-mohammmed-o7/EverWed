import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckSquare2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { services } from "@/services";
import type { Task, Wedding, WeddingEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type AssignedWorkspace = { wedding: Wedding; tasks: Task[]; events: WeddingEvent[] };

export const PlannerHomePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [workspaces, setWorkspaces] = useState<AssignedWorkspace[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profile, setProfile] = useState({ planner_bio: "", planner_specialties: "", planner_destinations: "", planner_languages: "" });

  useEffect(() => {
    if (!user) return;
    setProfile({
      planner_bio: user.planner_bio ?? "",
      planner_specialties: user.planner_specialties?.join(", ") ?? "",
      planner_destinations: user.planner_destinations?.join(", ") ?? "",
      planner_languages: user.planner_languages?.join(", ") ?? "",
    });
  }, [user]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setProfileBusy(true); setProfileMessage(""); setError("");
    try {
      await services.auth.updatePlannerProfile({
        planner_bio: profile.planner_bio,
        planner_specialties: profile.planner_specialties.split(",").map((value) => value.trim()).filter(Boolean),
        planner_destinations: profile.planner_destinations.split(",").map((value) => value.trim()).filter(Boolean),
        planner_languages: profile.planner_languages.split(",").map((value) => value.trim()).filter(Boolean),
      });
      await refreshProfile(); setProfileMessage("Your couple-facing Planner profile is saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save your profile."); }
    finally { setProfileBusy(false); }
  };

  useEffect(() => {
    let active = true;
    void services.weddings.list().then(async (weddings) => {
      const results = await Promise.all(weddings.map(async (wedding) => {
        const [tasks, events] = await Promise.all([
          services.tasks.list(wedding.id),
          services.events.listForWedding(wedding.id),
        ]);
        return { wedding, tasks, events };
      }));
      if (active) setWorkspaces(results);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load assigned wedding work.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  if (busy) return <div className="rounded-2xl border border-border bg-white p-8 text-sm text-muted-foreground">Loading your assigned work…</div>;
  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">{error}</div>;

  const allTasks = workspaces.flatMap((item) => item.tasks);
  const activeTasks = allTasks.filter((task) => task.status !== "done");
  const overdueTasks = activeTasks.filter((task) => task.is_overdue);
  const eventCount = workspaces.reduce((sum, item) => sum + item.events.length, 0);

  return (
    <main className="space-y-6">
      <header><p className="text-xs font-bold uppercase tracking-wider text-gold-700">Planner workspace</p><h1 className="mt-1 font-serif text-3xl font-bold text-forest-900">Your assigned weddings</h1><p className="mt-2 text-sm text-muted-foreground">This view is limited to weddings assigned to your planner account.</p></header>
      <Card className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-semibold text-forest-900">Planner profile for couples</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share your experience so couples can choose someone who fits their destination, style and language needs.</p>
        <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Short introduction<textarea maxLength={600} rows={3} value={profile.planner_bio} onChange={(event) => setProfile({ ...profile, planner_bio: event.target.value })} className="input-base mt-1 w-full" /></label>
          <label className="text-sm font-medium">Specialties, comma separated<input maxLength={800} value={profile.planner_specialties} onChange={(event) => setProfile({ ...profile, planner_specialties: event.target.value })} className="input-base mt-1 w-full" placeholder="Destination weddings, Hindu ceremonies" /></label>
          <label className="text-sm font-medium">Destinations, comma separated<input maxLength={800} value={profile.planner_destinations} onChange={(event) => setProfile({ ...profile, planner_destinations: event.target.value })} className="input-base mt-1 w-full" placeholder="Jaipur, Udaipur" /></label>
          <label className="text-sm font-medium">Languages, comma separated<input maxLength={600} value={profile.planner_languages} onChange={(event) => setProfile({ ...profile, planner_languages: event.target.value })} className="input-base mt-1 w-full" placeholder="English, Hindi" /></label>
          <div className="flex items-end gap-3"><button disabled={profileBusy} className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{profileBusy ? "Saving…" : "Save profile"}</button>{profileMessage && <p role="status" className="pb-2 text-xs text-emerald-800">{profileMessage}</p>}</div>
        </form>
      </Card>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Planning summary">
        {[{ label: "Assigned weddings", value: workspaces.length }, { label: "Open tasks", value: activeTasks.length }, { label: "Overdue tasks", value: overdueTasks.length }].map((item) => <Card key={item.label} className="p-4"><p className="text-xs font-semibold text-muted-foreground">{item.label}</p><p className="mt-1 font-serif text-3xl font-bold text-forest-900">{item.value}</p></Card>)}
      </section>
      {workspaces.length === 0 ? <Card className="p-8 text-center"><h2 className="font-serif text-xl font-semibold text-forest-900">No weddings assigned yet</h2><p className="mt-2 text-sm text-muted-foreground">New couple workspaces are automatically assigned to an available Planner. If none are available, they will be assigned when an approved planner is available.</p></Card> : <section className="grid gap-4 lg:grid-cols-2" aria-label="Assigned wedding workspaces">
        {workspaces.map(({ wedding, tasks, events }) => {
          const remaining = tasks.filter((task) => task.status !== "done").length;
          const overdue = tasks.filter((task) => task.status !== "done" && task.is_overdue).length;
          return <Card key={wedding.id} className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl font-semibold text-forest-900">{wedding.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{wedding.destination} · {wedding.primary_venue}</p></div><span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold capitalize text-forest-800">{wedding.status.replace(/_/g, " ")}</span></div><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(wedding.start_date)} – {formatDate(wedding.end_date)} · {events.length} events</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CheckSquare2 className="h-4 w-4" />{remaining} open tasks{overdue > 0 && <span className="font-semibold text-rose-700">· {overdue} overdue</span>}</p><div className="mt-5 flex flex-wrap gap-2"><Link to={`/planner/weddings/${wedding.id}`} className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-3 py-2 text-xs font-semibold text-white">Open wedding<ArrowRight className="h-3.5 w-3.5" /></Link><Link to={`/planner/tasks?wedding_id=${encodeURIComponent(wedding.id)}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-forest-800">View tasks</Link></div></Card>;
        })}
      </section>}
      <p className="text-xs text-muted-foreground">{eventCount} scheduled events across your assigned portfolio.</p>
    </main>
  );
};
