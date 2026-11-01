import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import { useAuth } from "@/context/AuthContext";
import type { PlannerDirectoryEntry } from "@/types";

type FunctionDraft = { name: string; date: string; start_time: string; end_time: string };
const traditions = ["Hindu", "Muslim / Nikah", "Sikh", "Christian", "Jain", "Buddhist", "Jewish", "Parsi", "Civil / Court", "Interfaith / Mixed", "Other"];

export const CoupleOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const [destination, setDestination] = useState("");
  const [venue, setVenue] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [theme, setTheme] = useState("");
  const [tradition, setTradition] = useState("");
  const [regional, setRegional] = useState("");
  const [functions, setFunctions] = useState<FunctionDraft[]>([]);
  const [planners, setPlanners] = useState<PlannerDirectoryEntry[]>([]);
  const [preferredPlannerUid, setPreferredPlannerUid] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void services.weddings.listPlanners().then((items) => { if (active) setPlanners(items); }).catch(() => {
      if (active) setPlanners([]);
    });
    return () => { active = false; };
  }, []);

  const addFunction = () => setFunctions((items) => [...items, { name: "", date: startDate, start_time: "10:00", end_time: "11:00" }]);
  const updateFunction = (index: number, changes: Partial<FunctionDraft>) => setFunctions((items) => items.map((item, i) => i === index ? { ...item, ...changes } : item));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!tradition) { setError("Choose a ceremony tradition or select Other."); return; }
    if (!functions.length) { setError("Add at least one ceremony or celebration function."); return; }
    if (functions.some((item) => !item.name.trim() || !item.date)) { setError("Complete each function name and date."); return; }
    setBusy(true);
    try {
      await services.weddings.onboardCouple({ destination: destination.trim(), primary_venue: venue.trim(), guest_estimate: Number(guests), budget_allocated: Number(budget), start_date: startDate, end_date: endDate, theme: theme.trim(), tradition, regional_customization: regional.trim(), ...(preferredPlannerUid ? { preferred_planner_uid: Number(preferredPlannerUid) } : {}), functions: functions.map((item) => ({ ...item, name: item.name.trim() })) });
      await refreshProfile(); navigate("/couple/dashboard", { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create your wedding workspace."); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
    <header className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-gold-700">Your private workspace</p><h1 className="mt-1 font-serif text-3xl font-bold text-forest-900">Set up your wedding</h1><p className="mt-2 text-sm text-muted-foreground">Choose the traditions and celebrations that fit you. Functions you add here are saved to your schedule.</p></header>
    <Card className="p-5 sm:p-8">
      {location.state?.registered === true && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Your couple account is ready. Add your wedding details to create your private workspace.</div>}
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-forest-900">Destination<input required maxLength={160} value={destination} onChange={(e) => setDestination(e.target.value)} className="input-base mt-1" placeholder="City or region" /></label>
        <label className="text-sm font-medium text-forest-900">Primary venue<input required maxLength={200} value={venue} onChange={(e) => setVenue(e.target.value)} className="input-base mt-1" placeholder="Venue name" /></label>
        <label className="text-sm font-medium text-forest-900">Estimated guest count<input required type="number" min={1} max={100000} value={guests} onChange={(e) => setGuests(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium text-forest-900">Planning budget (INR)<input required type="number" min={0} step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium text-forest-900">Start date<input required type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFunctions((items) => items.map((item) => item.date ? item : { ...item, date: e.target.value })); }} className="input-base mt-1" /></label>
        <label className="text-sm font-medium text-forest-900">End date<input required type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-base mt-1" /></label>
        <label className="text-sm font-medium text-forest-900">Tradition or ceremony style<select required value={tradition} onChange={(e) => setTradition(e.target.value)} className="input-base mt-1"><option value="">Choose what fits</option>{traditions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-forest-900">Regional or family customs<input maxLength={500} value={regional} onChange={(e) => setRegional(e.target.value)} className="input-base mt-1" placeholder="Languages, customs, or details to honour" /></label>
        <label className="text-sm font-medium text-forest-900 sm:col-span-2">Style or theme (optional)<input maxLength={160} value={theme} onChange={(e) => setTheme(e.target.value)} className="input-base mt-1" placeholder="Describe the style in your own words" /></label>
        <section className="space-y-3 sm:col-span-2" aria-labelledby="planner-choice-heading">
          <div><h2 id="planner-choice-heading" className="font-semibold text-forest-900">Choose your wedding planner</h2><p className="text-xs text-muted-foreground">Select someone whose experience, destinations, and languages fit your wedding. If you skip this, EverWed assigns an active planner with the lightest workload.</p></div>
          <select value={preferredPlannerUid} onChange={(event) => setPreferredPlannerUid(event.target.value)} className="input-base w-full"><option value="">Automatically match me with an available planner</option>{planners.map((planner) => <option key={planner.uid} value={planner.uid}>{planner.name}{planner.specialties.length ? ` · ${planner.specialties.join(", ")}` : ""}</option>)}</select>
          {planners.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{planners.map((planner) => <button key={planner.uid} type="button" aria-pressed={preferredPlannerUid === String(planner.uid)} onClick={() => setPreferredPlannerUid(String(planner.uid))} className={`rounded-xl border p-3 text-left transition-colors ${preferredPlannerUid === String(planner.uid) ? "border-forest-700 bg-forest-50" : "border-border bg-white hover:border-forest-400"}`}><span className="font-semibold text-forest-900">{planner.name}</span>{planner.bio && <span className="mt-1 block text-xs text-muted-foreground">{planner.bio}</span>}{(planner.specialties.length > 0 || planner.destinations.length > 0 || planner.languages.length > 0) && <span className="mt-2 block text-xs text-forest-700">{[planner.specialties, planner.destinations, planner.languages].filter((items) => items.length).map((items) => items.join(", ")).join(" · ")}</span>}</button>)}</div>}
          {planners.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">No active planner profiles are available yet. Your wedding will be saved and automatically assigned as soon as an approved planner is available.</p>}
        </section>
        <section className="space-y-3 sm:col-span-2" aria-labelledby="functions-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="functions-heading" className="font-semibold text-forest-900">Ceremonies & celebrations</h2><p className="text-xs text-muted-foreground">Add the events you want on your wedding schedule.</p></div><button type="button" onClick={addFunction} className="inline-flex items-center gap-1 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold text-forest-800"><Plus className="h-4 w-4" /> Add function</button></div>
          {functions.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-4"><label className="text-xs font-medium sm:col-span-2">Function name<input required maxLength={120} value={item.name} onChange={(e) => updateFunction(index, { name: e.target.value })} className="input-base mt-1" placeholder="Ceremony or celebration" /></label><label className="text-xs font-medium">Date<input required type="date" min={startDate || undefined} max={endDate || undefined} value={item.date} onChange={(e) => updateFunction(index, { date: e.target.value })} className="input-base mt-1" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-medium">Starts<input required type="time" value={item.start_time} onChange={(e) => updateFunction(index, { start_time: e.target.value })} className="input-base mt-1" /></label><label className="text-xs font-medium">Ends<input required type="time" value={item.end_time} onChange={(e) => updateFunction(index, { end_time: e.target.value })} className="input-base mt-1" /></label><button type="button" onClick={() => setFunctions((items) => items.filter((_, i) => i !== index))} className="col-span-2 inline-flex items-center gap-1 text-xs text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Remove function</button></div></div>)}
        </section>
        <div className="sm:col-span-2"><Button type="submit" variant="gold" isLoading={busy || services.isDemo} className="w-full sm:w-auto">Create my wedding workspace<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      </form>
    </Card>
  </main>;
};
