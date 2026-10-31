import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { services } from "@/services";
import type { Task } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TASK_CATEGORIES } from "@/lib/constants";

type TaskDraft = {
  title: string;
  category: string;
  due_date: string;
  priority: Task["priority"];
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyDraft = (): TaskDraft => ({
  title: "",
  category: "Planning",
  due_date: today(),
  priority: "medium",
  notes: "",
});

export const CoupleChecklistPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = async () => {
    const weddingId = user?.wedding_id;
    if (!weddingId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    setError("");
    try {
      setTasks(await services.tasks.list(weddingId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your checklist.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.wedding_id]);

  const handleToggle = async (task: Task) => {
    setSavingTaskId(task.id);
    setError("");
    try {
      await services.tasks.update(task.id, { status: task.status === "done" ? "in_progress" : "done" });
      await loadTasks();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this checklist change.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const openAdd = () => {
    setEditingTaskId(null);
    setDraft(emptyDraft());
    setIsModalOpen(true);
    setError("");
  };

  const openEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title,
      category: task.category,
      due_date: task.due_date,
      priority: task.priority,
      notes: task.notes || "",
    });
    setIsModalOpen(true);
    setError("");
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.wedding_id || !draft.title.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      if (editingTaskId) {
        await services.tasks.update(editingTaskId, {
          title: draft.title.trim(),
          category: draft.category,
          due_date: draft.due_date,
          priority: draft.priority,
          notes: draft.notes.trim(),
        });
      } else {
        await services.tasks.create(user.wedding_id, {
          title: draft.title.trim(),
          category: draft.category,
          owner: user.name,
          due_date: draft.due_date,
          priority: draft.priority,
          notes: draft.notes.trim(),
        });
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
      setDraft(emptyDraft());
      await loadTasks();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this task.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete the checklist task "${task.title}"?`)) return;
    setError("");
    try {
      await services.tasks.delete(task.id);
      await loadTasks();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this task.");
    }
  };

  const categories = Array.from(new Set(tasks.map((task) => task.category)));
  const filtered = filterCategory === "all" ? tasks : tasks.filter((task) => task.category === filterCategory);
  const doneCount = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Couple Planning Tracker
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Wedding Planning Checklist
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length > 0
              ? `${tasks.length} planning tasks. Add, edit, complete or delete your own tasks.`
              : "Tasks appear from your wedding setup, or add your own."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-fit rounded-xl bg-forest-900 px-3.5 py-2 text-xs font-bold text-ivory shadow-xs">
            {doneCount} of {tasks.length} done ({tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%)
          </div>
          <Button variant="gold" size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Add task
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      {tasks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-2 text-xs">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${filterCategory === "all" ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-100"}`}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition-colors ${filterCategory === category ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-100"}`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <Card className="overflow-hidden p-0 shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-xs text-muted-foreground">Loading your checklist...</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-serif text-xl font-semibold text-forest-900">No checklist tasks</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tasks.length > 0
                ? "No tasks match this category."
                : "Add your first task or add a function in the Wedding Builder to generate preparation tasks."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((task) => (
              <div
                key={task.id}
                className={`flex flex-col gap-3 p-4 text-xs transition-colors hover:bg-ivory-50/70 sm:flex-row sm:items-center sm:justify-between ${task.status === "done" ? "bg-ivory-50/30 opacity-75" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "done"}
                    disabled={savingTaskId === task.id}
                    onChange={() => void handleToggle(task)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded text-forest-800 focus:ring-gold/60"
                    aria-label={`Mark ${task.title} complete`}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold ${task.status === "done" ? "text-muted-foreground line-through" : "text-forest-900"}`}>
                        {task.title}
                      </span>
                      <Badge status={task.priority} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Category: {task.category} • Handled by: {task.owner} • Target: {formatDate(task.due_date)}
                    </p>
                    {task.notes && <p className="mt-0.5 text-[11px] text-forest-700">{task.notes}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                  <Badge status={task.status} />
                  <button type="button" onClick={() => openEdit(task)} className="rounded p-1 text-forest-700 hover:bg-ivory-100" title="Edit task">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => void deleteTask(task)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Delete task">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTaskId ? "Edit checklist task" : "Add checklist task"}>
        <form onSubmit={saveTask} className="space-y-3.5 text-xs">
          <label className="label-base">Task title
            <input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="input-base mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label-base">Category
              <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="input-base mt-1">
                {TASK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="label-base">Priority
              <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Task["priority"] })} className="input-base mt-1">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <label className="label-base">Due date
            <input required type="date" value={draft.due_date} onChange={(event) => setDraft({ ...draft, due_date: event.target.value })} className="input-base mt-1" />
          </label>
          <label className="label-base">Notes
            <textarea rows={2} maxLength={2000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="input-base mt-1" />
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" isLoading={isSaving}>{editingTaskId ? "Save changes" : "Add task"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
