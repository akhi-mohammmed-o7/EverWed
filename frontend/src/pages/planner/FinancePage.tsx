import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  FileCheck,
  Clock,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type {
  Wedding,
  ClientPayment,
  VendorBill,
  FinancialSummary,
  DashboardOverview,
  ClientPaymentCreate,
  VendorBillCreate,
  VendorPaymentCreate,
  Vendor,
} from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { PAYMENT_STAGES } from "@/lib/constants";

export const FinancePage: React.FC = () => {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWid, setSelectedWid] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorLoadError, setVendorLoadError] = useState<string | null>(null);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [portfolio, setPortfolio] = useState<DashboardOverview | null>(null);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"summary" | "client" | "vendor">("client");
  const [contractInput, setContractInput] = useState("");
  const [savingContract, setSavingContract] = useState(false);
  const [savingClientPayment, setSavingClientPayment] = useState(false);
  const [verifyingClientPaymentId, setVerifyingClientPaymentId] = useState<string | null>(null);
  const [savingVendorBill, setSavingVendorBill] = useState(false);
  const [clientPaymentError, setClientPaymentError] = useState<string | null>(null);
  const [vendorBillError, setVendorBillError] = useState<string | null>(null);

  // Error/Success alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isClientPaymentOpen, setIsClientPaymentOpen] = useState(false);
  const [clientPayForm, setClientPayForm] = useState<ClientPaymentCreate>({
    wedding_id: "",
    stage: "advance_payment",
    amount: 0,
    payment_method: "Bank Transfer",
    transaction_reference: `TXN-CLI-${Date.now().toString().slice(-6)}`,
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isVendorBillOpen, setIsVendorBillOpen] = useState(false);
  const [vendorBillForm, setVendorBillForm] = useState<VendorBillCreate>({
    wedding_id: "",
    vendor_id: "",
    bill_number: `INV-2026-${Date.now().toString().slice(-4)}`,
    agreed_amount: 0,
    billed_amount: 0,
    variance_reason: "",
    bill_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  });

  const [payBillTarget, setPayBillTarget] = useState<VendorBill | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [vendorPayForm, setVendorPayForm] = useState<VendorPaymentCreate>({
    bill_id: "",
    amount: 0,
    payment_type: "partial",
    payment_method: "Bank Transfer",
    transaction_reference: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !selectedWid) {
        setSelectedWid(list[0].id);
      }
      if (list.length === 0) setIsLoading(false);
    }).catch((cause) => {
      setErrorMsg(cause instanceof Error ? cause.message : "Unable to load your weddings.");
      setIsLoading(false);
    });
    services.vendors.list().then((vList) => {
      setVendors(vList);
      setVendorLoadError(null);
    }).catch((cause) => {
      setVendorLoadError(cause instanceof Error ? cause.message : "Unable to load vendors.");
    }).finally(() => setVendorsLoading(false));
  }, []);

  const loadFinanceData = async (wid: string, showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setErrorMsg(null);
    try {
      const [sum, cp, vb] = await Promise.all([
        services.finance.getFinancialSummary(wid),
        services.finance.listClientPayments(wid),
        services.finance.listVendorBills(wid),
      ]);
      setSummary(sum);
      if (showLoader) setContractInput(sum.total_contract_value > 0 ? String(sum.total_contract_value) : "");
      setClientPayments(cp);
      setVendorBills(vb);

      void services.dashboard.getOverview().then(setPortfolio).catch(() => undefined);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      if (selectedWid) {
      loadFinanceData(selectedWid, true);
      setClientPayForm((prev) => ({ ...prev, wedding_id: selectedWid }));
      setVendorBillForm((prev) => ({ ...prev, wedding_id: selectedWid }));
    }
    const timer = window.setInterval(() => {
      if (selectedWid && document.visibilityState === "visible") void loadFinanceData(selectedWid);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [selectedWid]);

  const handleSaveContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(contractInput);
    if (!selectedWid || !summary || !Number.isFinite(amount) || amount <= 0) {
      setErrorMsg("Enter a valid agreed contract amount greater than zero.");
      return;
    }
    if (amount < summary.client_paid_amount) {
      setErrorMsg("The agreed amount cannot be lower than the payments already recorded.");
      return;
    }
    setSavingContract(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.weddings.update(selectedWid, { package_fee: amount });
      await loadFinanceData(selectedWid);
      setSuccessMsg("Agreed contract amount saved. Outstanding balances and profit summaries have been recalculated.");
    } catch (cause) {
      setErrorMsg(cause instanceof Error ? cause.message : "Unable to save the agreed contract amount.");
    } finally {
      setSavingContract(false);
    }
  };

  const handleRecordClientPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setClientPaymentError(null);
    setSavingClientPayment(true);
    try {
      await services.finance.recordClientPayment(clientPayForm);
      setIsClientPaymentOpen(false);
      setClientPayForm((prev) => ({ ...prev, amount: 0, transaction_reference: `TXN-CLI-${Date.now().toString().slice(-6)}`, notes: "" }));
      setSuccessMsg(`Client payment of ₹${clientPayForm.amount.toLocaleString()} recorded successfully.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setClientPaymentError(err.message || "Failed to record client payment");
      setErrorMsg(err.message || "Failed to record client payment");
    } finally {
      setSavingClientPayment(false);
    }
  };

  const handleRecordVendorBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setVendorBillError(null);
    setSavingVendorBill(true);
    try {
      await services.finance.recordVendorBill(vendorBillForm);
      setIsVendorBillOpen(false);
      setVendorBillForm((prev) => ({ ...prev, vendor_id: "", bill_number: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, agreed_amount: 0, billed_amount: 0, variance_reason: "" }));
      setSuccessMsg(`Vendor bill '${vendorBillForm.bill_number}' recorded successfully.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setVendorBillError(err.message || "Failed to record vendor bill");
      setErrorMsg(err.message || "Failed to record vendor bill");
    } finally {
      setSavingVendorBill(false);
    }
  };

  const handleRecordVendorPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBillTarget) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.finance.recordVendorPayment({
        ...vendorPayForm,
        bill_id: payBillTarget.id,
      });
      setPayBillTarget(null);
      setSuccessMsg(`Vendor payment record for ${formatINR(vendorPayForm.amount)} saved. No funds were transferred by EverWed.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setErrorMsg(err.message || "Payment rejected by financial control rules");
    }
  };

  const verifyClientPayment = async (paymentId: string) => {
    setVerifyingClientPaymentId(paymentId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.finance.verifyClientPayment(paymentId);
      await loadFinanceData(selectedWid);
      setSuccessMsg("Offline payment verified and added to received funds.");
    } catch (cause) {
      setErrorMsg(cause instanceof Error ? cause.message : "Unable to verify this payment report.");
    } finally {
      setVerifyingClientPaymentId(null);
    }
  };

  const rejectClientPayment = async (paymentId: string) => {
    if (!window.confirm("Reject this reported payment? It will not count as money received, and the couple can submit a corrected report.")) return;
    setVerifyingClientPaymentId(paymentId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.finance.rejectClientPayment(paymentId);
      await loadFinanceData(selectedWid);
      setSuccessMsg("Payment report rejected. It remains in history and no money was recorded.");
    } catch (cause) {
      setErrorMsg(cause instanceof Error ? cause.message : "Unable to reject this payment report.");
    } finally {
      setVerifyingClientPaymentId(null);
    }
  };

  if (!isLoading && weddings.length === 0) {
    return <Card className="mx-auto max-w-2xl p-8 text-center"><Building2 className="mx-auto h-8 w-8 text-forest-700" /><h1 className="mt-4 font-serif text-2xl font-bold text-forest-900">No wedding workspaces yet</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Finance records are organized by wedding. Once a wedding is assigned to your Planner account, its couple payments, vendor bills and balances will appear here.</p>{errorMsg && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{errorMsg}</p>}</Card>;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Agency Financial Statement
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Wedding Accounts, Bills & Profitability
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record offline client receipts and vendor invoices, then track what has been received, paid and remains outstanding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Button variant="secondary" size="sm" disabled={!summary || (!summary.client_contract_missing && summary.client_outstanding_receivable <= 0)} title={summary?.client_contract_missing ? "Save the agreed contract fee before recording a payment." : summary?.client_outstanding_receivable === 0 ? "No client balance remains." : undefined} onClick={() => {
            setClientPaymentError(null);
            if (summary?.client_contract_missing) {
              setErrorMsg("Save the agreed contract amount below before recording a client payment.");
              document.getElementById("finance-contract-amount")?.scrollIntoView({ behavior: "smooth", block: "center" });
              document.getElementById("finance-contract-amount")?.focus();
              return;
            }
            setClientPayForm((prev) => ({ ...prev, wedding_id: selectedWid }));
            setIsClientPaymentOpen(true);
          }}>
            <Plus className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Record Client Receipt
          </Button>

          <Button variant="gold" size="sm" onClick={() => {
            setVendorBillError(null);
            setVendorBillForm((prev) => ({ ...prev, wedding_id: selectedWid }));
            setIsVendorBillOpen(true);
          }} className="font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Vendor Invoice
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 text-rose-900 border border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading || !summary ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading wedding financial accounts...</div>
      ) : (
        <div className="space-y-6">
          {portfolio && <section aria-labelledby="portfolio-finance-heading" className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 id="portfolio-finance-heading" className="font-serif text-xl font-bold text-forest-900">Your wedding portfolio</h2><p className="text-sm text-muted-foreground">Totals across the weddings assigned to your account.</p></div>
              <span className="text-xs text-muted-foreground">Updated automatically every few seconds</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Client contracts" value={formatINR(portfolio.season_contracted_revenue)} subtitle="Agreed fees recorded" icon={<DollarSign className="h-5 w-5" />} />
              <StatCard title="Received from couples" value={formatINR(portfolio.total_client_payments_received)} subtitle="Saved payment transactions" icon={<CreditCard className="h-5 w-5 text-emerald-700" />} />
              <StatCard title="Client balances due" value={formatINR(portfolio.total_client_receivables_outstanding)} subtitle="On contracts with a fee recorded" icon={<Clock className="h-5 w-5 text-amber-700" />} />
              <StatCard title="Vendor invoices" value={formatINR(portfolio.total_vendor_bills_recorded)} subtitle="Actual bills recorded" icon={<Receipt className="h-5 w-5 text-amber-700" />} />
              <StatCard title="Paid to vendors" value={formatINR(portfolio.total_vendor_payments_made)} subtitle="Saved payment transactions" icon={<Building2 className="h-5 w-5 text-emerald-700" />} />
              <StatCard title="Vendor balances due" value={formatINR(portfolio.total_vendor_payables_outstanding)} subtitle="Outstanding on recorded invoices" icon={<FileCheck className="h-5 w-5 text-rose-700" />} />
              <StatCard title="Estimated agency profit" value={formatINR(portfolio.season_estimated_profit)} subtitle="Known contract fees less actual or quoted costs" icon={<TrendingUp className="h-5 w-5 text-emerald-700" />} className="bg-emerald-50/60 border-emerald-200" />
            </div>
            {(portfolio.client_contracts_missing_count > 0 || portfolio.client_contract_overpayment_count > 0) && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              {portfolio.client_contracts_missing_count > 0 && <span><strong>{portfolio.client_contracts_missing_count}</strong> wedding(s) have no agreed contract fee entered; any existing receipts cannot be fully reconciled and their profit estimate is incomplete. </span>}
              {portfolio.client_contract_overpayment_count > 0 && <span><strong>{portfolio.client_contract_overpayment_count}</strong> wedding(s) have received payments above the recorded fee and need reconciliation.</span>}
            </div>}
          </section>}

          <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="font-serif text-xl font-bold text-forest-900">Selected wedding</h2><p className="text-sm text-muted-foreground">Detailed contract, invoice and transaction history for this workspace.</p></div>
            <span className="text-sm font-semibold text-forest-700">{weddings.find((item) => item.id === selectedWid)?.title}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="font-serif text-base font-bold text-forest-900">Client receipts · money coming in</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">First save the agreed contract fee. When the couple reports an offline transfer, check your bank or receipt and choose <strong>Verify received</strong>. Use <strong>Record Client Receipt</strong> only for money you already confirmed outside EverWed. Pending reports do not count in the balance.</p>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50 p-5">
              <h3 className="font-serif text-base font-bold text-forest-900">Vendor invoices · money going out</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground"><strong>Add Vendor Invoice</strong> records what the vendor billed; it does not mean you paid them. After you send a real payment, open that invoice and choose <strong>Record payment</strong>. The invoice balance updates from its saved payment history.</p>
            </Card>
          </div>

          {(summary.client_contract_missing || summary.client_overpayment_amount > 0) && <Card className="border-amber-200 bg-amber-50/70 p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div><h3 className="font-serif text-lg font-bold text-amber-950">{summary.client_contract_missing ? "Agreed contract fee is missing" : "Client payments exceed the saved contract fee"}</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-amber-950/85">{summary.client_contract_missing ? `${formatINR(summary.client_paid_amount)} is already recorded as received, but no agreed contract amount is saved. Enter the signed fee below to calculate the true remaining balance and profit. The existing payment records will be preserved.` : `${formatINR(summary.client_overpayment_amount)} more has been recorded than the current contract fee. Confirm the signed amount below to reconcile the financial view; existing payment records remain unchanged.`}</p>
              </div>
              <form onSubmit={handleSaveContract} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="text-xs font-semibold text-amber-950">Agreed contract amount (INR)<input id="finance-contract-amount" type="number" min={summary.client_paid_amount} step="0.01" required value={contractInput} onChange={(event) => setContractInput(event.target.value)} className="input-base mt-1 min-w-48" /></label>
                <Button type="submit" variant="primary" size="md" isLoading={savingContract}>Save agreed fee</Button>
              </form>
            </div>
          </Card>}

          {/* Selected wedding financial cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Contract Value"
              value={summary.client_contract_missing ? "Not set" : formatINR(summary.total_contract_value)}
              subtitle={summary.client_payment_status.replace(/_/g, " ")}
              icon={<DollarSign className="w-5 h-5 text-forest-800" />}
            />
            <StatCard
              title="Received from couple"
              value={formatINR(summary.client_paid_amount)}
              subtitle={summary.client_contract_missing ? "Contract amount needed to calculate balance" : "Saved received transactions"}
              icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Client balance due"
              value={summary.client_contract_missing ? "Unknown" : formatINR(summary.client_outstanding_receivable)}
              subtitle="Contract less confirmed receipts"
              icon={<Clock className="h-5 w-5 text-amber-700" />}
            />
            <StatCard
              title="Vendor invoices"
              value={formatINR(summary.actual_vendor_bills_total)}
              subtitle={`Agreed quotes: ${formatINR(summary.agreed_vendor_total)}`}
              icon={<Receipt className="w-5 h-5 text-amber-600" />}
            />
            <StatCard title="Paid to vendors" value={formatINR(summary.vendor_paid_amount)} subtitle="Individual saved payments" icon={<Building2 className="h-5 w-5 text-emerald-700" />} />
            <StatCard title="Vendor balance due" value={formatINR(summary.vendor_outstanding_payable)} subtitle="Recorded invoices less payments" icon={<FileCheck className="h-5 w-5 text-rose-700" />} />
            <StatCard
              title="Estimated agency profit"
              value={formatINR(summary.net_agency_profit)}
              subtitle={`Estimated margin: ${summary.profit_margin_percentage.toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
              className="bg-emerald-50/50 border-emerald-300"
            />
          </div>

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Couple payment progress</p><p className="mt-1 font-serif text-xl font-bold text-forest-900">{formatINR(summary.client_paid_amount)} <span className="font-sans text-sm font-normal text-muted-foreground">received {summary.client_contract_missing ? "· contract fee not set" : `of ${formatINR(summary.total_contract_value)}`}</span></p></div>
              {!summary.client_contract_missing && <p className="text-sm font-semibold text-forest-800">{summary.total_contract_value > 0 ? Math.min(100, Math.round(summary.client_paid_amount / summary.total_contract_value * 100)) : 0}% received</p>}
            </div>
            {!summary.client_contract_missing && <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ivory-200"><div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${summary.total_contract_value > 0 ? Math.min(100, summary.client_paid_amount / summary.total_contract_value * 100) : 0}%` }} /></div>}
          </Card>

          {/* Variance Breakdown Strip */}
          <div className="p-4 bg-white rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                Procurement Cost Variance
              </span>
              <p className="font-serif text-base font-bold text-forest-900 mt-0.5">
                Originally Agreed: {formatINR(summary.agreed_vendor_total)} vs Billed:{" "}
                {formatINR(summary.actual_vendor_bills_total)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[10px]">Net Invoice Variance</span>
              <span
                className={`font-serif text-base font-bold ${
                  summary.cost_variance > 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {summary.cost_variance > 0 ? "+" : ""}
                {formatINR(summary.cost_variance)}
              </span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-border gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveSection("summary")}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeSection === "summary"
                  ? "border-forest-800 text-forest-900 font-bold"
                  : "border-transparent text-muted-foreground hover:text-forest-800"
              }`}
            >
              Vendor invoices & payments ({vendorBills.length})
            </button>
            <button
              onClick={() => setActiveSection("client")}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeSection === "client"
                  ? "border-forest-800 text-forest-900 font-bold"
                  : "border-transparent text-muted-foreground hover:text-forest-800"
              }`}
            >
              Client receipts ({clientPayments.length})
            </button>
          </div>

          {/* SECTION: VENDOR BILLS */}
          {activeSection === "summary" && (
            <Card className="p-0 overflow-hidden shadow-sm">
              <CardHeader className="bg-ivory-100/50">
                <div>
                  <h3 className="font-serif text-base font-bold text-forest-900">Vendor invoices and payments</h3>
                  <p className="text-[11px] text-muted-foreground">An invoice records the amount owed. Record a payment against it only after money has actually been sent to the vendor.</p>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Vendor Partner</th>
                      <th className="py-3 px-4">Agreed Quote</th>
                      <th className="py-3 px-4">Billed Amount</th>
                      <th className="py-3 px-4">Variance</th>
                      <th className="py-3 px-4">Paid / Balance</th>
                      <th className="py-3 px-4">Payment history</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {vendorBills.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No vendor invoices yet. Choose “Add Vendor Invoice” after receiving an actual vendor bill.</td></tr>}
                    {vendorBills.map((bill) => (
                      <React.Fragment key={bill.id}><tr className="hover:bg-ivory-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-forest-900">{bill.bill_number}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-forest-900 block">{bill.vendor_name}</span>
                          <span className="text-[10px] text-muted-foreground">{bill.vendor_category}</span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-medium">{formatINR(bill.agreed_amount)}</td>
                        <td className="py-3.5 px-4 font-bold text-forest-900">{formatINR(bill.billed_amount)}</td>
                        <td className="py-3.5 px-4">
                          {bill.variance > 0 ? (
                            <div>
                              <span className="font-bold text-rose-700">+{formatINR(bill.variance)}</span>
                              {bill.variance_reason && (
                                <p className="text-[10px] text-muted-foreground italic max-w-xs mt-0.5 truncate" title={bill.variance_reason}>
                                  "{bill.variance_reason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-medium">₹0 (Matched)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-emerald-700 font-medium block">Paid: {formatINR(bill.total_paid)}</span>
                          <span className="text-muted-foreground text-[11px]">Due: {formatINR(bill.outstanding_balance)}</span>
                        </td>
                        <td className="py-3.5 px-4"><button type="button" className="font-semibold text-forest-800 hover:underline" onClick={() => setExpandedBillId((current) => current === bill.id ? null : bill.id)}>{expandedBillId === bill.id ? "Hide" : "View"} ({bill.payments?.length ?? 0})</button></td>
                        <td className="py-3.5 px-4">
                          <Badge status={bill.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {bill.outstanding_balance > 0 ? (
                            <Button
                              variant="gold"
                              size="sm"
                              className="text-xs font-bold"
                              onClick={() => {
                                setPayBillTarget(bill);
                                setVendorPayForm({ bill_id: bill.id, amount: bill.outstanding_balance, payment_type: "final", payment_method: "Bank Transfer", transaction_reference: "", payment_date: new Date().toISOString().slice(0, 10), notes: "" });
                              }}
                            >
                              Record vendor payment
                            </Button>
                          ) : (
                            <span className="text-emerald-700 text-xs font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid in full
                            </span>
                          )}
                        </td>
                      </tr>{expandedBillId === bill.id && <tr><td colSpan={9} className="bg-ivory-50 px-4 py-3">{bill.payments?.length ? <div className="space-y-2">{bill.payments.map((payment) => <div key={payment.id} className="grid gap-1 rounded-lg border border-border bg-white p-3 text-xs sm:grid-cols-2 lg:grid-cols-4"><span><strong>{formatINR(payment.amount)}</strong> · {payment.payment_type.replace(/_/g, " ")}</span><span>{payment.payment_method} · {formatDate(payment.payment_date)}</span><span className="font-mono">Ref: {payment.transaction_reference}</span><span className="text-muted-foreground">{payment.notes || "No note"}</span></div>)}</div> : <p className="text-xs text-muted-foreground">No payment records for this bill.</p>}</td></tr>}</React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* SECTION: CLIENT PAYMENTS */}
          {activeSection === "client" && (
            <div className="space-y-4">
            <Card className="p-0 overflow-hidden shadow-sm">
              <CardHeader className="bg-ivory-100/50">
                <div>
                  <h3 className="font-serif text-base font-bold text-forest-900">Client payment history</h3>
                  <p className="text-[11px] text-muted-foreground">Pending means the couple reported a transfer and it still needs checking. Verify only after you confirm the funds. Received means it is included in the paid total. “Record Client Receipt” is for funds you have already confirmed.</p>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
                    <tr>
                      <th className="py-3 px-4">Payment Ref #</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Received Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {clientPayments.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No client receipts or payment reports yet. Record a confirmed receipt or wait for the couple to submit an offline report.</td></tr>}
                    {clientPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-ivory-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-forest-900">{p.transaction_reference}</td>
                        <td className="py-3.5 px-4 font-semibold text-forest-900 capitalize">
                          {p.stage.replace("_", " ")}
                        </td>
                        <td className="py-3.5 px-4 font-serif text-sm font-bold text-emerald-800">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-forest-700">{p.payment_method}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{formatDate(p.payment_date)}</td>
                        <td className="py-3.5 px-4">
                          <Badge status={p.status} />
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground italic">{p.notes || "-"}</td>
                        <td className="py-3.5 px-4 text-right">{p.status === "pending" ? <div className="inline-flex items-center gap-2"><Button type="button" size="sm" variant="gold" disabled={verifyingClientPaymentId === p.id} onClick={() => void verifyClientPayment(p.id)}>{verifyingClientPaymentId === p.id ? "Saving…" : "Verify received"}</Button><button type="button" className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50" disabled={verifyingClientPaymentId === p.id} onClick={() => void rejectClientPayment(p.id)}>Reject</button></div> : p.status === "received" && p.notes?.includes("Couple-reported offline payment") ? <span className="text-xs font-medium text-emerald-800">Verified</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            </div>
          )}
        </div>
      )}

      {/* Record Client Payment Modal */}
      <Modal
        isOpen={isClientPaymentOpen}
        onClose={() => setIsClientPaymentOpen(false)}
        title="Record a client receipt"
        subtitle="Use only after the payment has reached your account. For couple-submitted reports, verify the pending record instead to avoid duplicate receipts."
      >
        <form onSubmit={handleRecordClientPayment} className="space-y-3.5 text-xs">
          {clientPaymentError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{clientPaymentError}</p>}
          <div>
            <label className="label-base">Payment Stage</label>
            <select
              className="input-base"
              value={clientPayForm.stage}
              onChange={(e) => setClientPayForm({ ...clientPayForm, stage: e.target.value })}
            >
              {PAYMENT_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Amount (INR)</label>
            <input
              type="number"
              min="0.01"
              max={summary?.client_outstanding_receivable}
              step="0.01"
              required
              className="input-base"
              value={clientPayForm.amount}
              onChange={(e) => setClientPayForm({ ...clientPayForm, amount: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Formatted: {formatINR(clientPayForm.amount)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Payment Method</label>
              <select
                className="input-base"
                value={clientPayForm.payment_method}
                onChange={(e) => setClientPayForm({ ...clientPayForm, payment_method: e.target.value })}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Account Payee Cheque</option>
                <option value="UPI">UPI Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other offline method</option>
              </select>
            </div>
            <div>
              <label className="label-base">Transaction Reference</label>
              <input
                type="text"
                required
                className="input-base"
                value={clientPayForm.transaction_reference}
                onChange={(e) => setClientPayForm({ ...clientPayForm, transaction_reference: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Payment Date</label>
            <input
              type="date"
              required
              className="input-base"
              value={clientPayForm.payment_date}
              onChange={(e) => setClientPayForm({ ...clientPayForm, payment_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Notes</label>
            <textarea
              rows={2}
              className="input-base"
              value={clientPayForm.notes}
              onChange={(e) => setClientPayForm({ ...clientPayForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsClientPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" isLoading={savingClientPayment}>
              Save confirmed receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Vendor Bill Modal (Enforces Variance Rule) */}
      <Modal
        isOpen={isVendorBillOpen}
        onClose={() => setIsVendorBillOpen(false)}
        title="Add a vendor invoice"
        subtitle="This records the amount EverWed owes the vendor. It does not record a payment. If the billed total exceeds the agreed quote, explain the difference."
      >
        <form onSubmit={handleRecordVendorBill} className="space-y-3.5 text-xs">
          {vendorBillError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{vendorBillError}</p>}
          {vendorsLoading && <p role="status" className="rounded-lg bg-ivory-100 p-3 text-sm text-muted-foreground">Loading vendor directory…</p>}
          {!vendorsLoading && vendorLoadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">Vendor directory could not be loaded: {vendorLoadError}</p>}
          {!vendorsLoading && !vendorLoadError && vendors.length === 0 && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">There are no vendors in the directory yet. Ask a Founder/Admin to add the vendor, then return here to record the invoice.</p>}
          <div>
            <label className="label-base">Select Vendor Partner</label>
            <select
              className="input-base"
              required
              value={vendorBillForm.vendor_id}
              onChange={(e) => setVendorBillForm({ ...vendorBillForm, vendor_id: e.target.value })}
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Bill / Invoice Number</label>
              <input
                type="text"
                required
                className="input-base"
                value={vendorBillForm.bill_number}
                onChange={(e) => setVendorBillForm({ ...vendorBillForm, bill_number: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Bill Date</label>
              <input
                type="date"
                required
                className="input-base"
                value={vendorBillForm.bill_date}
                onChange={(e) => setVendorBillForm({ ...vendorBillForm, bill_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Agreed Quote Price (INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input-base"
                value={vendorBillForm.agreed_amount}
                onChange={(e) => setVendorBillForm({ ...vendorBillForm, agreed_amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label-base">Final Billed Amount (INR)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                className="input-base"
                value={vendorBillForm.billed_amount}
                onChange={(e) => setVendorBillForm({ ...vendorBillForm, billed_amount: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Variance Warning & Mandatory Field */}
          {vendorBillForm.billed_amount > vendorBillForm.agreed_amount && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Cost Variance Detected: +
                {formatINR(vendorBillForm.billed_amount - vendorBillForm.agreed_amount)}
              </div>
              <p className="text-[11px] text-rose-700">
                Agency financial policy requires an explicit variance reason (e.g., extra guest plates, overtime hours).
              </p>
              <div>
                <label className="label-base text-rose-900 font-bold">
                  Variance Reason / Justification (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client added 50 extra banquet plates on Sangeet night"
                  className="input-base border-rose-300"
                  value={vendorBillForm.variance_reason || ""}
                  onChange={(e) => setVendorBillForm({ ...vendorBillForm, variance_reason: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsVendorBillOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" isLoading={savingVendorBill} disabled={vendorsLoading || vendors.length === 0}>
              Save vendor invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record a real payment already made; EverWed does not move money. */}
      <Modal
        isOpen={!!payBillTarget}
        onClose={() => setPayBillTarget(null)}
        title="Record a vendor payment"
        subtitle={`Bill: ${payBillTarget?.bill_number} · Vendor: ${payBillTarget?.vendor_name}. This saves an actual payment record; EverWed does not transfer funds.`}
      >
        <form onSubmit={handleRecordVendorPayment} className="space-y-3.5 text-xs">
          <div className="p-3 bg-ivory-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Remaining Unpaid Balance:</span>
            <span className="font-serif font-bold text-forest-900 text-base">
              {payBillTarget && formatINR(payBillTarget.outstanding_balance)}
            </span>
          </div>
          <div>
            <label className="label-base">Amount already paid (INR)</label>
            <input
              type="number"
              required
              min={0.01}
              step="0.01"
              max={payBillTarget?.outstanding_balance}
              className="input-base"
              value={vendorPayForm.amount}
              onChange={(e) => setVendorPayForm({ ...vendorPayForm, amount: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              This record cannot exceed the remaining bill balance ({payBillTarget && formatINR(payBillTarget.outstanding_balance)}).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Payment Type</label>
              <select
                className="input-base"
                value={vendorPayForm.payment_type}
                onChange={(e) => setVendorPayForm({ ...vendorPayForm, payment_type: e.target.value as VendorPaymentCreate["payment_type"] })}
              >
                <option value="advance">Advance</option>
                <option value="partial">Partial payment</option>
                <option value="final">Final settlement</option>
              </select>
            </div>
            <div>
              <label className="label-base">Transaction Reference</label>
              <input
                type="text"
                required
                className="input-base"
                value={vendorPayForm.transaction_reference}
                onChange={(e) => setVendorPayForm({ ...vendorPayForm, transaction_reference: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
          <div><label className="label-base">Payment Method</label><select required className="input-base" value={vendorPayForm.payment_method} onChange={(e) => setVendorPayForm({ ...vendorPayForm, payment_method: e.target.value })}><option>Bank Transfer</option><option>Cheque</option><option>UPI</option><option>Cash</option><option>Other</option></select></div>
            <div><label className="label-base">Payment Date</label><input required type="date" className="input-base" value={vendorPayForm.payment_date} onChange={(e) => setVendorPayForm({ ...vendorPayForm, payment_date: e.target.value })} /></div>
          </div>
          <div><label className="label-base">Notes (optional)</label><textarea rows={2} maxLength={500} className="input-base" value={vendorPayForm.notes || ""} onChange={(e) => setVendorPayForm({ ...vendorPayForm, notes: e.target.value })} /></div>
          <p className="text-[11px] text-muted-foreground">This records money already sent; it does not initiate a transfer. Enter the actual bank, cheque, UPI or receipt reference. Reusing a reference is rejected.</p>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setPayBillTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="font-bold">
              Save payment record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

