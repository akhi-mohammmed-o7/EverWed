import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Plus,
  Layers,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { QuoteComparison, Wedding, Vendor } from "@/types";
import { formatINR } from "@/lib/utils";
import { VENDOR_CATEGORIES } from "@/lib/constants";

export const QuotesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialWid = searchParams.get("wedding_id") || "wed-royal-jaipur-001";

  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>(initialWid);
  const [selectedCategory, setSelectedCategory] = useState<string>("Catering");
  const [comparison, setComparison] = useState<QuoteComparison | null>(null);
  const [registeredVendors, setRegisteredVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Quote Modal
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [newQuoteForm, setNewQuoteForm] = useState({
    vendor_id: "",
    pricing_type: "fixed" as "fixed" | "per_plate",
    unit_price: 500000,
    scope_of_work: "",
    inclusions_str: "Complete setup, On-site execution, Teardown",
    exclusions_str: "Late night extension fees",
    extra_hour_rate: 15000,
  });

  useEffect(() => {
    services.weddings.list().then((list) => {
      setWeddings(list);
      if (list.length > 0 && !selectedWeddingId) {
        setSelectedWeddingId(list[0].id);
      }
    });
    services.vendors.list().then((vList) => {
      setRegisteredVendors(vList);
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

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteForm.vendor_id) return;
    try {
      const currentWedding = weddings.find((w) => w.id === selectedWeddingId);
      const estQty = newQuoteForm.pricing_type === "per_plate" ? currentWedding?.guest_estimate || 450 : 1;
      await services.quotes.create({
        wedding_id: selectedWeddingId,
        vendor_id: newQuoteForm.vendor_id,
        category: selectedCategory,
        pricing_type: newQuoteForm.pricing_type,
        unit_price: Number(newQuoteForm.unit_price),
        estimated_quantity: estQty,
        scope_of_work: newQuoteForm.scope_of_work || `Professional ${selectedCategory} services for wedding celebration`,
        inclusions: newQuoteForm.inclusions_str.split(",").map((s) => s.trim()).filter(Boolean),
        exclusions: newQuoteForm.exclusions_str.split(",").map((s) => s.trim()).filter(Boolean),
        extra_hour_rate: Number(newQuoteForm.extra_hour_rate),
      });
      setIsNewQuoteModalOpen(false);
      setFeedbackMsg(`Successfully recorded new quotation for ${selectedCategory}.`);
      loadComparison(selectedWeddingId, selectedCategory);
    } catch (err: any) {
      console.error("Failed to add quote:", err);
    }
  };

  // Filter vendors matching current category
  const categoryVendors = registeredVendors.filter(
    (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Procurement & RFQ Engine
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Vendor Quotation & Bid Comparison
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparently normalizes per-plate rates, compares scope inclusions, and enforces single winning vendor contracts.
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

          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              setNewQuoteForm({
                vendor_id: categoryVendors[0]?.id || registeredVendors[0]?.id || "",
                pricing_type: selectedCategory === "Catering" ? "per_plate" : "fixed",
                unit_price: selectedCategory === "Catering" ? 4000 : 500000,
                scope_of_work: "",
                inclusions_str: "Dedicated team, Premium equipment, On-site coordination",
                exclusions_str: "Client side power supplies",
                extra_hour_rate: 15000,
              });
              setIsNewQuoteModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Bid / Quote
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Comparison Workspace */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Normalizing procurement quotes...
        </div>
      ) : !comparison || comparison.quotes.length === 0 ? (
        <Card className="p-10 text-center space-y-4">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              No Submitted Quotations in {selectedCategory}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              There are currently no competitive vendor bids recorded under {selectedCategory} for this wedding.
              You can log a proposal from any vetted supplier to compare terms side-by-side.
            </p>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              setNewQuoteForm({
                vendor_id: categoryVendors[0]?.id || registeredVendors[0]?.id || "",
                pricing_type: selectedCategory === "Catering" ? "per_plate" : "fixed",
                unit_price: selectedCategory === "Catering" ? 4200 : 600000,
                scope_of_work: `Complete ${selectedCategory} turnkey service for wedding`,
                inclusions_str: "Comprehensive package, Staff, Setup, Teardown",
                exclusions_str: "Out of state travel",
                extra_hour_rate: 12000,
              });
              setIsNewQuoteModalOpen(true);
            }}
            className="font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Log Quotation in {selectedCategory}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Explanation Strip */}
          <div className="p-4 bg-gold/10 rounded-2xl border border-gold/30 text-xs text-forest-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-gold-800 shrink-0" />
              <span>
                Normalized for <strong>{comparison.guest_count} guests</strong>. Per-plate rates multiplied by headcount to allow fair parity against fixed lump-sum packages.
              </span>
            </div>
            {comparison.lowest_quote_id && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 self-start sm:self-auto">
                Lowest Overall Total Identified
              </span>
            )}
          </div>

          {/* Cards Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparison.quotes.map((q) => {
              // Exact winning logic: Only quote with status === "selected" is the winning vendor!
              const isWinner = q.status === "selected";
              const isRejected = q.status === "rejected";
              const isLowest = q.quote_id === comparison.lowest_quote_id;

              return (
                <div
                  key={q.quote_id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    isWinner
                      ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-lg relative bg-emerald-50/15"
                      : isRejected
                      ? "border-border/80 bg-stone-50/60 opacity-85 hover:opacity-100"
                      : "border-border shadow-sm hover:border-gold/40"
                  }`}
                >
                  {isWinner && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-800 text-ivory text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <Trophy className="w-3.5 h-3.5 text-gold" /> Winning Contract Vendor
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start">
                      <Badge status={q.status} />
                      {isLowest && !isWinner && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Lowest Price Bid
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Alternate / Unselected
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-forest-900 mt-3">{q.vendor_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Category: {q.category}</p>

                    {/* Normalized Cost Box */}
                    <div className="mt-4 p-3.5 bg-ivory-100 rounded-xl border border-border/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Normalized Total Cost
                      </span>
                      <p className="font-serif text-2xl font-bold text-forest-900 mt-0.5">
                        {formatINR(q.normalized_total)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {q.pricing_type === "per_plate"
                          ? `₹${q.unit_price.toLocaleString()} per plate × ${q.estimated_quantity} guests`
                          : "Fixed Turnkey Lump-Sum"}
                      </p>
                    </div>

                    {/* Scope of Work */}
                    {q.scope_of_work && (
                      <div className="mt-3 text-xs text-forest-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                          Scope Summary
                        </span>
                        <p className="italic text-muted-foreground">{q.scope_of_work}</p>
                      </div>
                    )}

                    {/* Key Inclusions */}
                    <div className="mt-4 space-y-2 text-xs">
                      <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                        Included In Proposal
                      </p>
                      {q.inclusions.length === 0 ? (
                        <p className="text-muted-foreground italic">Standard turn-key delivery</p>
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

                  {/* Winner Action Button */}
                  <div className="mt-6 pt-4 border-t border-border/60">
                    {isWinner ? (
                      <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-emerald-300">
                        <Check className="w-4 h-4 text-emerald-700" />
                        Awarded Official Vendor Contract
                      </div>
                    ) : (
                      <Button
                        variant={isRejected ? "outline" : "gold"}
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => handleSelectWinner(q.quote_id)}
                      >
                        <Trophy className="w-3.5 h-3.5 mr-1" />
                        {isRejected ? "Re-Select As Winning Vendor" : "Award as Category Winner"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CREATE VENDOR QUOTE MODAL ── */}
      <Modal
        isOpen={isNewQuoteModalOpen}
        onClose={() => setIsNewQuoteModalOpen(false)}
        title={`Log Competitive Proposal — ${selectedCategory}`}
      >
        <form onSubmit={handleCreateQuote} className="space-y-4 text-xs font-sans">
          <div>
            <label className="label-base">Select Supplier / Vendor Partner</label>
            <select
              required
              className="input-base"
              value={newQuoteForm.vendor_id}
              onChange={(e) => setNewQuoteForm({ ...newQuoteForm, vendor_id: e.target.value })}
            >
              <option value="">Choose registered supplier...</option>
              {registeredVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category} — {v.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Pricing Model</label>
              <select
                className="input-base"
                value={newQuoteForm.pricing_type}
                onChange={(e) =>
                  setNewQuoteForm({
                    ...newQuoteForm,
                    pricing_type: e.target.value as "fixed" | "per_plate",
                  })
                }
              >
                <option value="fixed">Fixed Lump-Sum</option>
                <option value="per_plate">Per-Person / Per-Plate</option>
              </select>
            </div>
            <div>
              <label className="label-base">
                {newQuoteForm.pricing_type === "per_plate" ? "Unit Rate (Per Plate in ₹)" : "Total Fee (in ₹)"}
              </label>
              <input
                type="number"
                required
                min="0"
                step="500"
                className="input-base font-mono"
                value={newQuoteForm.unit_price}
                onChange={(e) => setNewQuoteForm({ ...newQuoteForm, unit_price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="label-base">Scope of Work Specification</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. 7-course royal feast with dessert studio and silver service"
              value={newQuoteForm.scope_of_work}
              onChange={(e) => setNewQuoteForm({ ...newQuoteForm, scope_of_work: e.target.value })}
            />
          </div>

          <div>
            <label className="label-base">Inclusions (Comma Separated)</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. Setup, Uniformed staff, Silver cutlery, Chafing dishes"
              value={newQuoteForm.inclusions_str}
              onChange={(e) => setNewQuoteForm({ ...newQuoteForm, inclusions_str: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Overtime Hourly Charge (₹/hr)</label>
              <input
                type="number"
                min="0"
                className="input-base font-mono"
                value={newQuoteForm.extra_hour_rate}
                onChange={(e) => setNewQuoteForm({ ...newQuoteForm, extra_hour_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label-base">Key Exclusions</label>
              <input
                type="text"
                className="input-base"
                placeholder="e.g. Imported liquor"
                value={newQuoteForm.exclusions_str}
                onChange={(e) => setNewQuoteForm({ ...newQuoteForm, exclusions_str: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewQuoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" className="font-bold">
              Save Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
