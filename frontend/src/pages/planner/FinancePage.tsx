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
} from "lucide-react";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type {
  Wedding,
  ClientPayment,
  VendorBill,
  FinancialSummary,
  ClientPaymentCreate,
  VendorBillCreate,
  VendorPaymentCreate,
  Vendor,
} from "@/types";
import { formatINR, formatINRFull, formatDate } from "@/lib/utils";
import { PAYMENT_STAGES } from "@/lib/constants";

export const FinancePage: React.FC = () => {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWid, setSelectedWid] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"summary" | "client" | "vendor">("summary");

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
  const [vendorPayForm, setVendorPayForm] = useState<VendorPaymentCreate>({
    bill_id: "",
    amount: 0,
    payment_type: "final",
    payment_method: "Bank Transfer",
    transaction_reference: `TXN-VEND-${Date.now().toString().slice(-6)}`,
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !selectedWid) {
        setSelectedWid(list[0].id);
      }
    });
    services.vendors.list().then((vList) => setVendors(vList));
  }, []);

  const loadFinanceData = async (wid: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [sum, cp, vb] = await Promise.all([
        services.finance.getFinancialSummary(wid),
        services.finance.listClientPayments(wid),
        services.finance.listVendorBills(wid),
      ]);
      setSummary(sum);
      setClientPayments(cp);
      setVendorBills(vb);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWid) {
      loadFinanceData(selectedWid);
      setClientPayForm((prev) => ({ ...prev, wedding_id: selectedWid }));
      setVendorBillForm((prev) => ({ ...prev, wedding_id: selectedWid }));
    }
  }, [selectedWid]);

  const handleRecordClientPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.finance.recordClientPayment(clientPayForm);
      setIsClientPaymentOpen(false);
      setSuccessMsg(`Client payment of ₹${clientPayForm.amount.toLocaleString()} recorded successfully.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record client payment");
    }
  };

  const handleRecordVendorBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await services.finance.recordVendorBill(vendorBillForm);
      setIsVendorBillOpen(false);
      setSuccessMsg(`Vendor bill '${vendorBillForm.bill_number}' recorded successfully.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record vendor bill");
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
      setSuccessMsg(`Vendor disbursement of ₹${vendorPayForm.amount.toLocaleString()} completed.`);
      loadFinanceData(selectedWid);
    } catch (err: any) {
      setErrorMsg(err.message || "Payment rejected by financial control rules");
    }
  };

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
            Strict accounting controls: client receivables, vendor payables, mandatory invoice variance explanation, and net agency margin.
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

          <Button variant="secondary" size="sm" onClick={() => setIsClientPaymentOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Client Payment
          </Button>

          <Button variant="gold" size="sm" onClick={() => setIsVendorBillOpen(true)} className="font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Record Vendor Invoice
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
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Contract Value"
              value={formatINR(summary.total_contract_value)}
              subtitle={`Client Status: ${summary.client_payment_status.toUpperCase()}`}
              icon={<DollarSign className="w-5 h-5 text-forest-800" />}
            />
            <StatCard
              title="Client Collected"
              value={formatINR(summary.client_paid_amount)}
              subtitle={`Receivable: ${formatINR(summary.client_outstanding_receivable)}`}
              icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Vendor Invoices (Actual)"
              value={formatINR(summary.actual_vendor_bills_total || summary.agreed_vendor_total)}
              subtitle={`Outstanding Payables: ${formatINR(summary.vendor_outstanding_payable)}`}
              icon={<Receipt className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Net Agency Profit"
              value={formatINR(summary.net_agency_profit)}
              subtitle={`Operating Margin: ${summary.profit_margin_percentage.toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
              className="bg-emerald-50/50 border-emerald-300"
            />
          </div>

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
              All Vendor Invoices & Bills ({vendorBills.length})
            </button>
            <button
              onClick={() => setActiveSection("client")}
              className={`pb-2.5 border-b-2 transition-colors ${
                activeSection === "client"
                  ? "border-forest-800 text-forest-900 font-bold"
                  : "border-transparent text-muted-foreground hover:text-forest-800"
              }`}
            >
              Client Payment Transactions ({clientPayments.length})
            </button>
          </div>

          {/* SECTION: VENDOR BILLS */}
          {activeSection === "summary" && (
            <Card className="p-0 overflow-hidden shadow-sm">
              <CardHeader className="bg-ivory-100/50">
                <div>
                  <h3 className="font-serif text-base font-bold text-forest-900">Recorded Vendor Invoices</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Invoices audited against agreed quotations. Variance explanations enforced.
                  </p>
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
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Disbursement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {vendorBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-ivory-50/70 transition-colors">
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
                                setVendorPayForm((prev) => ({
                                  ...prev,
                                  bill_id: bill.id,
                                  amount: bill.outstanding_balance,
                                }));
                              }}
                            >
                              Pay Bill
                            </Button>
                          ) : (
                            <span className="text-emerald-700 text-xs font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* SECTION: CLIENT PAYMENTS */}
          {activeSection === "client" && (
            <Card className="p-0 overflow-hidden shadow-sm">
              <CardHeader className="bg-ivory-100/50">
                <div>
                  <h3 className="font-serif text-base font-bold text-forest-900">Client Inflow Vouchers</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Staged deposit and advance milestone payments received from couple/family.
                  </p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Record Client Payment Modal */}
      <Modal
        isOpen={isClientPaymentOpen}
        onClose={() => setIsClientPaymentOpen(false)}
        title="Record Staged Client Payment"
        subtitle="Log client milestone deposits, advances, or final settlements."
      >
        <form onSubmit={handleRecordClientPayment} className="space-y-3.5 text-xs">
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
                <option value="Card">Credit/Debit Card</option>
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
            <Button type="submit" variant="gold">
              Record Inflow
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Vendor Bill Modal (Enforces Variance Rule) */}
      <Modal
        isOpen={isVendorBillOpen}
        onClose={() => setIsVendorBillOpen(false)}
        title="Record Vendor Invoice & Bill"
        subtitle="Mandatory rule: If invoiced amount > agreed quote price, an explicit variance reason must be entered."
      >
        <form onSubmit={handleRecordVendorBill} className="space-y-3.5 text-xs">
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
            <Button type="submit" variant="gold">
              Audit & Record Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Vendor Bill Modal (Enforces Overpayment Prevention) */}
      <Modal
        isOpen={!!payBillTarget}
        onClose={() => setPayBillTarget(null)}
        title="Disburse Vendor Payment"
        subtitle={`Invoice: ${payBillTarget?.bill_number} • Vendor: ${payBillTarget?.vendor_name}`}
      >
        <form onSubmit={handleRecordVendorPayment} className="space-y-3.5 text-xs">
          <div className="p-3 bg-ivory-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Remaining Unpaid Balance:</span>
            <span className="font-serif font-bold text-forest-900 text-base">
              {payBillTarget && formatINR(payBillTarget.outstanding_balance)}
            </span>
          </div>
          <div>
            <label className="label-base">Disbursement Amount (INR)</label>
            <input
              type="number"
              required
              max={payBillTarget?.outstanding_balance}
              className="input-base"
              value={vendorPayForm.amount}
              onChange={(e) => setVendorPayForm({ ...vendorPayForm, amount: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Payment cannot exceed remaining bill balance ({payBillTarget && formatINR(payBillTarget.outstanding_balance)}).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Payment Type</label>
              <select
                className="input-base"
                value={vendorPayForm.payment_type}
                onChange={(e) => setVendorPayForm({ ...vendorPayForm, payment_type: e.target.value })}
              >
                <option value="advance">Advance Voucher</option>
                <option value="final">Final Settlement</option>
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
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setPayBillTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="font-bold">
              Confirm Disbursement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

