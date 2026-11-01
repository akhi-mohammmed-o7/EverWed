import React, { useEffect, useState } from "react";
import {
  DollarSign,
  CreditCard,
  ShieldCheck,
  Receipt,
  Wallet,
  AlertCircle,
  Link2,
  RefreshCw,
  Check,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import { APIError } from "@/services/api/client";
import type { Wedding, ClientPayment, ClientPaymentLink } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleBudgetPage: React.FC = () => {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<ClientPaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentLinkError, setPaymentLinkError] = useState("");
  const [paymentConfigurationMissing, setPaymentConfigurationMissing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadBudget = async () => {
      const weddingId = user?.wedding_id;
      if (!weddingId) {
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        const [details, list, links] = await Promise.all([
          services.weddings.get(weddingId),
          services.finance.listClientPayments(weddingId),
          services.finance.listClientPaymentLinks(weddingId),
        ]);
        if (!mounted) return;
        setError("");
        setWedding(details);
        setBudgetInput(String(details.budget_allocated));
        setPayments(list);
        setPaymentLinks(links);
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

  const createPaymentLink = async () => {
    if (!wedding || !wedding.package_fee) return;
    const paidSoFar = payments.filter((payment) => payment.status === "received" || payment.status === "verified").reduce((sum, payment) => sum + payment.amount, 0);
    if (wedding.package_fee - paidSoFar <= 0) return;
    setCreatingLink(true); setPaymentMessage(""); setPaymentLinkError(""); setPaymentConfigurationMissing(false); setError("");
    try {
      const requestId = globalThis.crypto?.randomUUID?.() ?? `everwed-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const link = await services.finance.createClientPaymentLink({
        wedding_id: wedding.id,
        stage: paidSoFar === 0 ? "booking_deposit" : "advance_payment",
      }, requestId);
      setPaymentLinks((current) => [link, ...current.filter((item) => item.id !== link.id)]);
      setPaymentMessage("Your secure Razorpay payment link is ready. Payment status updates after provider confirmation.");
    } catch (cause) {
      if (cause instanceof APIError && cause.code === "PAYMENTS_NOT_CONFIGURED") {
        setPaymentConfigurationMissing(true);
        setPaymentLinkError("Online payments are not configured for this EverWed deployment. A Founder/Admin must set the Razorpay API keys and webhook secret in the backend environment, then restart the backend. No payment was taken.");
      } else {
        setPaymentLinkError(cause instanceof Error ? cause.message : "Unable to create a secure payment link.");
      }
    } finally { setCreatingLink(false); }
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
  const clientOutstanding = Math.max(0, contractValue - totalClientPaid);
  const hasContract = contractValue > 0;
  const openPaymentLink = paymentLinks.find((link) =>
    ["created", "partially_paid"].includes(link.status) && link.amount_due > 0 && Boolean(link.short_url)
  );
  const linkBeingPrepared = paymentLinks.some((link) => link.status === "creating");
  const linkNeedsHelp = paymentLinks.some((link) => link.status === "creation_unknown");
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
            <h2 className="font-serif text-lg font-bold leading-snug text-forest-900">Pay your agreed contract securely</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Your payment is based on the agreed contract fee, separate from your editable wedding budget. Choose an available option on Razorpay’s secure checkout.</p>
          </div>
        </div>

        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="How online payments work">
          {[
            { title: "Agree the fee", detail: "Your Planner records the contract amount." },
            { title: "Open your link", detail: "Create one here, then continue to checkout." },
            { title: "Choose how to pay", detail: "Use the methods available on Razorpay; pay in full or in part." },
            { title: "See confirmation", detail: "A verified payment is saved and shared with your Planner." },
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
          <strong>Online payments do not need Planner approval after checkout.</strong> Once Razorpay confirms a successful payment, it is recorded automatically and appears in both accounts. Your page refreshes payment status every few seconds.
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current balance</p>
            <p className="mt-1 font-serif text-2xl font-bold text-forest-900">{hasContract ? formatINR(clientOutstanding) : "Fee not set"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {!hasContract ? (
              <p className="max-w-sm rounded-lg bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">Your Planner needs to record the agreed contract fee first. This is contract setup, not a payment approval request.</p>
            ) : clientOutstanding <= 0 ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900"><Check className="h-4 w-4 shrink-0" />Your recorded contract balance is paid.</p>
            ) : openPaymentLink ? (
              <a href={openPaymentLink.short_url!} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <ExternalLink className="h-4 w-4 shrink-0" />Continue to payment
              </a>
            ) : linkBeingPrepared ? (
              <span role="status" className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950"><RefreshCw className="h-4 w-4 shrink-0 animate-spin" />Preparing your payment link…</span>
            ) : linkNeedsHelp ? (
              <p role="alert" className="max-w-sm rounded-lg bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">The payment provider’s response could not be confirmed. For your safety, a second link is blocked. Contact your Planner to reconcile this attempt.</p>
            ) : paymentConfigurationMissing ? (
              <span className="text-sm font-medium text-amber-950">Online checkout unavailable</span>
            ) : (
              <button type="button" onClick={() => void createPaymentLink()} disabled={creatingLink} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-900 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                {creatingLink ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> : <Link2 className="h-4 w-4 shrink-0" />}{creatingLink ? "Creating secure link…" : "Create secure payment link"}
              </button>
            )}
          </div>
        </div>
        {paymentMessage && <p role="status" className="mt-3 text-sm text-emerald-800">{paymentMessage}</p>}
        {paymentLinkError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-relaxed text-rose-900">{paymentLinkError}</p>}
        {paymentLinks.length > 0 && <div className="space-y-2 border-t border-border pt-3"><h3 className="text-sm font-semibold text-forest-900">Payment link history</h3>{paymentLinks.map((link) => <div key={link.id} className="flex flex-col gap-1.5 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold capitalize text-forest-900">{link.stage.replace(/_/g, " ")} · {link.status.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">Paid {formatINR(link.amount_paid)} of {formatINR(link.amount)} · Remaining {formatINR(link.amount_due)}</p></div>{openPaymentLink?.id === link.id && <span className="text-xs font-semibold text-emerald-800">Ready above</span>}</div>)}</div>}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">EverWed does not store card or UPI credentials. The Planner sees a payment after Razorpay’s signed server notification is verified. If you pay by an offline method, share the receipt with your Planner so it can be recorded separately.</p>
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
