import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  HelpCircle,
  Save,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  WEDDING_TRADITIONS,
  CEREMONY_TEMPLATES,
  PACKAGE_TIERS,
  SERVICE_CATEGORIES,
  DESTINATIONS,
} from "@/lib/constants";
import { formatINR, formatINRFull } from "@/lib/utils";
import { services } from "@/services";

interface CustomEventForm {
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_hall: string;
  guest_estimate: number;
}

export const WeddingBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPackage = searchParams.get("package") || "signature";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTradition, setSelectedTradition] = useState<string>("hindu");
  const [selectedPackage, setSelectedPackage] = useState<string>(initialPackage);
  const [guestCount, setGuestCount] = useState<number>(450);
  const [destination, setDestination] = useState<string>("Jaipur");
  const [targetDate, setTargetDate] = useState<string>("2026-12-10");
  const [brideName, setBrideName] = useState<string>("Aisha Sharma");
  const [groomName, setGroomName] = useState<string>("Vikram Singh Rathore");

  // Selected events
  const [events, setEvents] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      start_time: string;
      end_time: string;
      venue_hall: string;
      guest_estimate: number;
    }>
  >(() => {
    const list = CEREMONY_TEMPLATES["hindu"] || [];
    return list.map((item, i) => ({
      id: `evt-init-${i}`,
      name: item.name,
      description: item.description,
      start_time: "16:00",
      end_time: "20:00",
      venue_hall: item.typical_hall,
      guest_estimate: 450,
    }));
  });

  // Selected add-on services
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    venue: true,
    catering: true,
    decor: true,
    photography: true,
    entertainment: true,
  });

  // Modal for Custom Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<CustomEventForm>({
    name: "",
    description: "",
    date: targetDate,
    start_time: "17:00",
    end_time: "21:00",
    venue_hall: "Royal Palace Courtyard",
    guest_estimate: guestCount,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle tradition change and reset starter templates
  const handleSelectTradition = (tId: string) => {
    setSelectedTradition(tId);
    const list = CEREMONY_TEMPLATES[tId] || [];
    setEvents(
      list.map((item, i) => ({
        id: `evt-${tId}-${i}`,
        name: item.name,
        description: item.description,
        start_time: "16:00",
        end_time: "20:00",
        venue_hall: item.typical_hall,
        guest_estimate: guestCount,
      }))
    );
  };

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: `evt-custom-${Date.now()}`,
        name: newEvent.name,
        description: newEvent.description,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        venue_hall: newEvent.venue_hall,
        guest_estimate: newEvent.guest_estimate || guestCount,
      },
    ]);
    setIsEventModalOpen(false);
    setNewEvent({
      name: "",
      description: "",
      date: targetDate,
      start_time: "17:00",
      end_time: "21:00",
      venue_hall: "Royal Palace Courtyard",
      guest_estimate: guestCount,
    });
  };

  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  // Live Cost Calculation
  const costBreakdown = useMemo(() => {
    const pkg = PACKAGE_TIERS.find((p) => p.id === selectedPackage) || PACKAGE_TIERS[1];
    const basePrice = pkg.base_price;

    // Additional events over package limit
    const extraEventsCount = Math.max(0, events.length - pkg.events_covered);
    const extraEventCharge = extraEventsCount * 250000;

    // Add-on service calculations
    let addOnTotal = 0;
    const servicesList: Array<{ name: string; cost: number }> = [];

    SERVICE_CATEGORIES.forEach((svc) => {
      if (selectedServices[svc.id]) {
        let cost = svc.default_price;
        if (svc.id === "catering") {
          cost = svc.default_price * guestCount; // Per-plate calculation
        }
        addOnTotal += cost;
        servicesList.push({ name: svc.name, cost });
      }
    });

    const subtotal = basePrice + extraEventCharge + addOnTotal;
    const gstTax = Math.round(subtotal * 0.18);
    const totalEstimate = subtotal + gstTax;

    return {
      basePrice,
      extraEventsCount,
      extraEventCharge,
      addOnTotal,
      servicesList,
      subtotal,
      gstTax,
      totalEstimate,
    };
  }, [selectedPackage, events.length, selectedServices, guestCount]);

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    try {
      const wid = `wed-${Date.now().toString(36)}`;
      await services.weddings.create({
        title: `The Royal Union: ${brideName} & ${groomName}`,
        bride_name: brideName,
        groom_name: groomName,
        contact_phone: "+91 98290 12345",
        contact_email: "couple@heritageknot.com",
        destination,
        primary_venue: `Palace Grounds, ${destination}`,
        package_type: selectedPackage,
        guest_estimate: guestCount,
        theme: "Royal Heritage",
        budget_allocated: costBreakdown.totalEstimate,
        start_date: targetDate,
        end_date: "2026-12-14",
      });

      // Save events
      for (const ev of events) {
        await services.events.create(wid, {
          name: ev.name,
          date: targetDate,
          start_time: ev.start_time,
          end_time: ev.end_time,
          venue_hall: ev.venue_hall,
          coordinator_name: "Pooja Verma",
          guest_estimate: ev.guest_estimate,
          notes: ev.description,
        });
      }

      navigate("/couple/dashboard");
    } catch (err) {
      console.error(err);
      navigate("/couple/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      {/* Builder Wizard Header */}
      <div className="bg-white border-b border-border sticky top-16 z-30 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2 py-0.5 rounded">
              Interactive Setup Wizard
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mt-1">
              Curate Your Bespoke Wedding Celebration
            </h1>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { num: 1, label: "Tradition" },
              { num: 2, label: "Ceremonies" },
              { num: 3, label: "Package" },
              { num: 4, label: "Services" },
              { num: 5, label: "Cost Review" },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  currentStep === step.num
                    ? "bg-forest-800 text-ivory shadow-xs"
                    : currentStep > step.num
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "text-muted-foreground hover:bg-ivory-100"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === step.num ? "bg-gold text-forest-900" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {currentStep > step.num ? "✓" : step.num}
                </span>
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Step Body */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: TRADITION */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Step 1 — Choose Cultural Traditions</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the wedding ritual heritage that resonates with you. All sequences are customizable.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WEDDING_TRADITIONS.map((tradition) => (
                  <div
                    key={tradition.id}
                    onClick={() => handleSelectTradition(tradition.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedTradition === tradition.id
                        ? "border-forest-800 bg-forest-900/5 ring-1 ring-forest-800 shadow-xs"
                        : "border-border hover:border-gold/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{tradition.icon}</span>
                        {selectedTradition === tradition.id && (
                          <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base font-bold text-forest-900 mt-3">{tradition.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tradition.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Couple & Basic Info Form */}
              <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Bride's Full Name</label>
                  <input
                    type="text"
                    className="input-base"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Groom's Full Name</label>
                  <input
                    type="text"
                    className="input-base"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Destination City</label>
                  <select
                    className="input-base"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">Expected Guest Count</label>
                  <input
                    type="number"
                    className="input-base"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="gold" onClick={() => setCurrentStep(2)}>
                  Continue to Ceremonies <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CEREMONIES & EVENTS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-forest-900">Step 2 — Ceremonies & Celebrations</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add, rename, re-sequence, or adjust guest capacities for each unique ceremony.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEventModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1 text-gold-700" />
                  Add Custom Event
                </Button>
              </div>

              <div className="space-y-3">
                {events.map((ev, index) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-border bg-ivory-50/50 hover:bg-white hover:border-gold/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-forest-800 text-ivory flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-serif text-base font-bold text-forest-900">{ev.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-forest-700 mt-2 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gold-700" />
                            {ev.start_time} - {ev.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gold-700" />
                            {ev.venue_hall}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gold-700" />
                            {ev.guest_estimate} guests
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRemoveEvent(ev.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove ceremony"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="gold" onClick={() => setCurrentStep(3)}>
                  Continue to Packages <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PACKAGE SELECTION */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Step 3 — Select Management Package</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose your level of planner involvement, dedicated team size, and vendor management limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKAGE_TIERS.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-forest-900 bg-forest-900/5 ring-2 ring-forest-900 shadow-md"
                          : "border-border hover:border-gold/40"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-serif text-lg font-bold text-forest-900">{pkg.name}</h4>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-forest-900 text-ivory flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{pkg.tier}</p>
                        <p className="font-serif text-2xl font-bold text-forest-900 mt-3">{formatINR(pkg.base_price)}</p>
                        <p className="text-xs text-forest-700 mt-2 leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 text-xs text-forest-800 space-y-1.5">
                        <p>✓ Up to {pkg.events_covered} events covered</p>
                        <p>✓ Up to {pkg.vendor_slots} vendor slots</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="gold" onClick={() => setCurrentStep(4)}>
                  Continue to Services <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: ADD-ON SERVICES */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Step 4 — Select Wedding Services</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick the luxury service modules you want The Royal Knot to coordinate and procure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICE_CATEGORIES.map((svc) => {
                  const isChecked = !!selectedServices[svc.id];
                  const displayPrice =
                    svc.id === "catering"
                      ? `${formatINR(svc.default_price)} / plate`
                      : formatINR(svc.default_price);

                  return (
                    <div
                      key={svc.id}
                      onClick={() =>
                        setSelectedServices((prev) => ({
                          ...prev,
                          [svc.id]: !prev[svc.id],
                        }))
                      }
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        isChecked
                          ? "border-forest-800 bg-forest-900/5 ring-1 ring-forest-800 shadow-xs"
                          : "border-border hover:border-gold/40"
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{svc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-sm font-bold text-forest-900">{svc.name}</h4>
                          <span className="text-xs font-bold text-gold-800">{displayPrice}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{svc.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="gold" onClick={() => setCurrentStep(5)}>
                  Review Live Summary <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & FINALIZE */}
          {currentStep === 5 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Step 5 — Complete Wedding Review</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Verify your wedding plan specifications before saving into EverWed.
                </p>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-ivory-50 rounded-xl border border-border space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Couple & Dates</span>
                  <p className="font-serif text-base font-bold text-forest-900">{brideName} & {groomName}</p>
                  <p className="text-forest-700">{destination} • {targetDate} • {guestCount} Guests</p>
                </div>
                <div className="p-4 bg-ivory-50 rounded-xl border border-border space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Package Tier</span>
                  <p className="font-serif text-base font-bold text-forest-900 capitalize">{selectedPackage} Package</p>
                  <p className="text-forest-700">{events.length} Planned Ceremonies</p>
                </div>
              </div>

              {/* Itemized Ceremony List */}
              <div className="border border-border rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configured Ceremonies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {events.map((ev, i) => (
                    <div key={ev.id} className="p-2.5 bg-ivory-100/50 rounded-lg flex items-center justify-between">
                      <span className="font-medium text-forest-900">{i + 1}. {ev.name}</span>
                      <span className="text-muted-foreground">{ev.guest_estimate} guests</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="gold" size="lg" isLoading={isSubmitting} onClick={handleFinalSave} className="font-bold">
                  <Save className="w-4 h-4 mr-1.5" /> Save & Launch Couple Portal
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Persistent Live Cost Summary (Step 5 logic) */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-white rounded-2xl border border-border p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Live Cost Summary</p>
                <h3 className="font-serif text-lg font-bold text-forest-900">Projected Estimate</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold-900 font-bold text-xs">
                Real-Time
              </span>
            </div>

            {/* Line items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-forest-800">
                <span>Base Package ({selectedPackage})</span>
                <span className="font-semibold">{formatINR(costBreakdown.basePrice)}</span>
              </div>

              {costBreakdown.extraEventsCount > 0 && (
                <div className="flex justify-between text-forest-800">
                  <span>Additional Ceremonies ({costBreakdown.extraEventsCount})</span>
                  <span className="font-semibold">{formatINR(costBreakdown.extraEventCharge)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Selected Services ({costBreakdown.servicesList.length})
                </p>
                {costBreakdown.servicesList.map((svc, i) => (
                  <div key={i} className="flex justify-between text-forest-700 py-0.5">
                    <span className="truncate pr-2">{svc.name}</span>
                    <span className="font-medium shrink-0">{formatINR(svc.cost)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/60 flex justify-between text-forest-700">
                <span>Estimated Taxes (18% GST)</span>
                <span className="font-medium">{formatINR(costBreakdown.gstTax)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t-2 border-forest-900/10">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-forest-900">Grand Total Estimate</span>
                <span className="font-serif text-2xl font-bold text-forest-950">
                  {formatINR(costBreakdown.totalEstimate)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatINRFull(costBreakdown.totalEstimate)} • Subject to vendor contract lock
              </p>
            </div>

            {/* Helper Info */}
            <div className="p-3 bg-gold/10 rounded-xl border border-gold/30 text-[11px] text-forest-800 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
              <span>
                Catering automatically scales with your {guestCount} guest estimate. Final pricing locked upon quotation selection.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Add Custom Ceremony or Event"
        subtitle="Craft a bespoke celebration event for your multi-day itinerary."
      >
        <form onSubmit={handleAddCustomEvent} className="space-y-4">
          <div>
            <label className="label-base">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Sufi Night & Qawwali"
              className="input-base"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Description & Ritual Details</label>
            <textarea
              rows={2}
              placeholder="Short notes on rituals, dress code, or theme..."
              className="input-base"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Start Time</label>
              <input
                type="text"
                placeholder="18:00"
                className="input-base"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">End Time</label>
              <input
                type="text"
                placeholder="22:00"
                className="input-base"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Hall / Venue Area</label>
              <input
                type="text"
                placeholder="Central Palace Lawns"
                className="input-base"
                value={newEvent.venue_hall}
                onChange={(e) => setNewEvent({ ...newEvent, venue_hall: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Guest Count</label>
              <input
                type="number"
                className="input-base"
                value={newEvent.guest_estimate}
                onChange={(e) => setNewEvent({ ...newEvent, guest_estimate: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Add Ceremony
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

