import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Star,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/services";
import type { Quote } from "@/types";
import { formatINR, getActiveWeddingId } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export const CoupleVendorsPage: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activeId = user?.wedding_id || getActiveWeddingId();
    if (!activeId) { setQuotes([]); setIsLoading(false); return; }
    services.quotes.list(activeId)
      .then((list) => {
        setQuotes(list.filter((q) => q.status === "selected"));
        setIsLoading(false);
      })
      .catch((error) => { console.error("Unable to load this wedding's vendors:", error); setQuotes([]); setIsLoading(false); });
  }, [user?.wedding_id]);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
          Curated Specialists
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
          Contracted Wedding Vendors
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          The verified luxury artisans, caterers, designers, and performers approved for your wedding.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading approved vendors...</div>
      ) : quotes.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground">
          Vendor quotations are currently undergoing RFP review by your planning team.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map((q) => (
            <Card key={q.id} className="p-6 flex flex-col justify-between hover:border-gold/50 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-gold-800 bg-gold/10 px-2.5 py-0.5 rounded-full">
                    {q.vendor_category}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Contract Signed
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-forest-900 mt-3">{q.vendor_name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{q.scope_of_work}</p>

                {/* Key inclusions */}
                {q.inclusions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Key Inclusions Approved
                    </p>
                    <div className="space-y-1.5 text-xs text-forest-800">
                      {q.inclusions.map((inc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-600" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">Procurement Allocation:</span>
                <span className="font-serif text-xl font-bold text-forest-900">{formatINR(q.normalized_total)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

