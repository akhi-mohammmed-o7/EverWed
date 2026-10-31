import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import { useAuth } from "@/context/AuthContext";
import type { EventCreate, FinancialSummary, Guest, Task, Wedding, WeddingEvent } from "@/types";
import { formatDate, formatINR } from "@/lib/utils";

type TabKey = "overview" | "events" | "tasks" | "guests" | "finance";

type GuestDraft = Omit<Guest, "id" | "wedding_id">;

const emptyGuest: GuestDraft = {
  name: "",
  email: "",
  phone: "",
  side: "mutual",
  rsvp_status: "pending",
  meal_preference: "",
  table_number: "",
  is_vip: false,
  plus_ones: 0,
  notes: "",
};

export const WeddingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [finSummary, setFinSummary] = useState<FinancialSummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState({
    name: "",
    date: "",
    start_time: "10:00",
    end_time: "12:00",
    venue_hall: "",
    guest_estimate: 0,
    notes: "",
  });

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [guestDraft, setGuestDraft] = useState<GuestDraft>(emptyGuest);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageDraft, setManageDraft] = useState({
    title: "",
    bride_name: "",
    groom_name: "",
    contact_phone: "",
    contact_email: "",
    destination: "",
    primary_venue: "",
    guest_estimate: "",
    budget_allocated: "",
    package_fee: "",
    start_date: "",
    end_date: "",
    theme: "",
    tradition: "",
    regional_customization: "",
    status: "planning",
  });

  const loadAll = async (wid: string) => {
    setIsLoading(true);
    setError("");
    try {
      const [w, evts, tsks, gsts] = await Promise.all([
        services.weddings.get(wid),
        services.events.listForWedding(wid),
        services.tasks.list(wid),
        services.guests.list(wid),
      ]);
      setWedding(w);
      setEvents(evts);
      setTasks(tsks);
      setGuests(gsts);
      if (isAdmin) {
        setFinSummary(await services.finance.getFinancialSummary(wid).catch(() => null));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this wedding.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) void loadAll(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openAddEvent = () => {
    if (!wedding) return;
    setEditingEventId(null);
    setEventDraft({
      name: "",
      date: wedding.start_date,
      start_time: "10:00",
      end_time: "12:00",
      venue_hall: wedding.primary_venue,
      guest_estimate: wedding.guest_estimate,
      notes: "",
    });
    setEventModalOpen(true);
    setError("");
  };

  const openEditEvent = (event: WeddingEvent) => {
    setEditingEventId(event.id);
    setEventDraft({
      name: event.name,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      venue_hall: event.venue_hall,
      guest_estimate: event.guest_estimate,
      notes: event.notes || "",
    });
    setEventModalOpen(true);
    setError("");
  };

  const saveEvent = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!id || !wedding) return;
    if (eventDraft.end_time <= eventDraft.start_time) {
      setError("The event end time must be after its start time.");
      return;
    }
    if (eventDraft.date < wedding.start_date || eventDraft.date > wedding.end_date) {
      setError("The event date must fall within the wedding dates.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editingEventId) {
        await services.events.update(editingEventId, { ...eventDraft, notes: eventDraft.notes });
      } else {
        const payload: EventCreate = {
          ...eventDraft,
          coordinator_name: user?.name || "Planner",
          notes: eventDraft.notes,
        };
        await services.events.create(id, payload);
      }
      setEventModalOpen(false);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this event.");
    } finally {
      setBusy(false);
    }
  };

  const deleteEvent = async (event: WeddingEvent) => {
    if (!id) return;
    if (!window.confirm(`Delete the event "${event.name}"? Its generated tasks will be removed too.`)) return;
    setError("");
    try {
      await services.events.delete(event.id);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this event.");
    }
  };

  const toggleTask = async (task: Task) => {
    setError("");
    try {
      await services.tasks.update(task.id, { status: task.status === "done" ? "in_progress" : "done" });
      if (id) setTasks(await services.tasks.list(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this task.");
    }
  };

  const deleteTask = async (task: Task) => {
    if (!id) return;
    if (!window.confirm(`Delete the task "${task.title}"?`)) return;
    setError("");
    try {
      await services.tasks.delete(task.id);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this task.");
    }
  };

  const openManage = () => {
    if (!wedding) return;
    setManageDraft({
      title: wedding.title,
      bride_name: wedding.bride_name,
      groom_name: wedding.groom_name,
      contact_phone: wedding.contact_phone,
      contact_email: wedding.contact_email,
      destination: wedding.destination,
      primary_venue: wedding.primary_venue,
      guest_estimate: String(wedding.guest_estimate),
      budget_allocated: String(wedding.budget_allocated),
      package_fee: wedding.package_fee == null ? "" : String(wedding.package_fee),
      start_date: wedding.start_date,
      end_date: wedding.end_date,
      theme: wedding.theme || "",
      tradition: wedding.tradition || "",
      regional_customization: wedding.regional_customization || "",
      status: wedding.status,
    });
    setManageOpen(true);
    setError("");
  };

  const saveManagedWedding = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!id) return;
    if (manageDraft.end_date < manageDraft.start_date) {
      setError("The wedding end date must be on or after the start date.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const packageFee = manageDraft.package_fee === "" ? 0 : Number(manageDraft.package_fee);
      await services.weddings.update(id, {
        title: manageDraft.title.trim(),
        bride_name: manageDraft.bride_name.trim(),
        groom_name: manageDraft.groom_name.trim(),
        contact_phone: manageDraft.contact_phone.trim(),
        contact_email: manageDraft.contact_email.trim(),
        destination: manageDraft.destination.trim(),
        primary_venue: manageDraft.primary_venue.trim(),
        guest_estimate: Number(manageDraft.guest_estimate),
        budget_allocated: Number(manageDraft.budget_allocated),
        package_fee: packageFee,
        start_date: manageDraft.start_date,
        end_date: manageDraft.end_date,
        theme: manageDraft.theme.trim(),
        tradition: manageDraft.tradition.trim(),
        regional_customization: manageDraft.regional_customization.trim(),
        status: manageDraft.status,
      });
      setManageOpen(false);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this wedding.");
    } finally {
      setBusy(false);
    }
  };

  const openAddGuest = () => {
    setEditingGuestId(null);
    setGuestDraft(emptyGuest);
    setGuestModalOpen(true);
    setError("");
  };

  const openEditGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setGuestDraft({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      side: guest.side,
      rsvp_status: guest.rsvp_status,
      meal_preference: guest.meal_preference || "",
      table_number: guest.table_number || "",
      is_vip: guest.is_vip,
      plus_ones: guest.plus_ones,
      notes: guest.notes || "",
    });
    setGuestModalOpen(true);
    setError("");
  };

  const saveGuest = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!id || !guestDraft.name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...guestDraft,
        name: guestDraft.name.trim(),
        email: (guestDraft.email || "").trim(),
        phone: (guestDraft.phone || "").trim(),
        meal_preference: (guestDraft.meal_preference || "").trim(),
        table_number: (guestDraft.table_number || "").trim(),
        notes: (guestDraft.notes || "").trim(),
      };
      if (editingGuestId) {
        await services.guests.update(editingGuestId, payload);
      } else {
        await services.guests.create({ ...payload, wedding_id: id });
      }
      setGuestModalOpen(false);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this guest.");
    } finally {
      setBusy(false);
    }
  };

  const deleteGuest = async (guest: Guest) => {
    if (!id) return;
    if (!window.confirm(`Remove ${guest.name} from the guest list?`)) return;
    setError("");
    try {
      await services.guests.delete(guest.id);
      await loadAll(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove this guest.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading wedding workspace...</div>;
  }

  if (!wedding) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        {error || "This wedding could not be loaded or is not assigned to your account."}
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "events", label: `Events (${events.length})`, icon: Calendar },
    { key: "tasks", label: `Tasks (${tasks.length})`, icon: CheckCircle2 },
    { key: "guests", label: `Guests (${guests.length})`, icon: Users },
  ];
  if (isAdmin) tabs.push({ key: "finance", label: "Financial summary", icon: DollarSign });

  const filteredGuests = guests.filter((guest) => {
    const term = search.toLowerCase();
    const matchesSearch =
      guest.name.toLowerCase().includes(term) ||
      (guest.email || "").toLowerCase().includes(term) ||
      (guest.table_number || "").toLowerCase().includes(term);
    const matchesRsvp = rsvpFilter === "all" || guest.rsvp_status === rsvpFilter;
    return matchesSearch && matchesRsvp;
  });
  const confirmedGuests = guests.filter((guest) => guest.rsvp_status === "confirmed").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/planner/weddings" className="mb-1 flex items-center gap-1 text-xs font-semibold text-gold-800 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to weddings
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-forest-900 sm:text-3xl">{wedding.title}</h1>
            <Badge status={wedding.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {wedding.primary_venue} • {wedding.guest_estimate} planned guests • {formatDate(wedding.start_date)} to {formatDate(wedding.end_date)}
          </p>
        </div>
        {isAdmin && (
          <Button variant="gold" size="sm" onClick={openManage}>
            <Pencil className="mr-1 h-4 w-4" /> Manage wedding
          </Button>
        )}
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      <div className="flex gap-2 overflow-x-auto rounded-t-2xl border-b border-border bg-white px-4 pt-2 text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 transition-all ${
                active ? "border-forest-800 font-bold text-forest-900" : "border-transparent text-muted-foreground hover:text-forest-800"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-gold-700" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="space-y-5 p-6 md:col-span-2">
            <h2 className="font-serif text-lg font-bold text-forest-900">Couple & wedding details</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                ["Partner one", wedding.bride_name],
                ["Partner two", wedding.groom_name],
                ["Contact phone", wedding.contact_phone],
                ["Contact email", wedding.contact_email],
                ["Destination", wedding.destination],
                ["Primary venue", wedding.primary_venue],
                ["Tradition", wedding.tradition || "Not specified"],
                ["Regional customs", wedding.regional_customization || "Not specified"],
                ["Planned guests", String(wedding.guest_estimate)],
                ["Planned budget", formatINR(wedding.budget_allocated)],
                ["Assigned planner", wedding.assigned_planner_name || wedding.assigned_planner_email || "Unassigned"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="block text-muted-foreground">{label}</span>
                  <span className="font-semibold text-forest-900">{value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="space-y-3 p-6">
            <h2 className="font-serif text-lg font-bold text-forest-900">At a glance</h2>
            {[
              ["Events", String(events.length)],
              ["Tasks complete", `${tasks.filter((task) => task.status === "done").length} of ${tasks.length}`],
              ["Guest records", String(guests.length)],
              ["RSVPs confirmed", String(confirmedGuests)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-border/60 py-1.5 text-xs last:border-b-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-forest-900">{value}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Functions saved for this wedding.</p>
            <Button variant="gold" size="sm" onClick={openAddEvent}><Plus className="mr-1 h-4 w-4" /> Add event</Button>
          </div>
          {events.length === 0 ? (
            <Card className="p-8 text-center"><h2 className="font-serif text-xl font-semibold text-forest-900">No events yet</h2><p className="mt-2 text-sm text-muted-foreground">Add the first ceremony or celebration.</p></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between">
                      <Badge status={event.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-lg font-bold text-forest-900">{event.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-forest-700"><MapPin className="h-3.5 w-3.5 text-gold-700" /> {event.venue_hall} • {event.guest_estimate} guests</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-gold-700" /> {event.start_time} - {event.end_time}</p>
                    {event.notes && <p className="mt-3 rounded-lg bg-ivory-100 p-2.5 text-xs text-forest-800">{event.notes}</p>}
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-border/60 pt-3">
                    <button type="button" onClick={() => openEditEvent(event)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-forest-800 hover:bg-ivory-100"><Pencil className="h-3 w-3" /> Edit</button>
                    <button type="button" onClick={() => void deleteEvent(event)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <Card className="overflow-hidden p-0">
          <CardHeader>
            <h2 className="font-serif text-base font-bold text-forest-900">Planning tasks</h2>
            <span className="text-xs text-muted-foreground">{tasks.filter((task) => task.status === "done").length} of {tasks.length} completed</span>
          </CardHeader>
          <div className="divide-y divide-border/60">
            {tasks.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No tasks have been generated for this wedding.</p>
            ) : tasks.map((task) => (
              <div key={task.id} className={`flex items-center justify-between p-4 text-xs hover:bg-ivory-50/60 ${task.status === "done" ? "bg-ivory-50/30 opacity-75" : ""}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={task.status === "done"} onChange={() => void toggleTask(task)} className="h-4 w-4 cursor-pointer rounded text-forest-800" aria-label={`Mark ${task.title} complete`} />
                  <div>
                    <p className={`font-semibold ${task.status === "done" ? "text-muted-foreground line-through" : "text-forest-900"}`}>{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{task.category} • Owner: {task.owner} • Due {formatDate(task.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={task.priority} />
                  <Badge status={task.status} />
                  <button type="button" onClick={() => void deleteTask(task)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Delete task">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "guests" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guests" className="input-base py-2 pl-9 text-xs" />
              </div>
              <select value={rsvpFilter} onChange={(event) => setRsvpFilter(event.target.value)} className="input-base w-auto py-2 text-xs">
                <option value="all">All RSVPs</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <Button variant="gold" size="sm" onClick={openAddGuest}><Plus className="mr-1 h-4 w-4" /> Add guest</Button>
          </div>
          <p className="text-xs text-muted-foreground">Planned guest estimate: <strong>{wedding.guest_estimate}</strong>. Guest records: <strong>{guests.length}</strong>.</p>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/80 bg-ivory-100 font-semibold uppercase tracking-wider text-forest-800">
                  <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">RSVP</th><th className="px-4 py-3">Side</th><th className="px-4 py-3">Plus ones</th><th className="px-4 py-3">Table</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredGuests.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{guests.length === 0 ? "No guests recorded yet." : "No guests match these filters."}</td></tr>
                  ) : filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-ivory-50/70">
                      <td className="px-4 py-3"><p className="font-bold text-forest-900">{guest.name}</p>{guest.email && <p className="text-[11px] text-muted-foreground">{guest.email}</p>}</td>
                      <td className="px-4 py-3"><Badge status={guest.rsvp_status} /></td>
                      <td className="px-4 py-3 capitalize text-forest-700">{guest.side}</td>
                      <td className="px-4 py-3 text-forest-900">{guest.plus_ones}</td>
                      <td className="px-4 py-3 font-mono text-forest-800">{guest.table_number || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => openEditGuest(guest)} className="p-1 text-forest-700 hover:bg-ivory-100" title="Edit guest"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void deleteGuest(guest)} className="p-1 text-rose-600 hover:bg-rose-50" title="Remove guest"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "finance" && isAdmin && (
        finSummary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4"><span className="text-xs font-semibold uppercase text-muted-foreground">Contract value</span><p className="mt-1 font-serif text-2xl font-bold text-forest-900">{formatINR(finSummary.total_contract_value)}</p></Card>
            <Card className="p-4"><span className="text-xs font-semibold uppercase text-muted-foreground">Client received</span><p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{formatINR(finSummary.client_paid_amount)}</p><p className="mt-1 text-[11px] text-muted-foreground">Outstanding: {formatINR(finSummary.client_outstanding_receivable)}</p></Card>
            <Card className="p-4"><span className="text-xs font-semibold uppercase text-muted-foreground">Actual expenses</span><p className="mt-1 font-serif text-2xl font-bold text-amber-700">{formatINR(finSummary.actual_vendor_bills_total)}</p><p className="mt-1 text-[11px] text-muted-foreground">Payables: {formatINR(finSummary.vendor_outstanding_payable)}</p></Card>
            <Card className="border-emerald-200 bg-emerald-50/50 p-4"><span className="text-xs font-semibold uppercase text-emerald-800">Net profit</span><p className="mt-1 font-serif text-2xl font-bold text-emerald-900">{formatINR(finSummary.net_agency_profit)}</p><p className="mt-1 text-[11px] font-bold text-emerald-800">Margin: {finSummary.profit_margin_percentage.toFixed(1)}%</p></Card>
          </div>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">No financial summary is available for this wedding.</Card>
        )
      )}

      <Modal isOpen={eventModalOpen} onClose={() => setEventModalOpen(false)} title={editingEventId ? "Edit event" : "Add event"} subtitle={`Dates must stay within ${wedding.start_date} and ${wedding.end_date}.`}>
        <form onSubmit={saveEvent} className="space-y-3.5 text-xs">
          <label className="label-base">Event name<input required maxLength={120} value={eventDraft.name} onChange={(event) => setEventDraft({ ...eventDraft, name: event.target.value })} className="input-base mt-1" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label-base">Date<input required type="date" min={wedding.start_date} max={wedding.end_date} value={eventDraft.date} onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Venue<input required maxLength={200} value={eventDraft.venue_hall} onChange={(event) => setEventDraft({ ...eventDraft, venue_hall: event.target.value })} className="input-base mt-1" /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="label-base">Starts<input required type="time" value={eventDraft.start_time} onChange={(event) => setEventDraft({ ...eventDraft, start_time: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Ends<input required type="time" value={eventDraft.end_time} onChange={(event) => setEventDraft({ ...eventDraft, end_time: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Guests<input type="number" min={1} value={eventDraft.guest_estimate} onChange={(event) => setEventDraft({ ...eventDraft, guest_estimate: Number(event.target.value) })} className="input-base mt-1" /></label>
          </div>
          <label className="label-base">Notes<textarea rows={2} maxLength={2000} value={eventDraft.notes} onChange={(event) => setEventDraft({ ...eventDraft, notes: event.target.value })} className="input-base mt-1" /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setEventModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" isLoading={busy}>{editingEventId ? "Save changes" : "Add event"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={manageOpen} onClose={() => setManageOpen(false)} title="Manage wedding" subtitle="Founder-only changes are saved to the existing SQLite wedding record.">
        <form onSubmit={saveManagedWedding} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="label-base">Wedding title<input required maxLength={200} value={manageDraft.title} onChange={(event) => setManageDraft({ ...manageDraft, title: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Status<select value={manageDraft.status} onChange={(event) => setManageDraft({ ...manageDraft, status: event.target.value })} className="input-base mt-1"><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="settled">Settled</option></select></label>
            <label className="label-base">Partner one<input required maxLength={120} value={manageDraft.bride_name} onChange={(event) => setManageDraft({ ...manageDraft, bride_name: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Partner two<input required maxLength={120} value={manageDraft.groom_name} onChange={(event) => setManageDraft({ ...manageDraft, groom_name: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Contact phone<input required maxLength={40} value={manageDraft.contact_phone} onChange={(event) => setManageDraft({ ...manageDraft, contact_phone: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Contact email<input required type="email" maxLength={254} value={manageDraft.contact_email} onChange={(event) => setManageDraft({ ...manageDraft, contact_email: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Destination<input required maxLength={160} value={manageDraft.destination} onChange={(event) => setManageDraft({ ...manageDraft, destination: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Primary venue<input required maxLength={200} value={manageDraft.primary_venue} onChange={(event) => setManageDraft({ ...manageDraft, primary_venue: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Start date<input required type="date" value={manageDraft.start_date} onChange={(event) => setManageDraft({ ...manageDraft, start_date: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">End date<input required type="date" min={manageDraft.start_date || undefined} value={manageDraft.end_date} onChange={(event) => setManageDraft({ ...manageDraft, end_date: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Planned guests<input required type="number" min={1} value={manageDraft.guest_estimate} onChange={(event) => setManageDraft({ ...manageDraft, guest_estimate: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Planned budget (INR)<input required type="number" min={0} step="0.01" value={manageDraft.budget_allocated} onChange={(event) => setManageDraft({ ...manageDraft, budget_allocated: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Client package fee (INR)<input type="number" min={0} step="0.01" value={manageDraft.package_fee} onChange={(event) => setManageDraft({ ...manageDraft, package_fee: event.target.value })} className="input-base mt-1" /><span className="mt-1 block text-[11px] text-muted-foreground">Separate from the planning budget; feeds revenue totals.</span></label>
            <label className="label-base">Theme<input maxLength={160} value={manageDraft.theme} onChange={(event) => setManageDraft({ ...manageDraft, theme: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Tradition<input maxLength={120} value={manageDraft.tradition} onChange={(event) => setManageDraft({ ...manageDraft, tradition: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base sm:col-span-2">Regional or family customs<textarea rows={2} maxLength={500} value={manageDraft.regional_customization} onChange={(event) => setManageDraft({ ...manageDraft, regional_customization: event.target.value })} className="input-base mt-1" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setManageOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" isLoading={busy}>Save wedding</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={guestModalOpen} onClose={() => setGuestModalOpen(false)} title={editingGuestId ? "Edit guest" : "Add guest"}>
        <form onSubmit={saveGuest} className="space-y-3.5 text-xs">
          <label className="label-base">Guest name<input required maxLength={160} value={guestDraft.name} onChange={(event) => setGuestDraft({ ...guestDraft, name: event.target.value })} className="input-base mt-1" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label-base">Email<input type="email" maxLength={254} value={guestDraft.email || ""} onChange={(event) => setGuestDraft({ ...guestDraft, email: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Phone<input type="tel" maxLength={40} value={guestDraft.phone || ""} onChange={(event) => setGuestDraft({ ...guestDraft, phone: event.target.value })} className="input-base mt-1" /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="label-base">Side<select value={guestDraft.side} onChange={(event) => setGuestDraft({ ...guestDraft, side: event.target.value as GuestDraft["side"] })} className="input-base mt-1"><option value="bride">Bride</option><option value="groom">Groom</option><option value="mutual">Mutual</option></select></label>
            <label className="label-base">RSVP<select value={guestDraft.rsvp_status} onChange={(event) => setGuestDraft({ ...guestDraft, rsvp_status: event.target.value as GuestDraft["rsvp_status"] })} className="input-base mt-1"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option></select></label>
            <label className="label-base">Plus ones<input type="number" min={0} max={20} value={guestDraft.plus_ones} onChange={(event) => setGuestDraft({ ...guestDraft, plus_ones: Number(event.target.value) })} className="input-base mt-1" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="label-base">Meal preference<input maxLength={160} value={guestDraft.meal_preference || ""} onChange={(event) => setGuestDraft({ ...guestDraft, meal_preference: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Table<input maxLength={80} value={guestDraft.table_number || ""} onChange={(event) => setGuestDraft({ ...guestDraft, table_number: event.target.value })} className="input-base mt-1" /></label>
          </div>
          <label className="label-base">Notes<textarea rows={2} maxLength={2000} value={guestDraft.notes || ""} onChange={(event) => setGuestDraft({ ...guestDraft, notes: event.target.value })} className="input-base mt-1" /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setGuestModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" isLoading={busy}>{editingGuestId ? "Save changes" : "Add guest"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
