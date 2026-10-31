import React, { useEffect, useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Users,
  MapPin,
  Truck,
  Phone,
  Flame,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { OperationsOverview, ScheduleItemCreate, OperationalIssue } from "@/types";
import { formatDateTime } from "@/lib/utils";

export const OperationsPage: React.FC = () => {
  const [weddingId, setWeddingId] = useState<string>("wed-royal-jaipur-001");
  const [overview, setOverview] = useState<OperationsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Schedule Slot Modal
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<ScheduleItemCreate>({
    time_slot: "18:00",
    title: "",
    description: "",
    responsible_person: "Pooja Verma",
    location: "Courtyard",
  });

  // Report Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    severity: "medium",
    owner: "Rohan Joshi",
    action_taken: "",
  });

  // Resolve Modal
  const [resolveTarget, setResolveTarget] = useState<OperationalIssue | null>(null);
  const [resolutionAction, setResolutionAction] = useState("");

  const loadOperations = (wid: string) => {
    setIsLoading(true);
    services.operations
      .getOverview(wid)
      .then((data) => setOverview(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOperations(weddingId);
  }, [weddingId]);

  const handleUpdateScheduleStatus = async (itemId: string, status: string) => {
    try {
      await services.operations.updateScheduleItem(itemId, { status: status as any });
      loadOperations(weddingId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overview?.events_today?.[0]?.id) return;
    try {
      await services.operations.addScheduleItem(weddingId, overview.events_today[0].id, newSlot);
      setIsAddScheduleOpen(false);
      setNewSlot({
        time_slot: "18:00",
        title: "",
        description: "",
        responsible_person: "Pooja Verma",
        location: "Courtyard",
      });
      loadOperations(weddingId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overview?.events_today?.[0]?.id) return;
    try {
      await services.operations.reportIssue({
        wedding_id: weddingId,
        event_id: overview.events_today[0].id,
        ...newIssue,
      });
      setIsIssueModalOpen(false);
      setNewIssue({ title: "", severity: "medium", owner: "Rohan Joshi", action_taken: "" });
      loadOperations(weddingId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;
    try {
      await services.operations.resolveIssue(resolveTarget.id, resolutionAction);
      setResolveTarget(null);
      setResolutionAction("");
      loadOperations(weddingId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
            Live On-Site Command
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Day-of Operations & Incident Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Minute-by-minute ceremony timeline execution, live vendor arrival status, and real-time on-site incident resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={() => setIsIssueModalOpen(true)} className="font-bold">
            <Flame className="w-3.5 h-3.5 mr-1" />
            Report Incident
          </Button>
          <Button variant="gold" size="sm" onClick={() => setIsAddScheduleOpen(true)} className="font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Timeline Slot
          </Button>
        </div>
      </div>

      {isLoading || !overview ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading day-of command center...</div>
      ) : (
        <div className="space-y-6">
          {/* Active Incidents Alert Banner */}
          {overview.active_issues.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                  <h3 className="font-serif text-base font-bold text-rose-950">
                    Active On-Site Operational Incidents ({overview.active_issues.length})
                  </h3>
                </div>
                <span className="text-xs text-rose-700 font-semibold">Immediate resolution required</span>
              </div>

              <div className="space-y-2">
                {overview.active_issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 bg-white rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge status={issue.severity} />
                        <span className="font-bold text-forest-900 text-sm">{issue.title}</span>
                      </div>
                      <p className="text-muted-foreground mt-1">
                        Reported Owner: <strong>{issue.owner}</strong> • Status: {issue.status}
                      </p>
                    </div>

                    <Button
                      variant="gold"
                      size="sm"
                      className="font-bold text-xs shrink-0 self-start sm:self-center"
                      onClick={() => setResolveTarget(issue)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Document Resolution
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-Column Grid: Timeline and Vendor Arrivals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Minute-by-Minute Ceremony Timeline */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-0 overflow-hidden shadow-sm">
                <CardHeader className="bg-ivory-100/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold-800" />
                    <h3 className="font-serif text-base font-bold text-forest-900">Minute-by-Minute Timeline</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {overview.schedule.length} Timeline Milestones
                  </span>
                </CardHeader>

                <div className="divide-y divide-border/60">
                  {overview.schedule.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-ivory-50/60 transition-colors flex items-start gap-4 text-xs">
                      {/* Time badge */}
                      <span className="px-2.5 py-1 rounded-lg bg-forest-900 text-gold font-bold font-mono text-xs shrink-0">
                        {item.time_slot}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-serif text-sm font-bold text-forest-900 truncate">{item.title}</h4>
                          <Badge status={item.status} />
                        </div>
                        {item.description && <p className="text-muted-foreground mt-0.5">{item.description}</p>}

                        <div className="flex items-center gap-4 text-[11px] text-forest-700 mt-2 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gold-700" /> {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gold-700" /> {item.responsible_person}
                          </span>
                        </div>

                        {/* Status selector */}
                        <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Update:</span>
                          {["pending", "in_progress", "completed", "delayed"].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateScheduleStatus(item.id, st)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                                item.status === st
                                  ? "bg-forest-800 text-ivory"
                                  : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Vendor Check-in & Arrival Tracker */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-0 overflow-hidden shadow-sm">
                <CardHeader className="bg-ivory-100/50">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gold-800" />
                    <h3 className="font-serif text-base font-bold text-forest-900">Vendor Arrival Gate Tracker</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Real-Time Check-In</span>
                </CardHeader>

                <div className="p-4 space-y-3">
                  {overview.vendor_arrivals.map((arr) => {
                    const isLate = arr.delay_minutes > 15;
                    return (
                      <div
                        key={arr.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all ${
                          isLate
                            ? "border-rose-300 bg-rose-50/50"
                            : arr.status === "arrived"
                            ? "border-emerald-300 bg-emerald-50/30"
                            : "border-border bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-serif text-sm font-bold text-forest-900">{arr.vendor_name}</h4>
                            <span className="text-[11px] text-muted-foreground">{arr.service_category}</span>
                          </div>
                          <Badge status={arr.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-ivory-100/60 p-2 rounded-lg">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Planned Arrival:</span>
                            <span className="font-bold text-forest-900">{arr.planned_arrival_time}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Actual Arrival:</span>
                            <span className="font-bold text-forest-900">{arr.actual_arrival_time || "Pending gate check"}</span>
                          </div>
                        </div>

                        {arr.delay_minutes > 0 && (
                          <p className="text-[11px] font-bold text-rose-700 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Delayed by {arr.delay_minutes} minutes
                          </p>
                        )}

                        {arr.notes && <p className="text-[11px] text-forest-800 italic mt-1.5">"{arr.notes}"</p>}

                        {arr.contact_phone && (
                          <div className="mt-2.5 pt-2 border-t border-border/50 text-[11px] flex items-center justify-between text-forest-700">
                            <span>Phone Liaison:</span>
                            <a href={`tel:${arr.contact_phone}`} className="font-bold text-gold-900 hover:underline">
                              {arr.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Item Modal */}
      <Modal
        isOpen={isAddScheduleOpen}
        onClose={() => setIsAddScheduleOpen(false)}
        title="Add Minute-by-Minute Ceremony Slot"
        subtitle="Schedule key wedding moments like Baraat procession, Varmala, Cake cutting, or Grand Fireworks."
      >
        <form onSubmit={handleAddSlot} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Time Slot (HH:MM)</label>
            <input
              type="text"
              required
              placeholder="e.g. 17:30"
              className="input-base"
              value={newSlot.time_slot}
              onChange={(e) => setNewSlot({ ...newSlot, time_slot: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Timeline Milestone Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Varmala Floral Garland Exchange & Cold Pyro"
              className="input-base"
              value={newSlot.title}
              onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Location / Palace Hall</label>
            <input
              type="text"
              required
              placeholder="Sarvato Bhadra Mandap"
              className="input-base"
              value={newSlot.location}
              onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Responsible Coordinator / Lead</label>
            <input
              type="text"
              required
              className="input-base"
              value={newSlot.responsible_person}
              onChange={(e) => setNewSlot({ ...newSlot, responsible_person: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Description / Special Instructions</label>
            <textarea
              rows={2}
              className="input-base"
              value={newSlot.description}
              onChange={(e) => setNewSlot({ ...newSlot, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Insert Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Incident Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Report On-Site Operational Incident"
        subtitle="Immediate logging for electrical, floral, weather, or vendor timing issues."
      >
        <form onSubmit={handleReportIssue} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Incident Summary</label>
            <input
              type="text"
              required
              placeholder="e.g. Line array audio drop on main stage"
              className="input-base"
              value={newIssue.title}
              onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Severity Level</label>
              <select
                className="input-base"
                value={newIssue.severity}
                onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical / Emergency</option>
              </select>
            </div>
            <div>
              <label className="label-base">Assigned Owner</label>
              <input
                type="text"
                required
                className="input-base"
                value={newIssue.owner}
                onChange={(e) => setNewIssue({ ...newIssue, owner: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Initial Action Taken</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Switched to auxiliary console; audio engineer investigating"
              value={newIssue.action_taken}
              onChange={(e) => setNewIssue({ ...newIssue, action_taken: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Log Urgent Issue
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Incident Modal */}
      <Modal
        isOpen={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title="Document Incident Resolution"
        subtitle={`Closing issue: "${resolveTarget?.title}"`}
      >
        <form onSubmit={handleResolveIssue} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Resolution Action Documentation (Required)</label>
            <textarea
              rows={3}
              required
              placeholder="Document the exact corrective action taken to restore operational safety..."
              className="input-base"
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setResolveTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="font-bold">
              Mark Resolved
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

