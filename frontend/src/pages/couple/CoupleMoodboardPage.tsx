import React, { useState } from "react";
import { Palette, Sparkles, Heart, Plus, Download } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const initialBoards = [
  {
    id: "mb-1",
    title: "Vedic Mandap & Sacred Fire Setup",
    category: "Decor & Florals",
    palette: ["#173B32", "#D7B875", "#F7F3EC", "#B85C52"],
    notes: "Fresh Dutch red & peach roses, antique brass urli with floating marigolds, and crystal chandeliers suspended from palace trusses.",
    tags: ["Floral Mandap", "Amber Lighting", "Acoustic Stage"],
  },
  {
    id: "mb-2",
    title: "Vintage Baraat Grand Procession",
    category: "Logistics & Royal Protocol",
    palette: ["#B85C52", "#D7B875", "#173B32"],
    notes: "1938 Buick Convertible for the groom, brass band in royal Rajputana scarlet livery, and fresh rose petal confetti showers.",
    tags: ["Vintage Car", "Brass Band", "Petal Showers"],
  },
  {
    id: "mb-3",
    title: "Poolside Sunshine Haldi Carnival",
    category: "Day-of Celebrations",
    palette: ["#F59E0B", "#FCD34D", "#FFFFFF", "#10B981"],
    notes: "Yellow and lime marigold floral canopies, personalized cane sun-umbrellas, organic floral jewelry for the bride and sisters.",
    tags: ["Floral Jewelry", "Marigold Canopy", "Organic Haldi"],
  },
  {
    id: "mb-4",
    title: "Desert Beats Sangeet Ballroom",
    category: "Audio/Visual & Lighting",
    palette: ["#4C1D95", "#D7B875", "#0F172A"],
    notes: "Intelligent moving beam lights, LED dance floor, line-array concert acoustics, and cold-fire pyro spark fountains.",
    tags: ["Concert Sound", "LED Stage", "Cold-Fire Pyro"],
  },
];

export const CoupleMoodboardPage: React.FC = () => {
  const [boards, setBoards] = useState(initialBoards);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Aesthetic Direction
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Visual Moodboard & Creative Renders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Color palettes, floral styling renders, and architectural themes curated for The Royal Knot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boards.map((b) => (
          <Card key={b.id} className="p-6 flex flex-col justify-between hover:border-gold/50 transition-all">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gold-800 bg-gold/10 px-2.5 py-0.5 rounded-full">
                  {b.category}
                </span>
                <button className="text-muted-foreground hover:text-rose-600 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-serif text-xl font-bold text-forest-900 mt-3">{b.title}</h3>
              <p className="text-xs text-forest-700 mt-2 leading-relaxed">{b.notes}</p>

              {/* Color Swatches */}
              <div className="mt-5 pt-4 border-t border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Curated Color Palette
                </span>
                <div className="flex items-center gap-2">
                  {b.palette.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs border border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[9px] font-mono text-muted-foreground">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {b.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] font-medium bg-ivory-100 text-forest-800 px-2.5 py-1 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

