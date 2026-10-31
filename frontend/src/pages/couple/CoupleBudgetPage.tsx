import React, { useEffect, useState } from "react";
import {
  DollarSign,
  CreditCard,
  ShieldCheck,
  Receipt,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Wedding, ClientPayment, FinancialSummary } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleBudgetPage: React.FC = () => {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadBudget = async () => {
      const weddingId = user?.wedding_id;
      if (!weddingId) {
        if (mounted) setIsLoading(false);
        return;
      }
      setError("");
      try {
        const [details, financialSummary, list] = await Promise.all([
          services.weddings.get(weddingId),
          services.finance.getFinancialSummary(weddingId),
          services.finance.listClientPayments(weddingId),
        ]);
        if (!mounted) return;
        setWedding(details);
        setBudgetInput(String(details.budget_allocated));
        setSummary(financialSummary);
        setPayments(list);
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load your budget.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadBudget();
    return () => {
      mounted = false;
    };
  }, [user?.wedding_id]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading budget and payments...</div>;
  }

  const saveBudget = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wedding) return;
    setIsSavingBudget(true);
    setError("");
    setBudgetMessage("");
    try {
      const updated = await services.weddings.update(wedding.id, { budget_allocated: Number(budgetInput) });
      setWedding(updated);
      setBudgetMessage("Your planned budget was saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the planned budget.");
    } finally {
      setIsSavingBudget(false);
    }
  };

  if (!wedding || !summary) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Budget unavailable</div>
        <p className="mt-1">{error || "Your wedding workspace could not be loaded."}</p>
      </div>
    );
  }

  const hasContract = summary.total_contract_value > 0;
  const paidPercent = hasContract
    ? Math.min(100, Math.round((summary.client_paid_amount / summary.total_contract_value) * 100))
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
          Financial Transparency
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          Wedding Budget & Payment Schedule
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your planned budget, agreed contract and recorded payments for {wedding.bride_name} & {wedding.groom_name}.
        </p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Planned budget"
          value={formatINR(wedding.budget_allocated)}
          subtitle="Your saved planning budget"
          icon={<Wallet className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Agreed contract"
          value={hasContract ? formatINR(summary.total_contract_value) : "Not set"}
          subtitle={hasContract ? "Recorded by your planning team" : "No signed package fee recorded yet"}
          icon={<DollarSign className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Paid to date"
          value={formatINR(summary.client_paid_amount)}
          subtitle={hasContract ? `${paidPercent}% of contract` : "No contract recorded"}
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Remaining balance"
          value={hasContract ? formatINR(summary.client_outstanding_receivable) : "—"}
          subtitle={hasContract ? "Outstanding on the agreed contract" : "Applies once a contract is recorded"}
          icon={<Receipt className="w-5 h-5 text-amber-600" />}
        />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-semibold text-forest-900">Contract payment progress</span>
          <span className="text-muted-foreground">
            {formatINR(summary.client_paid_amount)} / {hasContract ? formatINR(summary.total_contract_value) : "No contract"}
          </span>
        </div>
        <div className="w-full h-3 bg-ivory-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${paidPercent}%` }} />
        </div>
      </Card>

      <Card className="p-5">
        <form onSubmit={saveBudget} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-forest-900">Update planned budget (INR)
            <input required type="number" min={0} step="0.01" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} className="input-base mt-1" />
          </label>
          <button type="submit" disabled={isSavingBudget} className="rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {isSavingBudget ? "Saving..." : "Save budget"}
          </button>
          {budgetMessage && <p role="status" className="text-xs font-semibold text-emerald-800">{budgetMessage}</p>}
        </form>
        <p className="mt-2 text-xs text-muted-foreground">This changes your planning budget only. Recorded payments and supplier expenses stay unchanged.</p>
      </Card>

      <Card className="p-0 overflow-hidden shadow-sm">
        <CardHeader className="bg-ivory-100/50">
          <h3 className="font-serif text-base font-bold text-forest-900">Vendor costs & payments</h3>
          <span className="text-xs text-muted-foreground font-semibold">From recorded supplier records</span>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Agreed vendor total</p><p className="mt-1 font-serif text-lg font-bold text-forest-900">{formatINR(summary.agreed_vendor_total)}</p></div>
          <div className="p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Supplier bills recorded</p><p className="mt-1 font-serif text-lg font-bold text-forest-900">{formatINR(summary.actual_vendor_bills_total)}</p></div>
          <div className="p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Paid to vendors</p><p className="mt-1 font-serif text-lg font-bold text-forest-900">{formatINR(summary.vendor_paid_amount)}</p></div>
          <div className="p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">Outstanding to vendors</p><p className="mt-1 font-serif text-lg font-bold text-forest-900">{formatINR(summary.vendor_outstanding_payable)}</p></div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden shadow-sm">
        <CardHeader className="bg-ivory-100/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="font-serif text-base font-bold text-forest-900">Recorded payments</h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">{payments.length} transactions</span>
        </CardHeader>
        {payments.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No payments have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
                <tr>
                  <th className="py-3 px-4">Transaction ref</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-ivory-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-900">{payment.transaction_reference}</td>
                    <td className="py-3.5 px-4 font-semibold text-forest-900 capitalize">{payment.stage.replace(/_/g, " ")}</td>
                    <td className="py-3.5 px-4 font-serif text-sm font-bold text-emerald-800">{formatINR(payment.amount)}</td>
                    <td className="py-3.5 px-4 text-forest-700">{payment.payment_method}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{formatDate(payment.payment_date)}</td>
                    <td className="py-3.5 px-4"><Badge status={payment.status} /></td>
                    <td className="py-3.5 px-4 text-muted-foreground italic">{payment.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
