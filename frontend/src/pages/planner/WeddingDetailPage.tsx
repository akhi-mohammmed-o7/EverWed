import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  DollarSign,
  Building2,
  Clock,
  Plus,
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Wedding, WeddingEvent, Task, Quote, FinancialSummary, EventCreate } from "@/types";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";

export const WeddingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [finSummary, setFinSummary] = useState<FinancialSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "tasks" | "quotes" | "finance">("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Add Event Modal
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<EventCreate>({
    name: "",
    date: "2026-12-10",
    start_time: "16:00",
    end_time: "20:00",
    venue_hall: "Central Palace Garden",
    coordinator_name: "Pooja Verma",
    guest_estimate: 400,
    notes: "",
  });

  const loadAllData = async (wid: string) => {
    setIsLoading(true);
    try {
      const [w, evts, tsks, qts, fin] = await Promise.all([
        services.weddings.get(wid),
        services.events.listForWedding(wid),
        services.tasks.list(wid),
        services.quotes.list(wid),
        services.finance.getFinancialSummary(wid).catch(() => null),
      ]);
      setWedding(w);
      setEvents(evts);
      setTasks(tsks);
      setQuotes(qts);
      setFinSummary(fin);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAllData(id);
    }
  }, [id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newEvent.name.trim()) return;
    try {
      await services.events.create(id, newEvent);
      setIsAddEventOpen(false);
      const evts = await services.events.listForWedding(id);
      setEvents(evts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "in_progress" : "done";
    try {
      await services.tasks.update(taskId, { status: newStatus });
      if (id) {
        const tsks = await services.tasks.list(id);
        setTasks(tsks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !wedding) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading wedding workspace...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/planner/weddings" className="text-xs font-semibold text-gold-800 hover:underline flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Weddings Portfolio
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">{wedding.title}</h1>
            <Badge status={wedding.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {wedding.primary_venue} • {wedding.guest_estimate} Guests • {formatDate(wedding.start_date)} - {formatDate(wedding.end_date)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/planner/operations">
            <Button variant="gold" size="sm" className="font-bold">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Day-of Command
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white rounded-t-2xl px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: "overview", label: "Overview & Contacts", icon: Sparkles },
          { key: "events", label: `Events (${events.length})`, icon: Calendar },
          { key: "tasks", label: `Tasks (${tasks.length})`, icon: CheckCircle2 },
          { key: "quotes", label: `Vendor Quotes (${quotes.length})`, icon: Building2 },
          { key: "finance", label: "Financial Health", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-forest-800 text-forest-900 font-bold"
                  : "border-transparent text-muted-foreground hover:text-forest-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold-700" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 space-y-5">
            <h3 className="font-serif text-lg font-bold text-forest-900">Couple & Wedding Specifications</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Bride</span>
                <span className="font-bold text-forest-900 text-sm">{wedding.bride_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Groom</span>
                <span className="font-bold text-forest-900 text-sm">{wedding.groom_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Contact Phone</span>
                <span className="font-medium text-forest-900">{wedding.contact_phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Contact Email</span>
                <span className="font-medium text-forest-900">{wedding.contact_email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Destination</span>
                <span className="font-medium text-forest-900">{wedding.destination}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Primary Venue</span>
                <span className="font-medium text-forest-900">{wedding.primary_venue}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Package Tier</span>
                <span className="font-medium text-forest-900">{wedding.package_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Allocated Budget</span>
                <span className="font-bold font-serif text-forest-900 text-sm">{formatINR(wedding.budget_allocated)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-forest-900">Operations Snapshot</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Total Events:</span>
                <span className="font-bold text-forest-900">{events.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Checklist Tasks:</span>
                <span className="font-bold text-forest-900">
                  {wedding.tasks_completed} / {tasks.length} Done
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Client Paid:</span>
                <span className="font-bold text-emerald-700">{formatINR(wedding.total_paid_by_client)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">Vendor Expenses:</span>
                <span className="font-bold text-amber-700">{formatINR(wedding.total_paid_to_vendors)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: EVENTS */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Multi-day itinerary schedule and assigned leads.</p>
            <Button variant="gold" size="sm" onClick={() => setIsAddEventOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Ceremony
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <Card key={ev.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Badge status={ev.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(ev.date)}</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest-900 mt-2">{ev.name}</h4>
                  <p className="text-xs text-forest-700 mt-1">
                    <MapPin className="w-3.5 h-3.5 inline text-gold-700 mr-1" />
                    {ev.venue_hall} • {ev.guest_estimate} Guests
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="w-3.5 h-3.5 inline text-gold-700 mr-1" />
                    {ev.start_time} - {ev.end_time} • Lead Coordinator: {ev.coordinator_name}
                  </p>
                  {ev.notes && <p className="text-xs bg-ivory-100 p-2.5 rounded-lg mt-3 text-forest-800">{ev.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS */}
      {activeTab === "tasks" && (
        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <h3 className="font-serif text-base font-bold text-forest-900">
              Operational Tasks & 25+ Luxury Protocol Checklist
            </h3>
            <span className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === "done").length} of {tasks.length} Completed
            </span>
          </CardHeader>
          <div className="divide-y divide-border/60">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 flex items-center justify-between text-xs hover:bg-ivory-50/60 transition-colors ${
                  task.status === "done" ? "opacity-75 bg-ivory-50/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "done"}
                    onChange={() => handleToggleTask(task.id, task.status)}
                    className="w-4 h-4 rounded text-forest-800 focus:ring-gold/60 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${task.status === "done" ? "line-through text-muted-foreground" : "text-forest-900"}`}>
                        {task.title}
                      </span>
                      <Badge status={task.priority} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {task.category} • Assignee: {task.owner} • Due: {formatDate(task.due_date)}
                    </p>
                  </div>
                </div>
                <Badge status={task.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB CONTENT: QUOTES */}
      {activeTab === "quotes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Approved and submitted vendor quotations for this wedding.</p>
            <Link to={`/planner/quotes?wedding_id=${wedding.id}`}>
              <Button variant="gold" size="sm">
                Open Quote Comparison Engine
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q) => (
              <Card key={q.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Badge status={q.status} />
                    <span className="text-xs font-semibold text-gold-800 bg-gold/10 px-2.5 py-0.5 rounded-full">
                      {q.vendor_category}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest-900 mt-2">{q.vendor_name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{q.scope_of_work}</p>

                  <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-baseline text-xs">
                    <span className="text-muted-foreground">
                      {q.pricing_type === "per_plate" ? `${formatINR(q.unit_price)} / plate` : "Fixed Rate"}
                    </span>
                    <span className="font-serif text-lg font-bold text-forest-900">
                      {formatINR(q.normalized_total)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FINANCE */}
      {activeTab === "finance" && finSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Contract Value</span>
              <p className="font-serif text-2xl font-bold text-forest-900 mt-1">{formatINR(finSummary.total_contract_value)}</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Client Collected</span>
              <p className="font-serif text-2xl font-bold text-emerald-700 mt-1">{formatINR(finSummary.client_paid_amount)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Outstanding: {formatINR(finSummary.client_outstanding_receivable)}</p>
            </Card>
            <Card className="p-4">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Actual Expenses</span>
              <p className="font-serif text-2xl font-bold text-amber-700 mt-1">{formatINR(finSummary.actual_vendor_bills_total || finSummary.agreed_vendor_total)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Vendor Payables: {formatINR(finSummary.vendor_outstanding_payable)}</p>
            </Card>
            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <span className="text-xs text-emerald-800 uppercase font-semibold">Net Agency Profit</span>
              <p className="font-serif text-2xl font-bold text-emerald-900 mt-1">{formatINR(finSummary.net_agency_profit)}</p>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">Margin: {finSummary.profit_margin_percentage.toFixed(1)}%</p>
            </Card>
          </div>

          <div className="flex justify-end">
            <Link to="/planner/finance">
              <Button variant="secondary" size="sm">
                View Detailed Invoices & Payments <DollarSign className="w-4 h-4 ml-1 text-gold-700" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Add Ceremony Modal */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title="Add Itinerary Ceremony"
        subtitle={`Schedule an additional event for ${wedding.title}`}
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Ceremony / Event Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sangeet & Cocktail Soirée"
              className="input-base"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Date</label>
              <input
                type="date"
                required
                className="input-base"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Guest Count</label>
              <input
                type="number"
                className="input-base"
                value={newEvent.guest_estimate}
                onChange={(e) => setNewEvent({ ...newEvent, guest_estimate: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Start Time</label>
              <input
                type="text"
                className="input-base"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">End Time</label>
              <input
                type="text"
                className="input-base"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Venue Hall</label>
              <input
                type="text"
                className="input-base"
                value={newEvent.venue_hall}
                onChange={(e) => setNewEvent({ ...newEvent, venue_hall: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Coordinator Name</label>
              <input
                type="text"
                className="input-base"
                value={newEvent.coordinator_name}
                onChange={(e) => setNewEvent({ ...newEvent, coordinator_name: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Save Ceremony
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
