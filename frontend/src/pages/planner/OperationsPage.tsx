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
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { OperationsOverview, ScheduleItemCreate, OperationalIssue, Wedding } from "@/types";
import { formatDateTime } from "@/lib/utils";

export const OperationsPage: React.FC = () => {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
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

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      const savedId = localStorage.getItem("active_wedding_id");
      if (savedId && list.some((w) => w.id === savedId)) {
        setWeddingId(savedId);
      } else if (list.length > 0) {
        setWeddingId(list[0].id);
      }
    });
  }, []);

  const loadOperations = (wid: string) => {
    setIsLoading(true);
    services.operations
      .getOverview(wid)
      .then((data) => setOverview(data))
      .catch((err) => {
        console.error(err);
        setOverview(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (weddingId) {
      loadOperations(weddingId);
    }
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
    const eventId = overview?.events_today?.[0]?.id || "evt-default";
    try {
      await services.operations.addScheduleItem(weddingId, eventId, newSlot);
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
    const eventId = overview?.events_today?.[0]?.id || "evt-default";
    try {
      await services.operations.reportIssue({
        wedding_id: weddingId,
        event_id: eventId,
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

        <div className="flex flex-wrap items-center gap-2">
          {weddings.length > 0 && (
            <select
              className="input-base py-1.5 text-xs w-auto font-medium"
              value={weddingId}
              onChange={(e) => setWeddingId(e.target.value)}
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          )}

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
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading day-of command center...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Incidents Alert Banner */}
          {overview.active_issues.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                  <h3 className="font-serif text-base font-bold text-rose-950">
                    Active On-Site Operational Incidents ({overview.active_issues.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-200/60 px-2 py-0.5 rounded">
                  Requires Lead Planner Action
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overview.active_issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-white rounded-xl border border-rose-200 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <Badge status={issue.severity} />
                        <span className="text-[10px] text-muted-foreground">Owner: {issue.owner}</span>
                      </div>
                      <h4 className="font-bold text-forest-900 text-xs mt-1.5">{issue.title}</h4>
                      {issue.action_taken && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Current mitigation: {issue.action_taken}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{formatDateTime(issue.created_at)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResolveTarget(issue);
                          setResolutionAction(issue.action_taken || "");
                        }}
                        className="text-xs h-7 px-2 font-bold text-emerald-800 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Mark Resolved
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minute-by-Minute Timeline Card */}
          <Card className="p-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-ivory-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-forest-900">
                  Minute-by-Minute Ceremony Cue Sheet
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Official stage call sheet with responsible coordinators and physical locations.
                </p>
              </div>
              <span className="text-xs font-bold text-forest-800 bg-gold/20 px-2.5 py-0.5 rounded-full border border-gold/30">
                {overview.schedule.length} Timeline Cues
              </span>
            </CardHeader>

            <div className="divide-y divide-border/60 text-xs">
              {overview.schedule.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No timeline slots scheduled for this wedding yet. Click "Add Timeline Slot" above to begin.
                </div>
              ) : (
                overview.schedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 shrink-0 font-mono text-sm font-bold text-gold-900 bg-gold/15 px-2 py-1 rounded-lg text-center border border-gold/30">
                        {slot.time_slot}
                      </div>
                      <div>
                        <h4 className="font-bold text-forest-900 text-sm">{slot.title}</h4>
                        {slot.description && <p className="text-muted-foreground mt-0.5">{slot.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-forest-700">
                          <span className="flex items-center gap-1 font-semibold">
                            <Users className="w-3 h-3 text-gold-700" />
                            {slot.responsible_person}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gold-700" />
                            {slot.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        className="input-base py-1 px-2 text-xs w-auto font-medium"
                        value={slot.status}
                        onChange={(e) => handleUpdateScheduleStatus(slot.id, e.target.value)}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Vendor Arrivals & Ingress Tracking */}
          <Card className="p-0 overflow-hidden shadow-sm">
            <CardHeader className="bg-ivory-100/60 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-forest-900">
                  Supplier Call Times & Loading Dock Check-In
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Real-time vendor arrival telemetry to prevent ceremony delays.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {overview.vendor_arrivals.filter((a) => a.status === "arrived").length} / {overview.vendor_arrivals.length} Arrived
              </span>
            </CardHeader>

            <div className="divide-y divide-border/60 text-xs">
              {overview.vendor_arrivals.map((arrival) => (
                <div
                  key={arrival.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ivory-200 text-forest-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-4 h-4 text-gold-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest-900 text-sm">{arrival.vendor_name}</h4>
                      <p className="text-muted-foreground text-[11px]">
                        Call Time Target: <strong className="text-forest-900 font-mono">{arrival.planned_arrival_time}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge status={arrival.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── ADD TIMELINE SLOT MODAL ── */}
      <Modal
        isOpen={isAddScheduleOpen}
        onClose={() => setIsAddScheduleOpen(false)}
        title="Add Execution Timeline Slot"
      >
        <form onSubmit={handleAddSlot} className="space-y-3.5 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Time Slot (HH:MM)</label>
              <input
                type="text"
                required
                placeholder="e.g. 19:30"
                className="input-base font-mono"
                value={newSlot.time_slot}
                onChange={(e) => setNewSlot({ ...newSlot, time_slot: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Physical Location / Hall</label>
              <input
                type="text"
                required
                placeholder="e.g. Chandra Mahal Courtyard"
                className="input-base"
                value={newSlot.location}
                onChange={(e) => setNewSlot({ ...newSlot, location: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Timeline Action / Milestone Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Groom Vintage Baraat Procession Departs from Gate 2"
              className="input-base"
              value={newSlot.title}
              onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Responsible Coordinator</label>
            <input
              type="text"
              required
              placeholder="e.g. Rohan Joshi (Floor Lead)"
              className="input-base"
              value={newSlot.responsible_person}
              onChange={(e) => setNewSlot({ ...newSlot, responsible_person: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Description & Cue Notes</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Cue live dhol players and release security barricades."
              value={newSlot.description}
              onChange={(e) => setNewSlot({ ...newSlot, description: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" className="font-bold">
              Add Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── REPORT ISSUE MODAL ── */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Report On-Site Operational Incident"
      >
        <form onSubmit={handleReportIssue} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="label-base">Incident Summary</label>
            <input
              type="text"
              required
              placeholder="e.g. Mandap floral arch generator trip detected"
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
                <option value="low">Low (Cosmetic / Delay &lt; 10m)</option>
                <option value="medium">Medium (Requires attention)</option>
                <option value="high">High (Immediate intervention)</option>
                <option value="urgent">Urgent / Critical blocker</option>
              </select>
            </div>
            <div>
              <label className="label-base">Assigned Lead</label>
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
            <label className="label-base">Immediate Action Taken</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Switched to standby acoustic 500kVA generator truck."
              value={newIssue.action_taken}
              onChange={(e) => setNewIssue({ ...newIssue, action_taken: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" className="font-bold">
              File Incident
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── RESOLVE ISSUE MODAL ── */}
      {resolveTarget && (
        <Modal
          isOpen={!!resolveTarget}
          onClose={() => setResolveTarget(null)}
          title="Resolve Operational Incident"
        >
          <form onSubmit={handleResolveIssue} className="space-y-3.5 text-xs font-sans">
            <p className="text-muted-foreground">
              Confirm resolution for incident: <strong>{resolveTarget.title}</strong>
            </p>
            <div>
              <label className="label-base">Final Resolution Notes</label>
              <textarea
                rows={3}
                required
                className="input-base"
                placeholder="e.g. Generator circuit breaker replaced. Acoustic sound levels verified."
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
              />
            </div>
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setResolveTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" size="sm" className="font-bold">
                Confirm Resolved
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
