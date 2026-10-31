import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingDown,
  Layers,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";
import type { QuoteComparison, Wedding } from "@/types";
import { formatINR } from "@/lib/utils";
import { VENDOR_CATEGORIES } from "@/lib/constants";

export const QuotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialWid = searchParams.get("wedding_id") || "wed-royal-jaipur-001";

  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>(initialWid);
  const [selectedCategory, setSelectedCategory] = useState<string>("Catering");
  const [comparison, setComparison] = useState<QuoteComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !selectedWeddingId) {
        setSelectedWeddingId(list[0].id);
      }
    });
  }, []);

  const loadComparison = (wid: string, cat: string) => {
    setIsLoading(true);
    setFeedbackMsg(null);
    services.quotes
      .compare(wid, cat)
      .then((res) => setComparison(res))
      .catch((err) => {
        console.error(err);
        setComparison(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedWeddingId && selectedCategory) {
      loadComparison(selectedWeddingId, selectedCategory);
    }
  }, [selectedWeddingId, selectedCategory]);

  const handleSelectWinner = async (quoteId: string) => {
    try {
      const res = await services.quotes.selectWinner(quoteId);
      setFeedbackMsg(res.message);
      loadComparison(selectedWeddingId, selectedCategory);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Procurement & RFQ Engine
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Transparent Vendor Quote Comparison
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Normalizes per-plate rates against guest estimates to compare fairly against fixed quotes and audits trade-offs.
          </p>
        </div>

        {/* Wedding and Category Pickers */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="input-base py-1.5 text-xs w-auto font-medium"
            value={selectedWeddingId}
            onChange={(e) => setSelectedWeddingId(e.target.value)}
          >
            {weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} ({w.guest_estimate} guests)
              </option>
            ))}
          </select>

          <select
            className="input-base py-1.5 text-xs w-auto font-medium"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Comparison Workspace */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Normalizing quotes...</div>
      ) : !comparison || comparison.quotes.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-serif text-lg font-bold text-forest-900">
            No Submitted Quotations in {selectedCategory}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            There are currently no competitive vendor quotes recorded under {selectedCategory} for this wedding.
            Quotes can be entered directly from registered vendors.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Explanation Strip */}
          <div className="p-4 bg-gold/10 rounded-2xl border border-gold/30 text-xs text-forest-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-gold-800 shrink-0" />
              <span>
                Normalized for <strong>{comparison.guest_count} guests</strong>. Per-plate quotes multiplied by total guest headcount.
              </span>
            </div>
            {comparison.lowest_quote_id && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded self-start sm:self-auto">
                Lowest Quote Identified
              </span>
            )}
          </div>

          {/* Cards Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparison.quotes.map((q) => {
              const isWinner = q.is_winner;
              const isLowest = q.quote_id === comparison.lowest_quote_id;

              return (
                <div
                  key={q.quote_id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    isWinner
                      ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-lg relative bg-emerald-50/10"
                      : "border-border shadow-sm hover:border-gold/40"
                  }`}
                >
                  {isWinner && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-800 text-ivory text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Trophy className="w-3 h-3 text-gold" /> Winning Vendor
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start">
                      <Badge status={q.status} />
                      {isLowest && !isWinner && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Lowest Total Price
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-forest-900 mt-3">{q.vendor_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Category: {q.category}</p>

                    {/* Normalized Big Price */}
                    <div className="mt-4 p-3 bg-ivory-100 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Normalized Total Cost
                      </span>
                      <p className="font-serif text-2xl font-bold text-forest-900 mt-0.5">
                        {formatINR(q.normalized_total)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {q.pricing_type === "per_plate"
                          ? `₹${q.unit_price.toLocaleString()} × ${q.estimated_quantity} guests`
                          : "Fixed Lump-Sum Package"}
                      </p>
                    </div>

                    {/* Key Inclusions */}
                    <div className="mt-4 space-y-2 text-xs">
                      <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                        Included Services & Line Items
                      </p>
                      {q.inclusions.length === 0 ? (
                        <p className="text-muted-foreground italic">Standard service scope</p>
                      ) : (
                        q.inclusions.map((inc, i) => (
                          <div key={i} className="flex items-start gap-2 text-forest-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Overtime rate */}
                    {q.extra_hour_rate > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/60 text-xs text-forest-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gold-700" />
                        <span>Overtime Charge: {formatINR(q.extra_hour_rate)} / hr</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    {isWinner ? (
                      <div className="p-2.5 bg-emerald-100/60 text-emerald-900 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Selected for Wedding Contract
                      </div>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => handleSelectWinner(q.quote_id)}
                      >
                        <Trophy className="w-3.5 h-3.5 mr-1" />
                        Select As Winner
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

