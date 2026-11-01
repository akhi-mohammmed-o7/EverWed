import React, { useEffect, useState } from "react";
import {
  DollarSign,
  CreditCard,
  ShieldCheck,
  Receipt,
  Wallet,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Wedding, ClientPayment } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleBudgetPage: React.FC = () => {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [offlineError, setOfflineError] = useState("");
  const [offlineDraft, setOfflineDraft] = useState({ amount: "", payment_method: "UPI", transaction_reference: "", payment_date: new Date().toISOString().slice(0, 10), notes: "" });

  useEffect(() => {
    let mounted = true;
    const loadBudget = async () => {
      const weddingId = user?.wedding_id;
      if (!weddingId) {
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        const [details, list] = await Promise.all([
          services.weddings.get(weddingId),
          services.finance.listClientPayments(weddingId),
        ]);
        if (!mounted) return;
        setError("");
        setWedding(details);
        setBudgetInput(String(details.budget_allocated));
        setPayments(list);
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load your budget.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadBudget();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadBudget();
    }, 8000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
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

  const reportOfflinePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wedding || !hasContract || !offlineDraft.transaction_reference.trim()) return;
    setOfflineBusy(true);
    setOfflineError("");
    setOfflineMessage("");
    try {
      const record = await services.finance.reportOfflineClientPayment({
        wedding_id: wedding.id,
        stage: totalClientPaid === 0 ? "booking_deposit" : "advance_payment",
        amount: Number(offlineDraft.amount),
        payment_method: offlineDraft.payment_method,
        transaction_reference: offlineDraft.transaction_reference.trim(),
        payment_date: offlineDraft.payment_date,
        notes: offlineDraft.notes.trim() || "Couple-reported offline payment; awaiting Planner verification.",
      });
      setPayments((current) => [record, ...current.filter((item) => item.id !== record.id)]);
      setOfflineDraft((current) => ({ ...current, amount: "", transaction_reference: "", notes: "" }));
      setOfflineMessage("Payment details sent to your Planner for verification. Your balance updates after they confirm the received funds.");
    } catch (cause) {
      setOfflineError(cause instanceof Error ? cause.message : "Unable to send payment details for review.");
    } finally {
      setOfflineBusy(false);
    }
  };

  if (!wedding) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Budget unavailable</div>
        <p className="mt-1">{error || "Your wedding workspace could not be loaded."}</p>
      </div>
    );
  }

  const contractValue = wedding.package_fee || 0;
  const totalClientPaid = payments.filter((payment) => payment.status === "received" || payment.status === "verified").reduce((sum, payment) => sum + payment.amount, 0);
  const totalPendingClientReported = payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);
  const clientOutstanding = Math.max(0, contractValue - totalClientPaid);
  const offlineReportableBalance = Math.max(0, clientOutstanding - totalPendingClientReported);
  const hasContract = contractValue > 0;
  const paidPercent = hasContract
    ? Math.min(100, Math.round((totalClientPaid / contractValue) * 100))
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
      {!hasContract && totalClientPaid > 0 && <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>{formatINR(totalClientPaid)} is in your payment history, but the agreed contract fee has not been entered yet.</strong> Your Planner needs to confirm the signed amount before EverWed can calculate your remaining balance. Existing payment records are saved and visible to both of you.</p></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Planned budget"
          value={formatINR(wedding.budget_allocated)}
          subtitle="Your saved planning budget"
          icon={<Wallet className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Agreed contract"
          value={hasContract ? formatINR(contractValue) : "Not set"}
          subtitle={hasContract ? "Recorded by your planning team" : "No signed package fee recorded yet"}
          icon={<DollarSign className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Paid to date"
          value={formatINR(totalClientPaid)}
          subtitle={hasContract ? `${paidPercent}% of contract` : "No contract recorded"}
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Remaining balance"
          value={hasContract ? formatINR(clientOutstanding) : "—"}
          subtitle={hasContract ? "Outstanding on the agreed contract" : "Applies once a contract is recorded"}
          icon={<Receipt className="w-5 h-5 text-amber-600" />}
        />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-semibold text-forest-900">Contract payment progress</span>
          <span className="text-muted-foreground">
            {formatINR(totalClientPaid)} / {hasContract ? formatINR(contractValue) : "No contract"}
          </span>
        </div>
        <div className="w-full h-3 bg-ivory-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${paidPercent}%` }} />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CreditCard className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 className="font-serif text-lg font-bold leading-snug text-forest-900">Offline payment process</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Use the payment details provided by your Planner, then report the actual transfer here. EverWed records the details; it does not move money.</p>
          </div>
        </div>

        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="How couple payments work">
          {[
            { title: "Agree the fee", detail: "Your Planner records the signed contract amount." },
            { title: "Get payment details", detail: "Ask your Planner which account or payment method to use." },
            { title: "Share the reference", detail: "For offline payments, enter the actual UPI, bank or receipt reference below." },
            { title: "Planner verifies", detail: "Your balance updates after the Planner checks and confirms the funds." },
          ].map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-ivory-50 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-800 text-xs font-bold text-white">{index + 1}</span>
                <h3 className="text-sm font-semibold leading-snug text-forest-900">{step.title}</h3>
              </div>
              <p className="mt-2 pl-9 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm leading-relaxed text-sky-950">
          <strong>Reporting a payment does not confirm receipt.</strong> Reports remain pending until your Planner checks the actual funds. Your balance only changes after verification.
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current balance</p>
            <p className="mt-1 font-serif text-2xl font-bold text-forest-900">{hasContract ? formatINR(clientOutstanding) : "Fee not set"}</p>
          </div>
          <div className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {!hasContract ? <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-amber-950">Your Planner must record the agreed contract amount before you can report a payment.</p> : clientOutstanding <= 0 ? <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 font-semibold text-emerald-900"><Check className="h-4 w-4 shrink-0" />The confirmed contract balance is paid.</p> : totalPendingClientReported > 0 && offlineReportableBalance <= 0 ? <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-amber-950">{formatINR(totalPendingClientReported)} is waiting for Planner verification.</p> : <p>Pay using the instructions from your Planner, then submit the transaction details below.</p>}
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-ivory-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-forest-800"><Receipt className="h-4 w-4" /></span>
            <div><h3 className="font-serif text-base font-bold text-forest-900">Paid by UPI, bank transfer, cash or cheque?</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Pay using the details your Planner shared, then submit the real transaction or receipt reference here. This only reports your payment; it does not transfer money or mark it received. Your Planner verifies it against their account statement.</p></div>
          </div>
          {!hasContract ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Your Planner must save the agreed contract fee before a payment report can be submitted.</p> : offlineReportableBalance <= 0 ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-950">{clientOutstanding <= 0 ? "The confirmed contract balance is fully paid." : `Your Planner is reviewing ${formatINR(totalPendingClientReported)} in reported payments. Please wait for verification before reporting another payment.`}</p> : <form onSubmit={(event) => void reportOfflinePayment(event)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="label-base">Amount paid (INR)<input required type="number" min="0.01" max={offlineReportableBalance} step="0.01" value={offlineDraft.amount} onChange={(event) => setOfflineDraft({ ...offlineDraft, amount: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Payment method<select value={offlineDraft.payment_method} onChange={(event) => setOfflineDraft({ ...offlineDraft, payment_method: event.target.value })} className="input-base mt-1"><option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Cheque</option><option>Other</option></select></label>
            <label className="label-base">Payment date<input required type="date" value={offlineDraft.payment_date} onChange={(event) => setOfflineDraft({ ...offlineDraft, payment_date: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base sm:col-span-2">Transaction / receipt reference<input required maxLength={120} placeholder="Enter the actual UPI, bank or receipt reference" value={offlineDraft.transaction_reference} onChange={(event) => setOfflineDraft({ ...offlineDraft, transaction_reference: event.target.value })} className="input-base mt-1" /></label>
            <label className="label-base">Note (optional)<input maxLength={500} value={offlineDraft.notes} onChange={(event) => setOfflineDraft({ ...offlineDraft, notes: event.target.value })} className="input-base mt-1" /></label>
            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3"><button type="submit" disabled={offlineBusy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{offlineBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}{offlineBusy ? "Sending for review…" : "Submit payment for verification"}</button>{offlineMessage && <p role="status" className="text-sm text-emerald-800">{offlineMessage}</p>}{offlineError && <p role="alert" className="text-sm text-rose-800">{offlineError}</p>}</div>
          </form>}
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
