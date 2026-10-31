import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Calendar,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  Shield,
  Building2,
} from "lucide-react";
import { StatCard, Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { services } from "@/services";
import type { DashboardOverview } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    services.dashboard
      .getOverview()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Agency Founder Command
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Season Operational & Financial Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consolidated metrics calculated from your saved weddings, tasks, events and payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/planner/enquiries">
            <Button variant="secondary" size="sm">
              Review Enquiries
            </Button>
          </Link>
          <Link to="/planner/weddings">
            <Button variant="gold" size="sm" className="font-bold">
              View Weddings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip — with smooth animated counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Weddings"
          value={
            <AnimatedCounter value={data.active_weddings_count} duration={1.4} />
          }
          subtitle="Currently in planning & execution"
          icon={<Sparkles className="w-5 h-5" />}
        />
        <StatCard
          title="Season Revenue"
          value={
            <AnimatedCounter
              value={data.season_contracted_revenue}
              prefix="₹"
              formatIndianCurrency={true}
              duration={1.8}
            />
          }
          subtitle={`Client Collected: ${formatINR(data.total_client_payments_received)}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Vendor Payables"
          value={
            <AnimatedCounter
              value={data.total_vendor_payables_outstanding}
              prefix="₹"
              formatIndianCurrency={true}
              duration={1.6}
            />
          }
          subtitle={`Total Billed: ${formatINR(data.total_vendor_bills_recorded)}`}
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Pending Tasks"
          value={
            <AnimatedCounter value={data.pending_tasks_count} duration={1.2} />
          }
          subtitle={`${data.overdue_tasks_count} tasks need urgent attention`}
          icon={<AlertTriangle className="w-5 h-5 text-terracotta" />}
        />
      </div>

      {/* Individual Wedding Financial Performance Table */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-900">Weddings Portfolio & Profitability</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live contract value, client receivables, vendor costs, and agency net gross margin.
            </p>
          </div>
          <Link to="/planner/weddings">
            <Button variant="ghost" size="sm" className="text-xs">
              All Weddings <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
              <tr>
                <th className="py-3 px-4">Wedding Title</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4">Client Paid</th>
                <th className="py-3 px-4">Vendor Expenses</th>
                <th className="py-3 px-4">Gross Profit</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.active_weddings.map((w) => (
                <tr key={w.wedding_id} className="hover:bg-ivory-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-serif font-bold text-forest-900">
                    <Link to={`/planner/weddings/${w.wedding_id}`} className="hover:text-gold-800">
                      {w.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-forest-700">{w.destination}</td>
                  <td className="py-3.5 px-4 font-semibold text-forest-900">{formatINR(w.contract_value)}</td>
                  <td className="py-3.5 px-4 text-emerald-700 font-medium">{formatINR(w.client_paid)}</td>
                  <td className="py-3.5 px-4 text-amber-700 font-medium">{formatINR(w.vendor_costs)}</td>
                  <td className="py-3.5 px-4 font-bold text-forest-900">{formatINR(w.gross_profit)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {w.margin_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to={`/planner/weddings/${w.wedding_id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Open Workspace
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Two-Column Grid: Urgent Tasks & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-terracotta" />
              <h3 className="font-serif text-base font-bold text-forest-900">Urgent & High-Priority Tasks</h3>
            </div>
            <Link to="/planner/tasks">
              <span className="text-xs text-gold-800 font-semibold hover:underline">View All</span>
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {data.urgent_tasks.length === 0 ? (
              <p className="p-5 text-xs text-muted-foreground">No urgent tasks pending.</p>
            ) : (
              data.urgent_tasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-ivory-50/60 transition-colors flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge status={task.priority} />
                      <span className="text-[11px] text-muted-foreground">{task.category}</span>
                    </div>
                    <p className="font-semibold text-forest-900 mt-1">{task.title}</p>
                    <p className="text-muted-foreground mt-0.5">Assignee: {task.owner} • Due {formatDate(task.due_date)}</p>
                  </div>
                  <Badge status={task.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-700" />
              <h3 className="font-serif text-base font-bold text-forest-900">Upcoming Wedding Events</h3>
            </div>
            <Link to="/planner/weddings">
              <span className="text-xs text-gold-800 font-semibold hover:underline">Weddings</span>
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {data.upcoming_events.length === 0 ? (
              <p className="p-5 text-xs text-muted-foreground">No events scheduled.</p>
            ) : (
              data.upcoming_events.map((ev) => (
                <div key={ev.id} className="p-4 hover:bg-ivory-50/60 transition-colors flex items-start justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-serif font-bold text-forest-900">{ev.name}</h4>
                    <p className="text-forest-700 mt-0.5">{ev.venue_hall} • {ev.guest_estimate} Guests</p>
                    <p className="text-muted-foreground mt-0.5">
                      {formatDate(ev.date)} • {ev.start_time} - {ev.end_time} • Lead: {ev.coordinator_name}
                    </p>
                  </div>
                  <Badge status={ev.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

