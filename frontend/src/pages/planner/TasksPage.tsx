import React, { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Task, TaskCreate, Wedding } from "@/types";
import { formatDate } from "@/lib/utils";
import { TASK_CATEGORIES } from "@/lib/constants";

export const TasksPage: React.FC = () => {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWid, setSelectedWid] = useState<string>("wed-royal-jaipur-001");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<TaskCreate>({
    title: "",
    category: "Venue",
    owner: "Pooja Verma",
    due_date: "2026-11-20",
    priority: "medium",
    notes: "",
  });

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !selectedWid) {
        setSelectedWid(list[0].id);
      }
    });
  }, []);

  const loadTasks = (wid: string) => {
    setIsLoading(true);
    services.tasks
      .list(wid, {
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
      })
      .then((data) => setTasks(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedWid) {
      loadTasks(selectedWid);
    }
  }, [selectedWid, statusFilter, priorityFilter, categoryFilter]);

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "in_progress" : "done";
    try {
      await services.tasks.update(taskId, { status: next });
      loadTasks(selectedWid);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWid || !newTask.title.trim()) return;
    try {
      await services.tasks.create(selectedWid, newTask);
      setIsModalOpen(false);
      setNewTask({
        title: "",
        category: "Venue",
        owner: "Pooja Verma",
        due_date: "2026-11-20",
        priority: "medium",
        notes: "",
      });
      loadTasks(selectedWid);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Operations & Protocol
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            25+ Standard Wedding Checklist & Tasks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational milestones: venue permits, mandap engineering, sound licenses, tastings, and arrival checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input-base py-1.5 text-xs w-auto font-medium"
            value={selectedWid}
            onChange={(e) => setSelectedWid(e.target.value)}
          >
            {weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} className="font-bold">
            <Plus className="w-4 h-4 mr-1" />
            Add Custom Task
          </Button>
        </div>
      </div>

      {/* Filter Strip */}
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
        <CardHeader className="bg-ivory-100/50">
          <div>
            <h3 className="font-serif text-base font-bold text-forest-900">Task Checklist ({tasks.length})</h3>
            <p className="text-[11px] text-muted-foreground">Click checkbox to toggle task progress status.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {tasks.filter((t) => t.status === "done").length} Done
          </span>
        </CardHeader>
        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No tasks found matching filters.</div>
          ) : (
            tasks.map((task) => (
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
                    className="w-4 h-4 rounded text-forest-800 focus:ring-gold/60 cursor-pointer mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-forest-900"}`}>
                        {task.title}
                      </span>
                      <Badge status={task.priority} />
                      {task.is_overdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1">
                      <span>Category: <strong>{task.category}</strong></span>
                      <span>Assignee: <strong>{task.owner}</strong></span>
                      <span>Due Date: <strong>{formatDate(task.due_date)}</strong></span>
                      {task.notes && <span className="text-forest-700 italic">"{task.notes}"</span>}
                    </div>
                  </div>
                </div>

                <Badge status={task.status} />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Custom Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Custom Operational Task"
        subtitle="Add a specific task or operational reminder to the wedding plan."
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Task Title</label>
            <input
              type="text"
              required
              className="input-base"
              placeholder="e.g. Confirm 2nd tier backup sound generator"
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
              <label className="label-base">Priority</label>
              <select
                className="input-base"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Assignee / Owner</label>
              <input
                type="text"
                required
                className="input-base"
                value={newTask.owner}
                onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Due Date</label>
              <input
                type="date"
                required
                className="input-base"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Notes & Requirements</label>
            <textarea
              rows={2}
              className="input-base"
              value={newTask.notes}
              onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Save Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
