import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Task } from "@/types";
import { formatDate, getActiveWeddingId } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleChecklistPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const activeId = user?.wedding_id || getActiveWeddingId();
      if (!activeId) { setTasks([]); return; }
      const list = await services.tasks.list(activeId);
      setTasks(list);
    } catch (error) {
      console.error("Unable to load this wedding's checklist:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.wedding_id]);

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "in_progress" : "done";
    await services.tasks.update(taskId, { status: next });
    loadTasks();
  };

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const filtered = filterCategory === "all" ? tasks : tasks.filter((t) => t.category === filterCategory);
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Couple Planning Tracker
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Wedding Planning Checklist & Decisions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent view of all {tasks.length} luxury operational tasks being managed by EverWed entourage.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-forest-900 text-ivory text-xs font-bold shadow-xs">
          {doneCount} of {tasks.length} Done ({tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%)
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs bg-white p-2 rounded-xl border border-border">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            filterCategory === "all" ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-100"
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              filterCategory === c ? "bg-forest-800 text-ivory" : "text-forest-700 hover:bg-ivory-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Checklist List */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="divide-y divide-border/60">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`p-4 flex items-center justify-between text-xs hover:bg-ivory-50/70 transition-colors ${
                task.status === "done" ? "opacity-75 bg-ivory-50/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => handleToggle(task.id, task.status)}
                  className="w-4 h-4 rounded text-forest-800 focus:ring-gold/60 cursor-pointer mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        task.status === "done" ? "line-through text-muted-foreground" : "text-forest-900"
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge status={task.priority} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Category: {task.category} • Handled by: {task.owner} • Target: {formatDate(task.due_date)}
                  </p>
                </div>
              </div>

              <Badge status={task.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

