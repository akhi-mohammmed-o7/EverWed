import React, { useEffect, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Calendar,
  CreditCard,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Wedding, ClientPayment } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";

export const CoupleBudgetPage: React.FC = () => {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    services.weddings.get("wed-royal-jaipur-001").then(async (w) => {
      setWedding(w);
      const list = await services.finance.listClientPayments(w.id);
      setPayments(list);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !wedding) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading payment schedule...</div>;
  }

  const totalContract = wedding.budget_allocated;
  const totalPaid = payments
    .filter((p) => ["received", "verified"].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalContract - totalPaid);
  const paidPercent = totalContract > 0 ? Math.min(100, Math.round((totalPaid / totalContract) * 100)) : 0;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
          Financial Transparency
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          Wedding Budget & Milestone Payment Schedule
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Agreed package contract value and validated bank receipts for Aisha & Vikram.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Agreed Wedding Contract"
          value={formatINR(totalContract)}
          subtitle="Fixed full-service package"
          icon={<DollarSign className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Total Paid to Date"
          value={formatINR(totalPaid)}
          subtitle={`${paidPercent}% milestone completed`}
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Remaining Balance"
          value={formatINR(remaining)}
          subtitle="Due upon final banquet settlement"
          icon={<Receipt className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-semibold text-forest-900">Milestone Payment Progress ({paidPercent}%)</span>
          <span className="text-muted-foreground">{formatINR(totalPaid)} / {formatINR(totalContract)}</span>
        </div>
        <div className="w-full h-3 bg-ivory-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      </Card>

      {/* Payment Vouchers Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <CardHeader className="bg-ivory-100/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="font-serif text-base font-bold text-forest-900">Validated Payment Receipts</h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {payments.length} Transactions
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Milestone Stage</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.map((p) => (
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
                  <td className="py-3.5 px-4 text-muted-foreground italic">{p.notes || "Official agency voucher issued"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
