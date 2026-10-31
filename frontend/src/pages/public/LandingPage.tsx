import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Heart,
  CheckCircle,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  Compass,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PACKAGE_TIERS, WEDDING_TRADITIONS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { BurgundySilkShader } from "@/components/shaders/BurgundySilkShader";
import { GoldParticles } from "@/components/animations/GoldParticles";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { RevealOnScroll, StaggerContainer, StaggerItem } from "@/components/animations/RevealOnScroll";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory-50 text-forest-900 font-sans flex flex-col selection:bg-gold/30 selection:text-forest-950">
      <Navbar />

      {/*
       * ── Hero Section ─────────────────────────────────────────────────────
       *
       * Strict z-index layering:
       *   z-0  : BurgundySilkShader  (WebGL canvas, pointer-events:none)
       *   z-5  : GoldParticles       (canvas, pointer-events:none)
       *   z-8  : gradient scrims     (divs,   pointer-events:none)
       *   z-10 : hero foreground     (all interactive content)
       *
       * The shader layer NEVER overlaps or intercepts pointer events.
       */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden text-ivory pt-16 pb-24 md:pt-20 md:pb-32"
        style={{ backgroundColor: "#0A0205" }}
      >
        {/* ── Layer 0: Burgundy Rose-Gold WebGL Silk Shader ── */}
        <BurgundySilkShader mouseInfluence={true} />

        {/* ── Layer 5: Rose-Gold Floating Particles ── */}
        <GoldParticles count={30} palette="rose-gold" />

        {/* ── Layer 8: Gradient scrims for text readability ── */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(10,2,5,0.78) 0%, transparent 100%)",
            zIndex: 8,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(10,2,5,0.90) 0%, transparent 100%)",
            zIndex: 8,
          }}
        />

        {/*
         * ── Layer 10: ALL foreground content — buttons, headings, nav ──
         * This container has its own stacking context (position:relative + z-index).
         * Nothing from the shader layers reaches above z-8.
         * Pointer events work normally for every element inside.
         */}
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          style={{ position: "relative", zIndex: 10 }}
        >
          {/* Badge */}
          <RevealOnScroll variant="fadeIn" delay={0.1}>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 uppercase tracking-widest shadow-sm"
              style={{
                background: "rgba(201,161,74,0.12)",
                border: "1px solid rgba(201,161,74,0.45)",
                color: "#C9A14A",
                backdropFilter: "blur(8px)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: "#D4B870" }} />
              <span>Unified Wedding Operations &amp; Client OS</span>
            </div>
          </RevealOnScroll>

          {/* Headline */}
          <RevealOnScroll variant="fadeUp" delay={0.25} duration={0.9}>
            <h1
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.12]"
              style={{ color: "#F5EEE6", textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
            >
              Curate Grand Weddings.{" "}
              <br />
              <span
                className="italic font-normal"
                style={{
                  background: "linear-gradient(90deg, #D4B870 0%, #C9A14A 45%, #E8D09A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Command Every Minute.
              </span>
            </h1>
          </RevealOnScroll>

          {/* Tagline */}
          <RevealOnScroll variant="fadeUp" delay={0.4} duration={0.85}>
            <p
              className="mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light"
              style={{ color: "rgba(245,238,230,0.82)" }}
            >
              The luxury platform engineered for contemporary couples and
              high-end wedding planning agencies in Jaipur, Udaipur, and beyond.
            </p>
          </RevealOnScroll>

          {/*
           * ── CTA Buttons ────────────────────────────────────────────────
           * Both wrapped in <Link> so they are fully navigable.
           * MagneticButton handles its own spring transform in isolation.
           * No shader transform, filter, or displacement touches these elements.
           */}
          <RevealOnScroll variant="fadeUp" delay={0.55}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">

              {/* Primary: champagne-gold bg + deep burgundy text */}
              <Link to="/register/couple" style={{ position: "relative", zIndex: 10 }}>
                <MagneticButton
                  variant="gold"
                  size="lg"
                  shine={true}
                  className="w-full sm:w-auto font-bold"
                  style={{
                    backgroundColor: "#C9A14A",
                    color: "#2D0A14",
                    border: "1px solid rgba(212,184,112,0.6)",
                    boxShadow: "0 8px 32px rgba(201,161,74,0.28)",
                  }}
                >
                  <span>Begin Couple Registration</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </MagneticButton>
              </Link>

              {/* Secondary: dark-burgundy tint + champagne border + ivory text */}
              <Link to="/login/planner" style={{ position: "relative", zIndex: 10 }}>
                <MagneticButton
                  variant="secondary"
                  size="lg"
                  shine={false}
                  className="w-full sm:w-auto font-semibold"
                  style={{
                    backgroundColor: "rgba(45,10,20,0.45)",
                    color: "#F5EEE6",
                    border: "1px solid rgba(201,161,74,0.42)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Shield className="w-4 h-4 mr-1.5" style={{ color: "#C9A14A" }} />
                  <span>Open Planner Workspace</span>
                </MagneticButton>
              </Link>
            </div>
          </RevealOnScroll>

          {/* Key Metrics Strip */}
          <RevealOnScroll variant="fadeUp" delay={0.72}>
            <div
              className="mt-16 pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left p-6 rounded-2xl"
              style={{
                borderTop: "1px solid rgba(201,161,74,0.20)",
                background: "rgba(10,2,5,0.42)",
                border: "1px solid rgba(201,161,74,0.18)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(245,238,230,0.55)" }}>Operational Precision</p>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold mt-1 flex items-baseline" style={{ color: "#C9A14A" }}>
                  <AnimatedCounter value={25} suffix="+" duration={1.8} />
                  <span className="text-lg ml-1 font-sans font-normal" style={{ color: "rgba(245,238,230,0.70)" }}>Playbooks</span>
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,238,230,0.50)" }}>Pre-engineered tasks</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(245,238,230,0.55)" }}>Quote Engine</p>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold mt-1 flex items-baseline" style={{ color: "#C9A14A" }}>
                  <AnimatedCounter value={100} suffix="%" duration={1.6} />
                  <span className="text-lg ml-1 font-sans font-normal" style={{ color: "rgba(245,238,230,0.70)" }}>Normalized</span>
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,238,230,0.50)" }}>Fair per-plate comparison</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(245,238,230,0.55)" }}>Financial Integrity</p>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold mt-1 flex items-baseline" style={{ color: "#C9A14A" }}>
                  <span>Zero</span>
                  <span className="text-lg ml-1.5 font-sans font-normal" style={{ color: "rgba(245,238,230,0.70)" }}>Variance</span>
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,238,230,0.50)" }}>Mandatory bill audits</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(245,238,230,0.55)" }}>Platform Sync</p>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold mt-1 flex items-baseline" style={{ color: "#C9A14A" }}>
                  <span>Odoo</span>
                  <span className="text-lg ml-1 font-sans font-normal" style={{ color: "rgba(245,238,230,0.70)" }}>XML-RPC</span>
                </h4>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,238,230,0.50)" }}>Dual-mode resilience</p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 2. Cultural Traditions Section: 8 Wedding Archetypes ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll variant="fadeUp">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-700 bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
              Cultural Customization
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-forest-900 mt-4 tracking-tight">
              Tailored to Your Heritage & Traditions
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Every family celebration carries sacred roots. Select, customize, or craft your multi-day rituals freely with intelligent ceremony templates.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerChildren={0.08}>
          {WEDDING_TRADITIONS.map((tradition) => (
            <StaggerItem key={tradition.id}>
              <Link
                to="/register/couple"
                className="group bg-white rounded-2xl border border-border p-6 hover:border-gold hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
              >
                {/* Subtle gold accent glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl group-hover:bg-gold/15 transition-all duration-300 pointer-events-none" />

                <div>
                  <div className="w-12 h-12 rounded-xl bg-ivory-100 border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    {tradition.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-forest-900 mt-4 group-hover:text-forest-950 transition-colors">
                    {tradition.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {tradition.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gold-800 bg-gold/15 px-2.5 py-0.5 rounded-md border border-gold/20">
                    {tradition.badge}
                  </span>
                  <span className="text-xs font-bold text-forest-800 flex items-center gap-1 group-hover:text-gold-700 transition-colors">
                    Plan <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── 3. Packages Section: Curated Luxury Wedding Packages ── */}
      <section className="py-24 bg-gradient-to-b from-ivory-100 to-ivory-200/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll variant="fadeUp">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-700 bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                Transparent Pricing
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-forest-900 mt-4 tracking-tight">
                Curated Luxury Wedding Packages
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3">
                Clear deliverables, dedicated operational teams, and zero hidden markups.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PACKAGE_TIERS.map((pkg, idx) => (
              <RevealOnScroll key={pkg.id} variant="fadeUp" delay={idx * 0.15}>
                <div
                  className={`bg-white rounded-3xl border p-8 flex flex-col justify-between h-full transition-all duration-300 relative ${
                    pkg.highlighted
                      ? "border-gold shadow-2xl ring-2 ring-gold/40 scale-105 z-10 bg-gradient-to-b from-white via-white to-ivory-50"
                      : "border-border shadow-md hover:border-gold/40 hover:shadow-xl"
                  }`}
                >
                  {pkg.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-forest-900 text-gold text-[10px] font-bold uppercase tracking-widest border border-gold/50 shadow-md">
                      {pkg.badge}
                    </span>
                  )}
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-forest-900">{pkg.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{pkg.tier}</p>
                      </div>
                    </div>

                    <div className="mt-6 pb-6 border-b border-border">
                      <div className="flex items-baseline">
                        <span className="font-serif text-3xl sm:text-4xl font-bold text-forest-900">
                          {formatINR(pkg.base_price)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">base tier</span>
                      </div>
                      <p className="text-xs text-forest-700 mt-3 leading-relaxed">{pkg.description}</p>
                    </div>

                    <div className="mt-6 space-y-3">
                      {pkg.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs text-forest-800">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 pt-4">
                    <Link to="/register/couple">
                      <MagneticButton
                        variant={pkg.highlighted ? "gold" : "outline"}
                        size="md"
                        shine={pkg.highlighted}
                        className="w-full font-bold shadow-sm"
                      >
                        <span>Select {pkg.name}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </MagneticButton>
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Dual Experience Section (Couple Sanctuary vs Planner Operations) ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll variant="fadeUp">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-gold-700 bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
              Bespoke Interfaces
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-forest-900 mt-4 tracking-tight">
              Dual Experience Sanctuary
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3">
              One shared truth, two purposefully crafted perspectives for couples and planners.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Couple Sanctuary Card */}
          <RevealOnScroll variant="slideIn" delay={0.1}>
            <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 shadow-lg hover:border-gold/40 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-terracotta border border-rose-100 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Heart className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">Couple Sanctuary Portal</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  A warm, editorial experience where couples review ceremonies, configure bespoke service tiers, manage VIP guest lists & RSVPs, track milestones, and view ceremony schedules.
                </p>

                <div className="mt-8 space-y-3 text-xs text-forest-800">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-ivory-100/80 border border-border/40">
                    <Calendar className="w-4 h-4 text-gold-700 shrink-0" />
                    <span>Real-time ceremony timeline & countdown for Baraat & Varmala</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-ivory-100/80 border border-border/40">
                    <CheckCircle className="w-4 h-4 text-gold-700 shrink-0" />
                    <span>Dynamic RSVP & dietary requirements tracking</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-ivory-100/80 border border-border/40">
                    <DollarSign className="w-4 h-4 text-gold-700 shrink-0" />
                    <span>Transparent milestone payments and digital contract downloads</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-4">
                <Link to="/couple/dashboard">
                  <MagneticButton variant="secondary" size="md" className="w-full font-bold">
                    <span>Explore Couple Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </MagneticButton>
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          {/* Planner Operations Card */}
          <RevealOnScroll variant="slideIn" delay={0.25}>
            <div className="bg-forest-950 text-ivory rounded-3xl border border-forest-800 p-8 sm:p-10 shadow-2xl flex flex-col justify-between h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gold/20 text-gold border border-gold/30 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Shield className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ivory">Planner Operations Workspace</h3>
                <p className="text-sm text-ivory-200/90 mt-3 leading-relaxed">
                  Engineered for high-intensity agency execution: CRM pipeline, vendor quote normalization, day-of live operations command, and agency profit statements with Odoo ERP audit sync.
                </p>

                <div className="mt-8 space-y-3 text-xs text-ivory-200">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-forest-900/80 border border-forest-800">
                    <Clock className="w-4 h-4 text-gold shrink-0" />
                    <span>Minute-by-minute Baraat, Varmala & Pheras coordinator run sheets</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-forest-900/80 border border-forest-800">
                    <TrendingUp className="w-4 h-4 text-gold shrink-0" />
                    <span>Late vendor arrival alerts, incident resolution & delay logs</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-forest-900/80 border border-forest-800">
                    <FileText className="w-4 h-4 text-gold shrink-0" />
                    <span>Mandatory zero-variance audit rules on vendor invoices</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-4">
                <Link to="/planner">
                  <MagneticButton variant="gold" size="md" shine={true} className="w-full font-bold">
                    <span>Enter Planner Workspace</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </MagneticButton>
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 5. Operational Command & Why EverWed Section ── */}
      <section className="py-24 bg-forest-900 text-ivory border-t border-forest-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D7B875_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RevealOnScroll variant="fadeUp">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-gold bg-gold/20 px-3 py-1 rounded-full border border-gold/40">
                Enterprise Reliability
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 tracking-tight">
                Operational Command. Built for Perfection.
              </h2>
              <p className="text-sm sm:text-base text-ivory-300 mt-3">
                Why premier destination wedding planners in Rajasthan trust EverWed for high-stakes celebrations.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealOnScroll variant="fadeUp" delay={0.1}>
              <div className="bg-forest-950/60 border border-forest-800 p-6 rounded-2xl hover:border-gold/40 transition-all">
                <Clock className="w-8 h-8 text-gold mb-4" />
                <h4 className="font-serif text-lg font-bold text-ivory">Minute-by-Minute Timeline</h4>
                <p className="text-xs text-ivory-300 mt-2 leading-relaxed">
                  Real-time synchronization for Baraat arrival, Varmala pyro cues, and pheras. Auto-detects coordinator and vendor delays.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll variant="fadeUp" delay={0.2}>
              <div className="bg-forest-950/60 border border-forest-800 p-6 rounded-2xl hover:border-gold/40 transition-all">
                <Compass className="w-8 h-8 text-gold mb-4" />
                <h4 className="font-serif text-lg font-bold text-ivory">Fair Per-Plate Quotes</h4>
                <p className="text-xs text-ivory-300 mt-2 leading-relaxed">
                  Normalized quotation comparison engine. Accurately evaluates catering per-plate against fixed decor contracts.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll variant="fadeUp" delay={0.3}>
              <div className="bg-forest-950/60 border border-forest-800 p-6 rounded-2xl hover:border-gold/40 transition-all">
                <Award className="w-8 h-8 text-gold mb-4" />
                <h4 className="font-serif text-lg font-bold text-ivory">Zero Variance Audits</h4>
                <p className="text-xs text-ivory-300 mt-2 leading-relaxed">
                  Prevents vendor double-billing, untracked line-items, and unapproved change orders before payment dispatch.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll variant="fadeUp" delay={0.4}>
              <div className="bg-forest-950/60 border border-forest-800 p-6 rounded-2xl hover:border-gold/40 transition-all">
                <Shield className="w-8 h-8 text-gold mb-4" />
                <h4 className="font-serif text-lg font-bold text-ivory">Odoo ERP Resilience</h4>
                <p className="text-xs text-ivory-300 mt-2 leading-relaxed">
                  Local-first wedding management with persistent SQLite storage and optional Odoo connectivity when configured.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll variant="scaleIn">
          <div className="rounded-3xl bg-gradient-to-r from-forest-950 via-forest-900 to-forest-950 p-10 sm:p-14 text-center border border-gold/40 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,182,111,0.12)_0%,_transparent_70%)] pointer-events-none" />
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ivory relative z-10">
              Ready to Orchestrate Your Grand Celebration?
            </h2>
            <p className="text-sm sm:text-base text-ivory-200 mt-4 max-w-xl mx-auto relative z-10 leading-relaxed font-light">
              Experience the pinnacle of wedding management technology. Begin with our interactive setup wizard or enter the agency workspace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/register/couple">
                <MagneticButton variant="gold" size="lg" shine={true} className="w-full sm:w-auto font-bold shadow-lg">
                  <span>Start Couple Registration</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </MagneticButton>
              </Link>
              <Link to="/login/planner">
                <MagneticButton variant="secondary" size="lg" className="w-full sm:w-auto text-ivory border-ivory/30 bg-forest-800/80">
                  <span>Open Planner Dashboard</span>
                </MagneticButton>
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="mt-auto bg-forest-950 text-ivory-400 py-12 border-t border-forest-900 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-serif text-lg text-gold font-bold mb-2 tracking-wide">
            EverWed • Luxury Wedding Operations & Planning Platform
          </p>
          <p className="text-ivory-300/80 max-w-lg mx-auto">
            Your Forever, Our Planning. Engineered for palace destinations, five-star heritage hotels, and premier celebration management.
          </p>
          <p className="mt-6 text-[11px] text-ivory-400/60">
            © 2026 EverWed. Built for Odoo Hackathon. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
