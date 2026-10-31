import React, { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Task, TaskCreate, Wedding, WeddingEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { TASK_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWid, setSelectedWid] = useState<string>("");
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskCreate>({
    title: "",
    category: "Planning",
    owner: user?.name || "",
    due_date: today(),
    priority: "medium",
    event_id: "",
    notes: "",
  });

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      const savedId = localStorage.getItem("active_wedding_id");
      setSelectedWid((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        if (savedId && list.some((w) => w.id === savedId)) return savedId;
        return list[0]?.id || "";
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeddingEvents = (wid: string) => {
    services.events
      .listForWedding(wid)
      .then((evtList) => setEvents(evtList))
      .catch((err) => console.error(err));
  };

  const loadTasks = (wid: string) => {
    setIsLoading(true);
    services.tasks
      .list(wid, {
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
      })
      .then((data) => setTasks(data))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load tasks."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedWid) {
      loadWeddingEvents(selectedWid);
      loadTasks(selectedWid);
    }
  }, [selectedWid, statusFilter, priorityFilter, categoryFilter]);

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "in_progress" : "done";
    setError("");
    try {
      await services.tasks.update(taskId, { status: next });
      loadTasks(selectedWid);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this task.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWid || !newTask.title.trim()) return;
    setError("");
    try {
      if (editingTaskId) {
        await services.tasks.update(editingTaskId, {
          title: newTask.title,
          category: newTask.category,
          owner: newTask.owner,
          due_date: newTask.due_date,
          priority: newTask.priority,
          event_id: newTask.event_id || null,
          notes: newTask.notes ?? "",
        });
      } else {
        await services.tasks.create(selectedWid, newTask);
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
      setNewTask({
        title: "",
        category: "Planning",
        owner: user?.name || "",
        due_date: today(),
        priority: "medium",
        event_id: "",
        notes: "",
      });
      loadTasks(selectedWid);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this task.");
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      category: task.category,
      owner: task.owner,
      due_date: task.due_date,
      priority: task.priority,
      event_id: task.event_id || "",
      notes: task.notes || "",
    });
    setIsModalOpen(true);
    setError("");
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete the task "${task.title}"?`)) return;
    setError("");
    try {
      await services.tasks.delete(task.id);
      loadTasks(selectedWid);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this task.");
    }
  };

  // Filter tasks by ceremony if selected
  const filteredTasks = tasks.filter((t) => {
    if (selectedEventFilter === "all") return true;
    if (selectedEventFilter === "general") return !t.event_id;
    return t.event_id === selectedEventFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Ceremony-Driven Tasks & Milestones
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Ceremony Preparation & Planning Tasks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational playbooks tailored directly to your selected ceremonies, permits, mandap styling, and arrival checkpoints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input-base py-1.5 text-xs w-auto font-medium"
            value={selectedWid}
            onChange={(e) => {
              setSelectedWid(e.target.value);
              setSelectedEventFilter("all");
            }}
          >
            {weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
          <Button variant="gold" size="sm" onClick={() => { setEditingTaskId(null); setIsModalOpen(true); }} className="font-bold">
            <Plus className="w-4 h-4 mr-1" />
            Add Custom Task
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      {weddings.length === 0 && <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">No weddings are assigned to you yet. Ask the Founder to assign one.</div>}

      {/* Ceremony-Driven Filter Tab Strip */}
      {events.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-border shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
            Filter Tasks By Ceremony
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedEventFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedEventFilter === "all"
                  ? "bg-forest-800 text-ivory shadow-xs"
                  : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              All Celebrations ({tasks.length})
            </button>
            {events.map((ev) => {
              const count = tasks.filter((t) => t.event_id === ev.id).length;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventFilter(ev.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedEventFilter === ev.id
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-gold-700" />
                  <span>{ev.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-white/30 px-1.5 py-0.2 rounded-full font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedEventFilter("general")}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedEventFilter === "general"
                  ? "bg-forest-800 text-ivory shadow-xs"
                  : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              General Milestones
            </button>
          </div>
        </div>
      )}

      {/* Status & Priority Filter Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-medium">Status:</span>
          {["all", "to_plan", "in_progress", "done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                statusFilter === s ? "bg-forest-800 text-ivory" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-medium">Priority:</span>
          {["all", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                priorityFilter === p ? "bg-forest-800 text-ivory" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table/List */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <CardHeader className="bg-ivory-100/50 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-forest-900">
              Task Checklist ({filteredTasks.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">Click checkbox to toggle task progress status.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            {filteredTasks.filter((t) => t.status === "done").length} Done
          </span>
        </CardHeader>
        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No tasks found matching current filters.</div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 flex items-center justify-between text-xs hover:bg-ivory-50/70 transition-colors ${
                  task.status === "done" ? "bg-ivory-50/30 opacity-75" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={task.status === "done"}
                    onChange={() => handleToggleStatus(task.id, task.status)}
                    className="w-4 h-4 rounded text-forest-800 focus:ring-gold/60 cursor-pointer mt-0.5 accent-forest-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-forest-900"}`}>
                        {task.title}
                      </span>
                      {task.is_overdue && task.status !== "done" && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-muted-foreground text-[11px] mt-0.5">{task.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-forest-800">Owner: {task.owner}</span>
                      <span>Category: {task.category}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gold-700" />
                        Due: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Badge status={task.priority} />
                  <Badge status={task.status} />
                  <button type="button" onClick={() => openEditTask(task)} className="p-1 text-forest-700 hover:bg-ivory-100" title="Edit task"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void handleDeleteTask(task)} className="p-1 text-rose-600 hover:bg-rose-50" title="Delete task"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── CREATE TASK MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTaskId(null); }}
        title={editingTaskId ? "Edit Wedding Planning Task" : "Create Wedding Planning Task"}
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="label-base">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Conduct floral mandap structural safety review"
              className="input-base"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Category</label>
              <select
                className="input-base"
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Associated Ceremony</label>
              <select
                className="input-base"
                value={newTask.event_id || ""}
                onChange={(e) => setNewTask({ ...newTask, event_id: e.target.value || undefined })}
              >
                <option value="">General (All Events)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Assigned Lead / Owner</label>
              <input
                type="text"
                required
                className="input-base"
                value={newTask.owner}
                onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Priority Level</label>
              <select
                className="input-base"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Target Due Date</label>
            <input
              type="date"
              required
              className="input-base"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label-base">Notes & Key Deliverables</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Include fire safety certificate and signed engineer report."
              value={newTask.notes}
              onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" className="font-bold">
              {editingTaskId ? "Save changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
