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
  CheckCircle2,
  AlertCircle,
  Edit2,
  Building,
  Heart,
  Mail,
  Phone,
  Search,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import {
  WEDDING_TRADITIONS,
  CEREMONY_TEMPLATES,
  PACKAGE_TIERS,
  SERVICE_CATEGORIES,
  DESTINATION_CATALOG,
  type ServiceCategoryDef,
  type DestinationItem,
} from "@/lib/constants";
import { formatCurrency, formatINR, formatINRFull } from "@/lib/utils";
import { services } from "@/services";

interface CustomCeremonyForm {
  id?: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_hall: string;
  guest_estimate: number;
}

interface ServiceSelectionItem {
  id: string;
  name: string;
  icon: string;
  pricing_basis: string;
  unit_price: number;
  quantity: number;
  selected: boolean;
}

export const WeddingBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPackage = searchParams.get("package") || "signature";

  // Current Wizard Step: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // ── Step 1: Couple Details ──
  const [brideName, setBrideName] = useState<string>("");
  const [groomName, setGroomName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [alternateContact, setAlternateContact] = useState<string>("");
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [packageFeeInput, setPackageFeeInput] = useState<string>("");

  // ── Step 2: Wedding Details & Destination ──
  const [weddingTitle, setWeddingTitle] = useState<string>("");
  const [weddingType, setWeddingType] = useState<string>("Royal Heritage");
  const [startDate, setStartDate] = useState<string>("2026-12-10");
  const [endDate, setEndDate] = useState<string>("2026-12-13");
  const [guestCount, setGuestCount] = useState<number>(450);
  const [selectedDestinationCity, setSelectedDestinationCity] = useState<string>("Jaipur");
  const [customDestination, setCustomDestination] = useState<string>("");
  const [destinationSearch, setDestinationSearch] = useState<string>("");
  const [venue, setVenue] = useState<string>("City Palace & Rambagh Palace");
  const [currency, setCurrency] = useState<string>("INR");
  const [selectedPackage, setSelectedPackage] = useState<string>(initialPackage);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Calculated duration
  const durationDays = useMemo(() => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 3;
    }
  }, [startDate, endDate]);

  // Destination resolution
  const resolvedDestination = useMemo(() => {
    if (selectedDestinationCity === "custom") {
      return customDestination.trim() || "Custom Destination";
    }
    const found = DESTINATION_CATALOG.find((d) => d.city === selectedDestinationCity);
    if (!found) return selectedDestinationCity;
    return `${found.city}, ${found.state || found.country}`;
  }, [selectedDestinationCity, customDestination]);

  // Suggested venues for selected destination
  const suggestedVenues = useMemo(() => {
    const found = DESTINATION_CATALOG.find((d) => d.city === selectedDestinationCity);
    return found?.popularVenues || [];
  }, [selectedDestinationCity]);

  // ── Step 3: Ceremonies & Functions ──
  const [selectedTradition, setSelectedTradition] = useState<string>("hindu");
  const [events, setEvents] = useState<CustomCeremonyForm[]>(() => {
    const list = CEREMONY_TEMPLATES["hindu"] || [];
    return list.map((item, i) => ({
      id: `evt-init-${i}`,
      name: item.name,
      description: item.description,
      date: "2026-12-10",
      start_time: item.typical_duration.split(" - ")[0] || "16:00",
      end_time: item.typical_duration.split(" - ")[1] || "20:00",
      venue_hall: item.typical_hall,
      guest_estimate: 450,
    }));
  });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<CustomCeremonyForm>({
    name: "",
    description: "",
    date: startDate,
    start_time: "16:00",
    end_time: "20:00",
    venue_hall: "Royal Palace Courtyard",
    guest_estimate: 450,
  });
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // ── Step 4: Services Selection ──
  const [servicesState, setServicesState] = useState<ServiceSelectionItem[]>(() => {
    return SERVICE_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      pricing_basis: cat.pricing_basis,
      unit_price: cat.default_price,
      quantity: cat.pricing_basis === "Per Plate" ? 450 : cat.pricing_basis === "Per Day" ? 3 : 1,
      selected: ["venue", "catering", "decor", "photography", "entertainment"].includes(cat.id),
    }));
  });
  const [step4Error, setStep4Error] = useState<string | null>(null);

  // ── Step 5: Budget Calculations ──
  const budgetCalculations = useMemo(() => {
    const pkg = PACKAGE_TIERS.find((p) => p.id === selectedPackage) || PACKAGE_TIERS[1];
    const baseCoordinationFee = pkg.base_price;

    // Service totals
    let servicesSubtotal = 0;
    const itemizedServices = servicesState
      .filter((s) => s.selected)
      .map((s) => {
        let lineTotal = s.unit_price * s.quantity;
        if (s.pricing_basis === "Per Plate") {
          lineTotal = s.unit_price * guestCount;
        } else if (s.pricing_basis === "Per Day") {
          lineTotal = s.unit_price * durationDays;
        } else if (s.pricing_basis === "Per Session" || s.pricing_basis === "Per Event") {
          lineTotal = s.unit_price * Math.max(1, events.length);
        }
        servicesSubtotal += lineTotal;
        return {
          ...s,
          calculated_total: lineTotal,
        };
      });

    // Additional event coordination fee if more than package includes
    const extraEventsCount = Math.max(0, events.length - pkg.events_covered);
    const extraEventCharge = extraEventsCount * 250000;

    const subtotal = baseCoordinationFee + extraEventCharge + servicesSubtotal;
    const gstRate = 0.18;
    const taxAmount = Math.round(subtotal * gstRate);
    const grandTotal = subtotal + taxAmount;

    return {
      baseCoordinationFee,
      extraEventsCount,
      extraEventCharge,
      servicesSubtotal,
      itemizedServices,
      subtotal,
      taxAmount,
      grandTotal,
    };
  }, [servicesState, selectedPackage, events.length, guestCount, durationDays]);

  // ── Step 6: Confirmation ──
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingWeddingId, setPendingWeddingId] = useState<string | null>(null);
  const [savedEventKeys, setSavedEventKeys] = useState<Set<string>>(() => new Set());

  // ── Validation Helpers ──
  const isStep1Valid = useMemo(() => {
    return (
      brideName.trim().length >= 2 &&
      groomName.trim().length >= 2 &&
      contactEmail.includes("@") &&
      contactPhone.trim().length >= 7
    );
  }, [brideName, groomName, contactEmail, contactPhone]);

  const isStep2Valid = useMemo(() => {
    return (
      guestCount > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      new Date(endDate) >= new Date(startDate) &&
      venue.trim().length > 0 &&
      (selectedDestinationCity !== "custom" || customDestination.trim().length > 0)
    );
  }, [guestCount, startDate, endDate, venue, selectedDestinationCity, customDestination]);

  const isStep3Valid = useMemo(() => {
    return events.length > 0;
  }, [events]);

  const isStep4Valid = useMemo(() => {
    return servicesState.some((s) => s.selected);
  }, [servicesState]);

  // Step access check: user cannot jump ahead unless prerequisites are valid
  const canAccessStep = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return isStep1Valid;
    if (stepNumber === 3) return isStep1Valid && isStep2Valid;
    if (stepNumber === 4) return isStep1Valid && isStep2Valid && isStep3Valid;
    if (stepNumber === 5) return isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;
    if (stepNumber === 6) return isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;
    return false;
  };

  // Quick Demo Pre-fill
  const handleLoadSampleData = () => {
    setBrideName("Aisha Sharma");
    setGroomName("Vikram Singh Rathore");
    setContactEmail("aisha.vikram@everwed.in");
    setContactPhone("+91 98290 12345");
    setAlternateContact("Family Coordinator: +91 98111 22233");
    setWeddingTitle("The Royal Union: Aisha & Vikram");
    setVenue("City Palace & Rambagh Palace");
    setGuestCount(450);
    setStep1Error(null);
  };

  // Step 1 Next
  const handleProceedFromStep1 = () => {
    if (!isStep1Valid) {
      setStep1Error("Please provide bride name, groom name, a valid email address and contact phone.");
      return;
    }
    setStep1Error(null);
    setCompletedSteps((prev) => ({ ...prev, 1: true }));
    if (!weddingTitle) {
      setWeddingTitle(`The Royal Union: ${brideName} & ${groomName}`);
    }
    setCurrentStep(2);
  };

  // Step 2 Next
  const handleProceedFromStep2 = () => {
    if (!isStep2Valid) {
      setStep2Error("Please specify valid wedding dates, venue, destination, and a positive guest count.");
      return;
    }
    setStep2Error(null);
    setCompletedSteps((prev) => ({ ...prev, 2: true }));
    // Sync guest count to ceremonies
    setEvents((prev) =>
      prev.map((e) => ({ ...e, guest_estimate: guestCount, date: e.date || startDate }))
    );
    setCurrentStep(3);
  };

  // Step 3 Next
  const handleProceedFromStep3 = () => {
    if (!isStep3Valid) {
      setStep3Error("Please include at least one ceremony celebration for your wedding.");
      return;
    }
    setStep3Error(null);
    setCompletedSteps((prev) => ({ ...prev, 3: true }));
    setCurrentStep(4);
  };

  // Step 4 Next
  const handleProceedFromStep4 = () => {
    if (!isStep4Valid) {
      setStep4Error("Please select at least one wedding service.");
      return;
    }
    setStep4Error(null);
    setCompletedSteps((prev) => ({ ...prev, 4: true }));
    setCurrentStep(5);
  };

  // Step 5 Next
  const handleProceedFromStep5 = () => {
    setCompletedSteps((prev) => ({ ...prev, 5: true }));
    setCurrentStep(6);
  };

  // Change Tradition in Step 3
  const handleSelectTradition = (tId: string) => {
    setSelectedTradition(tId);
    const list = CEREMONY_TEMPLATES[tId] || [];
    setEvents(
      list.map((item, i) => ({
        id: `evt-${tId}-${Date.now()}-${i}`,
        name: item.name,
        description: item.description,
        date: startDate,
        start_time: item.typical_duration.split(" - ")[0] || "16:00",
        end_time: item.typical_duration.split(" - ")[1] || "20:00",
        venue_hall: item.typical_hall,
        guest_estimate: guestCount,
      }))
    );
  };

  // Add / Edit Ceremony
  const handleOpenAddEventModal = () => {
    setEditingEventId(null);
    setEventForm({
      name: "",
      description: "",
      date: startDate,
      start_time: "16:00",
      end_time: "20:00",
      venue_hall: venue || "Central Royal Lawn",
      guest_estimate: guestCount,
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEventModal = (ev: CustomCeremonyForm) => {
    setEditingEventId(ev.id || null);
    setEventForm({ ...ev });
    setIsEventModalOpen(true);
  };

  const handleSaveCeremonyModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name.trim()) return;

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((item) => (item.id === editingEventId ? { ...eventForm, id: editingEventId } : item))
      );
    } else {
      setEvents((prev) => [
        ...prev,
        {
          ...eventForm,
          id: `evt-custom-${Date.now()}`,
        },
      ]);
    }
    setIsEventModalOpen(false);
    setStep3Error(null);
  };

  const handleRemoveEvent = (id?: string) => {
    if (!id) return;
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  // Toggle Service in Step 4
  const handleToggleService = (id: string) => {
    setServicesState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleUpdateServicePrice = (id: string, price: number) => {
    setServicesState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, unit_price: Math.max(0, price) } : s))
    );
  };

  // Final Submission to Backend
  const handleFinalSave = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    let weddingId = pendingWeddingId;
    try {
      const finalTitle = weddingTitle.trim() || `The Royal Union: ${brideName} & ${groomName}`;
      const finalVenue = venue.trim() || `Palace Grounds, ${resolvedDestination}`;

      // Resume a partial save without creating a duplicate wedding or events.
      if (!weddingId) {
        const createdWedding = await services.weddings.create({
          title: finalTitle,
          bride_name: brideName,
          groom_name: groomName,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          destination: resolvedDestination,
          primary_venue: finalVenue,
          package_type: selectedPackage,
          guest_estimate: guestCount,
          theme: weddingType,
          budget_allocated: budgetCalculations.grandTotal,
          ...(packageFeeInput.trim() ? { package_fee: Number(packageFeeInput) } : {}),
          start_date: startDate,
          end_date: endDate,
        });
        weddingId = createdWedding.id;
        setPendingWeddingId(weddingId);
      }
      localStorage.setItem("active_wedding_id", weddingId);

      // Create only event records that have not already saved successfully.
      for (const ev of events) {
        const eventKey = ev.id || `${ev.name}|${ev.date}|${ev.start_time}`;
        if (savedEventKeys.has(eventKey)) continue;
        await services.events.create(weddingId, {
          name: ev.name,
          date: ev.date || startDate,
          start_time: ev.start_time,
          end_time: ev.end_time,
          venue_hall: ev.venue_hall || finalVenue,
          coordinator_name: "EverWed Lead Coordinator",
          coordinator_phone: contactPhone,
          guest_estimate: ev.guest_estimate || guestCount,
          notes: ev.description,
        });
        setSavedEventKeys((current) => new Set(current).add(eventKey));
      }

      setIsConfirmModalOpen(false);
      navigate(`/planner/weddings/${weddingId}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Please try again.";
      setSubmitError(weddingId
        ? `Wedding ${weddingId} is saved, but a function did not save. Correct the issue and confirm again to resume without duplicating saved records. ${detail}`
        : `Wedding could not be saved. ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col font-sans">
      <Navbar />

      {/* Builder Wizard Sub-header */}
      <div className="bg-white border-b border-border sticky top-16 z-30 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-800 bg-gold/20 px-2.5 py-0.5 rounded border border-gold/40">
                Sequential Wedding Architect
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Step {currentStep} of 6
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mt-1">
              Curate Your Bespoke Wedding Celebration
            </h1>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {[
              { num: 1, label: "Couple Details" },
              { num: 2, label: "Wedding & Venue" },
              { num: 3, label: "Ceremonies" },
              { num: 4, label: "Services" },
              { num: 5, label: "Budget" },
              { num: 6, label: "Review" },
            ].map((step) => {
              const isAllowed = canAccessStep(step.num);
              const isCurrent = currentStep === step.num;
              const isDone = completedSteps[step.num];

              return (
                <button
                  key={step.num}
                  disabled={!isAllowed}
                  onClick={() => isAllowed && setCurrentStep(step.num)}
                  title={!isAllowed ? `Complete Step ${step.num - 1} first` : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isCurrent
                      ? "bg-forest-800 text-ivory shadow-xs"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      : isAllowed
                      ? "text-forest-700 bg-ivory-100 hover:bg-ivory-200"
                      : "text-stone-400 bg-stone-100/60 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-gold text-forest-900"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-300 text-stone-700"
                    }`}
                  >
                    {isDone ? "✓" : step.num}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── STEP 1: COUPLE DETAILS ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 1 of 6</span>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Couple & Client Information</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter the couple's genuine names and primary contact details to anchor this celebration.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleData}
                className="text-xs text-forest-800 border-gold/40 hover:bg-gold/10 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-700 mr-1.5" />
                Fill Sample Couple Data
              </Button>
            </div>

            {step1Error && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{step1Error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Bride's Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aisha Sharma"
                  className="input-base text-sm"
                  value={brideName}
                  onChange={(e) => {
                    setBrideName(e.target.value);
                    setStep1Error(null);
                  }}
                />
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-forest-700" />
                  Groom's Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singh Rathore"
                  className="input-base text-sm"
                  value={groomName}
                  onChange={(e) => {
                    setGroomName(e.target.value);
                    setStep1Error(null);
                  }}
                />
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Contact Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. couple@everwed.in"
                  className="input-base text-sm"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setStep1Error(null);
                  }}
                />
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98290 12345"
                  className="input-base text-sm"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    setStep1Error(null);
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label-base">Alternate Contact / Family Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lead family coordinator: Raghav Sharma (+91 98111 22233)"
                  className="input-base text-sm"
                  value={alternateContact}
                  onChange={(e) => setAlternateContact(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end">
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleProceedFromStep1}
                className="font-bold shadow-sm"
              >
                Proceed to Wedding Details
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: WEDDING DETAILS & DESTINATION ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 2 of 6</span>
              <h2 className="font-serif text-2xl font-bold text-forest-900">Wedding Details & Destination</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define the celebration scale, destination hub, venue, and multi-day itinerary dates.
              </p>
            </div>

            {step2Error && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{step2Error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="sm:col-span-2">
                <label className="label-base">Wedding Celebration Title</label>
                <input
                  type="text"
                  className="input-base text-sm font-serif font-bold text-forest-900"
                  value={weddingTitle}
                  onChange={(e) => setWeddingTitle(e.target.value)}
                  placeholder={`The Royal Union: ${brideName || "Bride"} & ${groomName || "Groom"}`}
                />
              </div>

              <div>
                <label className="label-base">Celebration Style / Theme</label>
                <select
                  className="input-base"
                  value={weddingType}
                  onChange={(e) => setWeddingType(e.target.value)}
                >
                  <option value="Royal Heritage">Royal Heritage Palace</option>
                  <option value="Destination Grandeur">Destination Grandeur</option>
                  <option value="Intimate Elegance">Intimate Elegance</option>
                  <option value="Traditional Vedic">Traditional Vedic</option>
                  <option value="Contemporary Luxury">Contemporary Luxury</option>
                  <option value="Coastal Riviera">Coastal Riviera</option>
                </select>
              </div>

              <div>
                <label className="label-base flex items-center justify-between">
                  <span>Guest Count Estimate</span>
                  <span className="text-[11px] font-bold text-forest-800">{guestCount} Guests</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="25"
                    className="flex-1 accent-gold"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min="1"
                    className="input-base w-24 text-center font-bold"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Wedding Start Date
                </label>
                <input
                  type="date"
                  className="input-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Wedding End Date ({durationDays} Days Duration)
                </label>
                <input
                  type="date"
                  min={startDate}
                  className="input-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Destination Selector */}
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-700" />
                  Destination Hub
                </label>
                <select
                  className="input-base"
                  value={selectedDestinationCity}
                  onChange={(e) => setSelectedDestinationCity(e.target.value)}
                >
                  <optgroup label="Popular Wedding Hubs (India)">
                    {DESTINATION_CATALOG.filter((d) => d.region === "Domestic").map((d) => (
                      <option key={d.id} value={d.city}>
                        {d.city}, {d.state}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="International Destination Wedding Hubs">
                    {DESTINATION_CATALOG.filter((d) => d.region === "International").map((d) => (
                      <option key={d.id} value={d.city}>
                        {d.city} ({d.country})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">Other / Custom Destination...</option>
                </select>
              </div>

              {/* Custom Destination input if selected */}
              {selectedDestinationCity === "custom" ? (
                <div>
                  <label className="label-base">Enter Custom City & Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Positano, Amalfi Coast, Italy"
                    className="input-base"
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="label-base">Operational Currency</label>
                  <select
                    className="input-base"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="AED">AED (د.إ) — UAE Dirham</option>
                  </select>
                </div>
              )}

              {/* Venue Selector with Suggestions */}
              <div className="sm:col-span-2">
                <label className="label-base flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-forest-800" />
                    Primary Venue / Palace Resort
                  </span>
                  {suggestedVenues.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">Click a venue suggestion below:</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Palace & Rambagh Palace, Jaipur"
                  className="input-base text-sm font-semibold"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
                {suggestedVenues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestedVenues.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVenue(v)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                          venue === v
                            ? "bg-forest-800 text-ivory border-forest-900"
                            : "bg-ivory-100 text-forest-800 border-border hover:bg-gold/20"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Couple
              </Button>
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleProceedFromStep2}
                className="font-bold shadow-sm"
              >
                Proceed to Ceremonies
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CEREMONIES & FUNCTIONS ── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 3 of 6</span>
                <h2 className="font-serif text-2xl font-bold text-forest-900">Ceremonies & Functions Curation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curate your rituals. Select from cultural presets, customize times and halls, or add custom celebrations.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAddEventModal}
                className="text-xs font-bold text-forest-900 border-forest-700 hover:bg-forest-50 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-gold-700" />
                Add Custom Ceremony
              </Button>
            </div>

            {step3Error && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{step3Error}</span>
              </div>
            )}

            {/* Cultural Tradition Presets Quick Switcher */}
            <div>
              <label className="label-base block mb-2">Preset Tradition Blueprints</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {WEDDING_TRADITIONS.map((tradition) => (
                  <button
                    key={tradition.id}
                    type="button"
                    onClick={() => handleSelectTradition(tradition.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedTradition === tradition.id
                        ? "bg-forest-800 text-ivory border-forest-900 shadow-sm"
                        : "bg-ivory-50 text-forest-900 border-border hover:bg-ivory-100"
                    }`}
                  >
                    <span className="text-xl block mb-1">{tradition.icon}</span>
                    <p className="font-serif text-xs font-bold truncate">{tradition.label}</p>
                    <span className="text-[9px] opacity-80 block mt-0.5">{tradition.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Ceremonies List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Planned Itinerary ({events.length} Ceremonies)
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  Each ceremony auto-generates specific operational preparation tasks
                </span>
              </div>

              {events.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-ivory-50">
                  <p className="text-sm font-semibold text-forest-900">No ceremonies currently planned</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a tradition above or click "Add Custom Ceremony" to build your timeline.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {events.map((ev, index) => (
                    <div
                      key={ev.id || index}
                      className="p-4 rounded-2xl border border-border bg-white hover:border-gold/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gold/20 text-gold-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-forest-900">{ev.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-forest-700">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="w-3 h-3 text-gold-700" />
                              {ev.date || startDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gold-700" />
                              {ev.start_time} - {ev.end_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gold-700" />
                              {ev.venue_hall}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-gold-700" />
                              {ev.guest_estimate} Guests
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEventModal(ev)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-forest-900 hover:bg-ivory-100 transition-colors"
                          title="Edit Ceremony Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvent(ev.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Remove Ceremony"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Wedding Details
              </Button>
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleProceedFromStep3}
                className="font-bold shadow-sm"
              >
                Proceed to Services
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: SERVICES SELECTION ── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 4 of 6</span>
              <h2 className="font-serif text-2xl font-bold text-forest-900">Wedding Services & Vendor Allocations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select the required service disciplines and verify individual pricing models.
              </p>
            </div>

            {step4Error && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{step4Error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicesState.map((svc) => {
                const isSelected = svc.selected;
                return (
                  <div
                    key={svc.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-gold/70 bg-ivory-50/50 shadow-2xs"
                        : "border-border bg-white opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`svc-${svc.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleService(svc.id)}
                          className="mt-1 w-4 h-4 rounded text-forest-800 accent-forest-800 cursor-pointer"
                        />
                        <div>
                          <label
                            htmlFor={`svc-${svc.id}`}
                            className="font-serif text-sm font-bold text-forest-900 cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{svc.icon}</span>
                            <span>{svc.name}</span>
                          </label>
                          <span className="inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gold/15 text-gold-900 mt-1">
                            {svc.pricing_basis} Model
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-forest-900 block font-mono">
                          {formatCurrency(svc.unit_price, currency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Unit Rate</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          {svc.pricing_basis === "Per Plate"
                            ? `Computed across ${guestCount} guests`
                            : svc.pricing_basis === "Per Day"
                            ? `Computed across ${durationDays} days`
                            : svc.pricing_basis === "Per Event"
                            ? `Computed across ${events.length} events`
                            : "Fixed turnkey allocation"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">Adjust:</span>
                          <input
                            type="number"
                            step="1000"
                            className="input-base w-28 text-right text-xs py-1 px-2 font-mono"
                            value={svc.unit_price}
                            onChange={(e) => handleUpdateServicePrice(svc.id, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Ceremonies
              </Button>
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleProceedFromStep4}
                className="font-bold shadow-sm"
              >
                Proceed to Budget Estimation
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: BUDGET ESTIMATION ── */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 5 of 6</span>
              <h2 className="font-serif text-2xl font-bold text-forest-900">Live Dynamic Budget Estimation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                The budget is calculated directly from your selected services, ceremonies, guest count, and duration.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-ivory-50 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Guests</span>
                <p className="font-serif text-xl font-bold text-forest-900 mt-0.5">{guestCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-ivory-50 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Ceremonies</span>
                <p className="font-serif text-xl font-bold text-forest-900 mt-0.5">{events.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-ivory-50 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Duration</span>
                <p className="font-serif text-xl font-bold text-forest-900 mt-0.5">{durationDays} Days</p>
              </div>
              <div className="p-4 rounded-2xl bg-forest-900 text-ivory border border-forest-800">
                <span className="text-[10px] uppercase font-bold text-gold">Total Estimate</span>
                <p className="font-serif text-xl font-bold text-gold mt-0.5">
                  {formatCurrency(budgetCalculations.grandTotal, currency)}
                </p>
              </div>
            </div>

            {/* Itemized Budget Table */}
            <div className="border border-border rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-forest-900 text-ivory px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Selected Service Item</span>
                <span>Calculated Line Subtotal</span>
              </div>
              <div className="divide-y divide-border text-xs">
                {budgetCalculations.itemizedServices.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-ivory-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-forest-900">{item.name}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {item.pricing_basis} @ {formatCurrency(item.unit_price, currency)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-forest-900">
                      {formatCurrency(item.calculated_total, currency)}
                    </span>
                  </div>
                ))}

                {/* Coordination Base Fee */}
                <div className="p-3.5 flex items-center justify-between bg-gold/5">
                  <div>
                    <p className="font-semibold text-forest-900">Lead Planner Management & Agency Fee</p>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {selectedPackage} tier coordination & day-of command team
                    </span>
                  </div>
                  <span className="font-mono font-bold text-forest-900">
                    {formatCurrency(budgetCalculations.baseCoordinationFee, currency)}
                  </span>
                </div>

                {/* Extra Event Charge */}
                {budgetCalculations.extraEventCharge > 0 && (
                  <div className="p-3.5 flex items-center justify-between bg-gold/5">
                    <div>
                      <p className="font-semibold text-forest-900">
                        Additional Ceremony Management ({budgetCalculations.extraEventsCount} events)
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        Covers staff and audio-visual setups exceeding standard package limit
                      </span>
                    </div>
                    <span className="font-mono font-bold text-forest-900">
                      {formatCurrency(budgetCalculations.extraEventCharge, currency)}
                    </span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="p-3.5 flex items-center justify-between font-bold text-forest-900 bg-ivory-100">
                  <span>Subtotal (Net Operations)</span>
                  <span className="font-mono">{formatCurrency(budgetCalculations.subtotal, currency)}</span>
                </div>

                {/* Taxes */}
                <div className="p-3.5 flex items-center justify-between text-muted-foreground">
                  <span>Standard Goods & Services Tax (18% GST)</span>
                  <span className="font-mono">{formatCurrency(budgetCalculations.taxAmount, currency)}</span>
                </div>

                {/* Grand Total */}
                <div className="p-4 flex items-center justify-between font-serif text-base font-bold text-forest-950 bg-gold/15">
                  <span>Grand Total Estimated Budget</span>
                  <span className="text-lg text-forest-950 font-bold font-mono">
                    {formatCurrency(budgetCalculations.grandTotal, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(4)}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Services
              </Button>
              <Button
                type="button"
                variant="gold"
                size="md"
                onClick={handleProceedFromStep5}
                className="font-bold shadow-sm"
              >
                Proceed to Review & Confirmation
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 6: REVIEW & CONFIRMATION ── */}
        {currentStep === 6 && (
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-border pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700">Step 6 of 6</span>
              <h2 className="font-serif text-2xl font-bold text-forest-900">Final Wedding Review & Confirmation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review your complete wedding architecture before creating the official record.
              </p>
            </div>

            {/* Structured Executive Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Couple & Client Card */}
              <div className="p-5 rounded-2xl bg-ivory-50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Couple Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-gold-800 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <h4 className="font-serif text-lg font-bold text-forest-900">{brideName} & {groomName}</h4>
                <p className="text-forest-700">{contactEmail} • {contactPhone}</p>
                {alternateContact && <p className="text-muted-foreground text-[11px]">{alternateContact}</p>}
              </div>

              {/* Destination & Scale Card */}
              <div className="p-5 rounded-2xl bg-ivory-50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Wedding Specifications
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-gold-800 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <h4 className="font-serif text-base font-bold text-forest-900">{venue}</h4>
                <p className="text-forest-700">
                  {resolvedDestination} • {guestCount} Guests • {durationDays} Days ({startDate} to {endDate})
                </p>
                <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-forest-800 text-ivory">
                  {weddingType}
                </span>
              </div>
            </div>

            {/* Ceremonies Overview */}
            <div className="p-5 rounded-2xl border border-border bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-forest-900">
                  Planned Ceremonies ({events.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-gold-800 hover:underline flex items-center gap-1 font-semibold text-xs"
                >
                  <Edit2 className="w-3 h-3" /> Edit Ceremonies
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {events.map((ev, idx) => (
                  <div key={ev.id || idx} className="p-3 rounded-xl bg-ivory-50 border border-border/80">
                    <p className="font-bold text-forest-900">{ev.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ev.date || startDate} • {ev.start_time}-{ev.end_time} • {ev.venue_hall}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <label className="label-base" htmlFor="wedding-package-fee">Agreed client package fee (INR, if set)</label>
              <input
                id="wedding-package-fee"
                type="number"
                min="0"
                step="0.01"
                className="input-base"
                placeholder="Enter the fee from the signed proposal"
                value={packageFeeInput}
                onChange={(e) => setPackageFeeInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">The planning projection below is stored separately and is not treated as revenue.</p>
            </div>

            {/* Budget Grand Total Summary */}
            <div className="p-6 rounded-2xl bg-forest-900 text-ivory flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                  Authoritative Budget Projection
                </span>
                <h3 className="font-serif text-2xl font-bold mt-0.5 text-ivory">
                  {formatCurrency(budgetCalculations.grandTotal, currency)}
                </h3>
                <p className="text-xs text-ivory-300 mt-1">
                  Inclusive of all {budgetCalculations.itemizedServices.length} selected service lines, coordination, and taxes.
                </p>
              </div>

              <Button
                type="button"
                variant="gold"
                size="lg"
                onClick={() => setIsConfirmModalOpen(true)}
                className="font-bold shadow-lg shadow-gold/20 shrink-0"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Confirm & Create Wedding
              </Button>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(5)}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Budget
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── CEREMONY ADD/EDIT MODAL ── */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEventId ? "Edit Ceremony Celebration" : "Add Custom Ceremony Celebration"}
      >
        <form onSubmit={handleSaveCeremonyModal} className="space-y-4 text-xs font-sans">
          <div>
            <label className="label-base">Ceremony Name *</label>
            <input
              type="text"
              required
              className="input-base text-sm"
              placeholder="e.g. Desert Beats Sangeet or Welcome Sunset Cocktails"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label-base">Ritual Description & Dress Code</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Royal marigold blessings with flower showers and live dhol"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Ceremony Date</label>
              <input
                type="date"
                required
                className="input-base"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Guest Count</label>
              <input
                type="number"
                min="1"
                required
                className="input-base"
                value={eventForm.guest_estimate}
                onChange={(e) => setEventForm({ ...eventForm, guest_estimate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Start Time</label>
              <input
                type="time"
                required
                className="input-base"
                value={eventForm.start_time}
                onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">End Time</label>
              <input
                type="time"
                required
                className="input-base"
                value={eventForm.end_time}
                onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-base">Venue Hall / Lawn</label>
            <input
              type="text"
              required
              className="input-base"
              placeholder="e.g. Zenana Courtyard Gardens"
              value={eventForm.venue_hall}
              onChange={(e) => setEventForm({ ...eventForm, venue_hall: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEventModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" className="font-bold">
              {editingEventId ? "Update Ceremony" : "Add to Itinerary"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── FINAL CONFIRMATION MODAL ── */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
        title="Confirm EverWed Wedding Record"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-muted-foreground leading-relaxed">
            You are about to create the wedding record for{" "}
            <strong className="text-forest-900 font-bold">{brideName} & {groomName}</strong> at{" "}
            <strong className="text-forest-900">{venue}</strong>.
          </p>

          <div className="p-4 rounded-xl bg-ivory-50 border border-border space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ceremonies Generated:</span>
              <span className="font-bold text-forest-900">{events.length} Events</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Guest Attendance:</span>
              <span className="font-bold text-forest-900">{guestCount} Guests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Budget Allocation:</span>
              <span className="font-bold text-forest-900 font-mono">
                {formatCurrency(budgetCalculations.grandTotal, currency)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            This creates the wedding and its listed functions. The planning task plan is generated after the booking deposit is recorded.
          </p>

          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Review Again
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleFinalSave}
              className="font-bold shadow-sm"
            >
              Confirm & Save Wedding
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
