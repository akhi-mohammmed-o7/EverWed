import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import { useAuth } from "@/context/AuthContext";
import type { Wedding, WeddingEvent } from "@/types";

const traditions = [
  "Hindu",
  "Muslim / Nikah",
  "Sikh",
  "Christian",
  "Jain",
  "Buddhist",
  "Jewish",
  "Parsi",
  "Civil / Court",
  "Interfaith / Mixed",
  "Other",
];

const steps = [
  { title: "Partner names", description: "Who is getting married?" },
  { title: "Wedding date", description: "When is the celebration?" },
  { title: "Tradition", description: "Choose a tradition or write your own." },
  { title: "Regional customs", description: "Optional family or regional details." },
  { title: "Functions", description: "Add the ceremonies and celebrations you want." },
  { title: "City & venue", description: "Where will you celebrate?" },
  { title: "Guest count", description: "Your planned guest estimate." },
  { title: "Budget", description: "Your total planned budget." },
];

type FunctionDraft = {
  key: string;
  id?: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_hall: string;
  notes: string;
};

const newKey = () => `fn-${Math.random().toString(36).slice(2, 10)}`;

const emptyFunction = (date: string, venue: string): FunctionDraft => ({
  key: newKey(),
  name: "",
  date,
  start_time: "10:00",
  end_time: "12:00",
  venue_hall: venue,
  notes: "",
});

const toDraft = (event: WeddingEvent): FunctionDraft => ({
  key: event.id,
  id: event.id,
  name: event.name,
  date: event.date,
  start_time: event.start_time,
  end_time: event.end_time,
  venue_hall: event.venue_hall,
  notes: event.notes || "",
});

export const CoupleWeddingBuilderPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const weddingId = user?.wedding_id || null;
  const isEditing = Boolean(weddingId);

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    partnerOne: "",
    partnerTwo: "",
    startDate: "",
    endDate: "",
    traditionChoice: "",
    customTradition: "",
    regional: "",
    city: "",
    venue: "",
    guests: "",
    budget: "",
    theme: "",
  });
  const [functions, setFunctions] = useState<FunctionDraft[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(weddingId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!weddingId) {
      setForm((current) => ({
        ...current,
        partnerOne: user?.partner_one_name || "",
        partnerTwo: user?.partner_two_name || "",
      }));
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const [details, savedEvents] = await Promise.all([
          services.weddings.get(weddingId),
          services.events.listForWedding(weddingId),
        ]);
        if (!active) return;
        const knownTradition = traditions.includes(details.tradition || "");
        setWedding(details);
        setEvents(savedEvents);
        setFunctions(savedEvents.map(toDraft));
        setForm({
          partnerOne: details.bride_name,
          partnerTwo: details.groom_name,
          startDate: details.start_date,
          endDate: details.end_date,
          traditionChoice: knownTradition ? details.tradition || "" : details.tradition ? "Other" : "",
          customTradition: knownTradition ? "" : details.tradition || "",
          regional: details.regional_customization || "",
          city: details.destination,
          venue: details.primary_venue,
          guests: String(details.guest_estimate),
          budget: String(details.budget_allocated),
          theme: details.theme || "",
        });
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load your wedding.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [weddingId, user?.partner_one_name, user?.partner_two_name]);

  const resolvedTradition =
    form.traditionChoice === "Other" ? form.customTradition.trim() : form.traditionChoice;

  const updateFunction = (key: string, changes: Partial<FunctionDraft>) =>
    setFunctions((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  const addFunction = () => {
    if (!form.startDate) {
      setError("Choose your wedding date before adding a function.");
      return;
    }
    setFunctions((items) => [...items, emptyFunction(form.startDate, form.venue)]);
    setError("");
  };

  const validateStep = (index: number): string => {
    switch (index) {
      case 0:
        if (!form.partnerOne.trim() || !form.partnerTwo.trim()) return "Enter both partner names.";
        return "";
      case 1:
        if (!form.startDate || !form.endDate) return "Choose your wedding start and end dates.";
        if (form.endDate < form.startDate) return "The end date must be on or after the start date.";
        return "";
      case 2:
        if (!resolvedTradition) return "Choose a tradition, or select Other and write your own.";
        return "";
      case 3:
        return "";
      case 4: {
        for (const item of functions) {
          if (!item.name.trim()) return "Every function needs a name.";
          if (!item.date) return "Every function needs a date.";
          if (form.startDate && form.endDate && (item.date < form.startDate || item.date > form.endDate)) {
            return "Every function date must fall within your wedding dates.";
          }
          if (item.end_time <= item.start_time) return "Every function must end after it starts.";
        }
        return "";
      }
      case 5:
        if (!form.city.trim()) return "Enter the city or destination.";
        if (!form.venue.trim()) return "Enter your primary venue.";
        return "";
      case 6:
        if (!form.guests || Number(form.guests) < 1) return "Enter a planned guest count of at least 1.";
        return "";
      case 7:
        if (form.budget === "" || Number(form.budget) < 0) return "Enter your planned budget.";
        return "";
      default:
        return "";
    }
  };

  const nextStep = () => {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const previousStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const saveFunctions = async (wid: string, currentEvents: WeddingEvent[]) => {
    const existingIds = new Set(currentEvents.map((event) => event.id));
    const draftIds = new Set(functions.filter((item) => item.id).map((item) => item.id as string));
    for (const event of currentEvents) {
      if (!draftIds.has(event.id)) await services.events.delete(event.id);
    }
    for (const item of functions) {
      const payload = {
        name: item.name.trim(),
        date: item.date,
        start_time: item.start_time,
        end_time: item.end_time,
        venue_hall: item.venue_hall.trim() || form.venue.trim(),
        notes: item.notes.trim(),
      };
      if (item.id && existingIds.has(item.id)) {
        await services.events.update(item.id, payload);
      } else {
        await services.events.create(wid, {
          ...payload,
          coordinator_name: user?.name || "Couple",
          guest_estimate: Number(form.guests),
          notes: item.notes.trim(),
        });
      }
    }
  };

  const save = async () => {
    for (let index = 0; index < steps.length; index += 1) {
      const problem = validateStep(index);
      if (problem) {
        setStep(index);
        setError(problem);
        return;
      }
    }
    setError("");
    setMessage("");
    setIsSaving(true);
    const weddingPayload = {
      title: `${form.partnerOne.trim()} & ${form.partnerTwo.trim()}`,
      bride_name: form.partnerOne.trim(),
      groom_name: form.partnerTwo.trim(),
      destination: form.city.trim(),
      primary_venue: form.venue.trim(),
      guest_estimate: Number(form.guests),
      budget_allocated: Number(form.budget),
      start_date: form.startDate,
      end_date: form.endDate,
      theme: form.theme.trim(),
      tradition: resolvedTradition,
      regional_customization: form.regional.trim(),
    };

    try {
      if (!weddingId) {
        await services.weddings.onboardCouple({
          partner_one_name: weddingPayload.bride_name,
          partner_two_name: weddingPayload.groom_name,
          destination: weddingPayload.destination,
          primary_venue: weddingPayload.primary_venue,
          guest_estimate: weddingPayload.guest_estimate,
          budget_allocated: weddingPayload.budget_allocated,
          start_date: weddingPayload.start_date,
          end_date: weddingPayload.end_date,
          theme: weddingPayload.theme,
          tradition: weddingPayload.tradition,
          regional_customization: weddingPayload.regional_customization,
          functions: functions.map((item) => ({
            name: item.name.trim(),
            date: item.date,
            start_time: item.start_time,
            end_time: item.end_time,
          })),
        });
        await refreshProfile();
        navigate("/couple/dashboard", { replace: true });
        return;
      }

      const oldStart = wedding?.start_date || form.startDate;
      const oldEnd = wedding?.end_date || form.endDate;
      const datesChanged = form.startDate !== oldStart || form.endDate !== oldEnd;

      if (!datesChanged) {
        await services.weddings.update(weddingId, weddingPayload);
        await saveFunctions(weddingId, events);
      } else {
        // Temporarily widen the date window to cover both the old and new
        // ranges. This lets function dates and the wedding dates be saved in
        // any order without rejecting a valid final state part-way through.
        const unionStart = form.startDate < oldStart ? form.startDate : oldStart;
        const unionEnd = form.endDate > oldEnd ? form.endDate : oldEnd;
        await services.weddings.update(weddingId, {
          ...weddingPayload,
          start_date: unionStart,
          end_date: unionEnd,
        });
        await saveFunctions(weddingId, events);
        await services.weddings.update(weddingId, {
          start_date: weddingPayload.start_date,
          end_date: weddingPayload.end_date,
        });
      }
      const [details, savedEvents] = await Promise.all([
        services.weddings.get(weddingId),
        services.events.listForWedding(weddingId),
      ]);
      setWedding(details);
      setEvents(savedEvents);
      setFunctions(savedEvents.map(toDraft));
      setMessage("Your wedding details, traditions and functions are saved.");
      await refreshProfile();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your wedding.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading your wedding builder...</div>;
  }

  const stepInfo = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold-700">
            <Sparkles className="h-3 w-3" /> Wedding Builder
          </span>
          <h1 className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl">
            {isEditing ? "Your wedding details" : "Build your wedding"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isEditing
              ? "Move through the steps and save changes whenever you are ready."
              : "Eight short steps. You can edit everything later."}
          </p>
        </div>
        {isEditing && (
          <Button type="button" variant="gold" onClick={() => void save()} isLoading={isSaving}>
            <Save className="mr-1.5 h-4 w-4" /> Save changes
          </Button>
        )}
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div>}

      <div className="rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-forest-800">
          <span>Step {step + 1} of {steps.length}: {stepInfo.title}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ivory-200">
          <div className="h-full rounded-full bg-forest-800 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                if (index <= step) {
                  setError("");
                  setStep(index);
                }
              }}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                index === step
                  ? "bg-forest-800 text-ivory"
                  : index < step
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-ivory-100 text-muted-foreground"
              }`}
            >
              {index < step && <Check className="mr-1 inline h-3 w-3" />}
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="mb-5">
          <h2 className="font-serif text-xl font-bold text-forest-900">{stepInfo.title}</h2>
          <p className="text-xs text-muted-foreground">{stepInfo.description}</p>
        </div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-900">Partner one
              <input required maxLength={120} value={form.partnerOne} onChange={(event) => setForm({ ...form, partnerOne: event.target.value })} className="input-base mt-1" placeholder="First partner's name" />
            </label>
            <label className="text-sm font-medium text-forest-900">Partner two
              <input required maxLength={120} value={form.partnerTwo} onChange={(event) => setForm({ ...form, partnerTwo: event.target.value })} className="input-base mt-1" placeholder="Second partner's name" />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-900">Wedding start date
              <input required type="date" value={form.startDate} onChange={(event) => {
                const startDate = event.target.value;
                setForm((current) => ({ ...current, startDate, endDate: current.endDate && current.endDate >= startDate ? current.endDate : startDate }));
                setFunctions((items) => items.map((item) => (item.date && item.date >= startDate ? item : { ...item, date: startDate })));
              }} className="input-base mt-1" />
            </label>
            <label className="text-sm font-medium text-forest-900">Wedding end date
              <input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="input-base mt-1" />
            </label>
            <p className="text-xs text-muted-foreground sm:col-span-2">A one-day wedding uses the same start and end date.</p>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-900">Tradition or ceremony style
              <select required value={form.traditionChoice} onChange={(event) => setForm({ ...form, traditionChoice: event.target.value })} className="input-base mt-1">
                <option value="">Choose what fits</option>
                {traditions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            {form.traditionChoice === "Other" && (
              <label className="text-sm font-medium text-forest-900">Your tradition
                <input required maxLength={120} value={form.customTradition} onChange={(event) => setForm({ ...form, customTradition: event.target.value })} className="input-base mt-1" placeholder="Write your own tradition or ceremony style" />
              </label>
            )}
            <p className="text-xs text-muted-foreground sm:col-span-2">No ceremony is required. Choose only what reflects your celebration.</p>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4">
            <label className="text-sm font-medium text-forest-900">Regional or family customs (optional)
              <textarea maxLength={500} rows={3} value={form.regional} onChange={(event) => setForm({ ...form, regional: event.target.value })} className="input-base mt-1" placeholder="Languages, customs, or details you want to honour" />
            </label>
            <label className="text-sm font-medium text-forest-900">Style or theme (optional)
              <input maxLength={160} value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} className="input-base mt-1" placeholder="Describe the style in your own words" />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Add only the functions you want. Each one adds its own preparation tasks to your checklist.
              </p>
              <Button type="button" variant="outline" onClick={addFunction}><Plus className="mr-1 h-4 w-4" /> Add function</Button>
            </div>
            {functions.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No functions yet. You can create your wedding without any functions, or add a ceremony or celebration now.
              </p>
            )}
            <div className="space-y-3">
              {functions.map((item) => (
                <div key={item.key} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-6">
                  <label className="text-xs font-medium sm:col-span-2">Function name
                    <input required maxLength={120} value={item.name} onChange={(event) => updateFunction(item.key, { name: event.target.value })} className="input-base mt-1" placeholder="Ceremony or celebration" />
                  </label>
                  <label className="text-xs font-medium">Date
                    <input required type="date" min={form.startDate || undefined} max={form.endDate || undefined} value={item.date} onChange={(event) => updateFunction(item.key, { date: event.target.value })} className="input-base mt-1" />
                  </label>
                  <label className="text-xs font-medium">Starts
                    <input required type="time" value={item.start_time} onChange={(event) => updateFunction(item.key, { start_time: event.target.value })} className="input-base mt-1" />
                  </label>
                  <label className="text-xs font-medium">Ends
                    <input required type="time" value={item.end_time} onChange={(event) => updateFunction(item.key, { end_time: event.target.value })} className="input-base mt-1" />
                  </label>
                  <div className="flex items-end">
                    <button type="button" onClick={() => setFunctions((items) => items.filter((entry) => entry.key !== item.key))} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <label className="text-xs font-medium sm:col-span-6">Venue for this function (optional)
                    <input maxLength={200} value={item.venue_hall} onChange={(event) => updateFunction(item.key, { venue_hall: event.target.value })} className="input-base mt-1" placeholder={form.venue || "Defaults to your primary venue"} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-900">City or destination
              <input required maxLength={160} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="input-base mt-1" placeholder="City or region" />
            </label>
            <label className="text-sm font-medium text-forest-900">Primary venue
              <input required maxLength={200} value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} className="input-base mt-1" placeholder="Venue name" />
            </label>
          </div>
        )}

        {step === 6 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-forest-900">Planned guest count
              <input required type="number" min={1} max={100000} value={form.guests} onChange={(event) => setForm({ ...form, guests: event.target.value })} className="input-base mt-1" />
            </label>
            <p className="self-end text-xs text-muted-foreground">This is your planning estimate. Actual guest records are added separately on the Guest List page.</p>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-forest-900">Total planned budget (INR)
                <input required type="number" min={0} step="0.01" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} className="input-base mt-1" />
              </label>
              <p className="self-end text-xs text-muted-foreground">Your budget is saved separately from recorded payments and expenses.</p>
            </div>
            <div className="rounded-xl border border-border bg-ivory-50 p-4 text-xs">
              <h3 className="font-serif text-base font-bold text-forest-900">Review</h3>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Couple</dt><dd className="font-semibold text-forest-900">{form.partnerOne} &amp; {form.partnerTwo}</dd></div>
                <div><dt className="text-muted-foreground">Dates</dt><dd className="font-semibold text-forest-900">{form.startDate} to {form.endDate}</dd></div>
                <div><dt className="text-muted-foreground">Tradition</dt><dd className="font-semibold text-forest-900">{resolvedTradition || "Not set"}</dd></div>
                <div><dt className="text-muted-foreground">Venue</dt><dd className="font-semibold text-forest-900">{form.venue || "Not set"}, {form.city || "Not set"}</dd></div>
                <div><dt className="text-muted-foreground">Planned guests</dt><dd className="font-semibold text-forest-900">{form.guests || "0"}</dd></div>
                <div><dt className="text-muted-foreground">Functions</dt><dd className="font-semibold text-forest-900">{functions.length}</dd></div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={previousStep} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" variant="gold" onClick={nextStep}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="gold" onClick={() => void save()} isLoading={isSaving}>
              <Save className="mr-1.5 h-4 w-4" /> {isEditing ? "Save changes" : "Create my wedding"}
            </Button>
          )}
        </div>
      </Card>

      {isEditing && functions.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-forest-900">Saved functions</h2>
              <p className="text-xs text-muted-foreground">Changes are written when you save the builder.</p>
            </div>
            <span className="rounded-full bg-ivory-100 px-3 py-1 text-xs font-semibold text-forest-800">{events.length} saved</span>
          </div>
          <div className="mt-3 divide-y divide-border/60">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-forest-900">{event.name}</p>
                  <p className="mt-0.5 flex flex-wrap gap-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3 text-gold-700" /> {event.date}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-gold-700" /> {event.start_time} - {event.end_time}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-gold-700" /> {event.venue_hall}</span>
                  </p>
                </div>
                <button type="button" onClick={() => { setStep(4); setError(""); }} className="inline-flex items-center gap-1 self-start rounded-lg border border-border px-2.5 py-1 font-semibold text-forest-800 hover:bg-ivory-100">
                  <Pencil className="h-3 w-3" /> Edit in functions step
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
        <p className="flex items-center gap-2 rounded-xl border border-border bg-white p-3"><Heart className="h-4 w-4 text-rose-500" /> Saved to SQLite</p>
        <p className="flex items-center gap-2 rounded-xl border border-border bg-white p-3"><Users className="h-4 w-4 text-forest-700" /> Planned guests are separate from guest records</p>
        <p className="flex items-center gap-2 rounded-xl border border-border bg-white p-3"><Wallet className="h-4 w-4 text-emerald-700" /> Budget updates are saved with your wedding</p>
      </div>
    </div>
  );
};
