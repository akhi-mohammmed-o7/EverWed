import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  DollarSign,
  Truck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import type { Task, VendorArrivalLog, FinancialSummary, OperationalIssue, Wedding } from "@/types";
import { formatINR } from "@/lib/utils";

interface RiskItem {
  id: string;
  category: "tasks" | "vendor" | "finance" | "operation";
  severity: "critical" | "high" | "medium";
  title: string;
  reason: string;
  affected_event: string;
  suggested_action: string;
}

export const RiskRadarPage: React.FC = () => {
  const [weddingId, setWeddingId] = useState<string>("wed-royal-jaipur-001");
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !weddingId) {
        setWeddingId(list[0].id);
      }
    });
  }, []);

  const calculateRisks = async (wid: string) => {
    setIsLoading(true);
    try {
      const [tasks, ops, fin] = await Promise.all([
        services.tasks.list(wid),
        services.operations.getOverview(wid),
        services.finance.getFinancialSummary(wid).catch(() => null),
      ]);

      const detected: RiskItem[] = [];

      // 1. Overdue critical/urgent tasks
      tasks.forEach((t) => {
        if (t.is_overdue && ["urgent", "high"].includes(t.priority)) {
          detected.push({
            id: `risk-task-${t.id}`,
            category: "tasks",
            severity: t.priority === "urgent" ? "critical" : "high",
            title: `Overdue Critical Task: ${t.title}`,
            reason: `Task was due on ${t.due_date} under ${t.category} and is still '${t.status}' with assignee ${t.owner}.`,
            affected_event: "Palace Preparations & Approvals",
            suggested_action: `Escalate with ${t.owner} or reassign immediately to senior coordinator.`,
          });
        }
      });

      // 2. Late vendor arrivals
      ops.vendor_arrivals.forEach((arr) => {
        if (arr.delay_minutes > 15 || arr.status === "delayed") {
          detected.push({
            id: `risk-arr-${arr.id}`,
            category: "vendor",
            severity: "high",
            title: `Late Vendor Alert: ${arr.vendor_name}`,
            reason: `${arr.service_category} team is delayed by ${arr.delay_minutes} minutes beyond planned gate time (${arr.planned_arrival_time}).`,
            affected_event: "Reception Courtyard",
            suggested_action: `Call ${arr.contact_phone || "vendor liaison"} to fast-track truck gate access.`,
          });
        }
      });

      // 3. Open operational issues
      ops.active_issues.forEach((iss) => {
        detected.push({
          id: `risk-iss-${iss.id}`,
          category: "operation",
          severity: iss.severity === "high" || iss.severity === "critical" ? "critical" : "medium",
          title: `Unresolved Incident: ${iss.title}`,
          reason: `On-site incident logged with status '${iss.status}' assigned to ${iss.owner}.`,
          affected_event: "Live Ceremony Grounds",
          suggested_action: "Dispatch field coordinator to audit electrical or floral backup immediately.",
        });
      });

      // 4. Financial cost variances
      if (fin && fin.cost_variance > 0) {
        detected.push({
          id: `risk-fin-variance`,
          category: "finance",
          severity: "medium",
          title: `Procurement Cost Overrun: +${formatINR(fin.cost_variance)}`,
          reason: `Actual vendor invoices exceed contracted vendor baseline by ₹${fin.cost_variance.toLocaleString()}.`,
          affected_event: "Agency Net Margin Statement",
          suggested_action: "Issue operational change order or verify extra banquet plates with client family.",
        });
      }

      setRisks(detected);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (weddingId) {
      calculateRisks(weddingId);
    }
  }, [weddingId]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
            Automated Early Warning System
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Wedding Risk Radar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous background audit across tasks, late vendor arrivals, budget overruns, and timeline clashes.
          </p>
        </div>

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
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Scanning operational parameters...</div>
      ) : risks.length === 0 ? (
        <Card className="p-10 text-center space-y-3 bg-emerald-50/20 border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-emerald-950">Zero Critical Operational Risks Detected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All checklist milestones are on schedule, vendors are verified, and financial accounts are within budget margins.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
              {risks.length} Live Risk Indicators identified from underlying data
            </span>
            <span className="text-[11px] text-rose-700">Recalculated in real time</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className={`p-5 rounded-2xl border transition-all ${
                  risk.severity === "critical"
                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-300"
                    : risk.severity === "high"
                    ? "bg-orange-50/50 border-orange-300"
                    : "bg-white border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Badge status={risk.severity} />
                    <h3 className="font-serif text-base font-bold text-forest-900">{risk.title}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Affected: <strong>{risk.affected_event}</strong>
                  </span>
                </div>

                <p className="text-xs text-forest-800 mt-2.5 leading-relaxed">{risk.reason}</p>

                <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white/60 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Recommended Planner Action
                    </span>
                    <span className="font-semibold text-forest-900">{risk.suggested_action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
