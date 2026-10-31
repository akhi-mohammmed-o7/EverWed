import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Inbox,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  FileText,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Enquiry, EnquiryCreate } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { DESTINATIONS, ENQUIRY_SOURCES, PACKAGE_TIERS } from "@/lib/constants";

export const EnquiriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEnq, setNewEnq] = useState<EnquiryCreate>({
    bride_name: "",
    groom_name: "",
    contact_email: "",
    contact_phone: "",
    destination: "Jaipur",
    package_type: "Signature",
    estimated_guests: 400,
    estimated_budget: 20000000,
    theme: "Royal Heritage",
    enquiry_source: "Instagram",
    requirements: "",
  });

  // Convert Modal State
  const [convertTarget, setConvertTarget] = useState<Enquiry | null>(null);
  const [convertBudget, setConvertBudget] = useState<number>(25000000);
  const [convertVenue, setConvertVenue] = useState<string>("City Palace, Jaipur");
  const [isConverting, setIsConverting] = useState(false);

  const fetchEnquiries = () => {
    setIsLoading(true);
    services.enquiries
      .list(filterStatus === "all" ? undefined : { status: filterStatus })
      .then((data) => setEnquiries(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filterStatus]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await services.enquiries.create(newEnq);
      setIsCreateOpen(false);
      fetchEnquiries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget) return;
    setIsConverting(true);
    try {
      const res = await services.enquiries.convert(convertTarget.id, {
        confirmed_budget: convertBudget,
        primary_venue: convertVenue,
        package_type: convertTarget.package_type,
        wedding_start_date: convertTarget.target_date || "2026-12-10",
        wedding_end_date: "2026-12-13",
      });
      setConvertTarget(null);
      fetchEnquiries();
      navigate(`/planner/weddings/${res.wedding.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const filtered = enquiries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.bride_name.toLowerCase().includes(q) ||
      e.groom_name.toLowerCase().includes(q) ||
      e.contact_email.toLowerCase().includes(q) ||
      e.destination.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Client Acquisition CRM
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Couple Enquiries & Consultation Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track prospective luxury wedding leads, log tastings, agreements, and convert to active weddings.
          </p>
        </div>

        <Button variant="gold" onClick={() => setIsCreateOpen(true)} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Capture New Enquiry
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by couple name, city, email..."
            className="input-base pl-9 text-xs py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {["all", "new", "meeting_scheduled", "agreement_sent", "confirmed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? "bg-forest-800 text-ivory"
                  : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              {st === "all" ? "All Enquiries" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((enq) => (
          <Card key={enq.id} className="p-5 flex flex-col justify-between hover:border-gold/50 transition-all">
            <div>
              <div className="flex justify-between items-start">
                <Badge status={enq.status} />
                <span className="text-[10px] text-muted-foreground">{formatDate(enq.created_at)}</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-forest-900 mt-2.5">
                {enq.bride_name} & {enq.groom_name}
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-forest-700">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {enq.destination} • {enq.estimated_guests} Guests
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  <span className="truncate">{enq.contact_email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {enq.contact_phone}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Est. Budget:</span>
                  <span className="font-bold text-forest-900 font-serif text-sm">
                    {formatINR(enq.estimated_budget)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium text-forest-800">{enq.package_type}</span>
                </div>
                {enq.target_date && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-muted-foreground">Target Date:</span>
                    <span className="font-medium text-forest-800">{formatDate(enq.target_date)}</span>
                  </div>
                )}
              </div>

              {/* Consultation Meeting Notes if present */}
              {enq.meetings.length > 0 && (
                <div className="mt-3 p-2.5 bg-ivory-100 rounded-lg border border-border/50 text-[11px] text-forest-800">
                  <span className="font-bold block text-forest-900 mb-0.5">Consultation Note:</span>
                  "{enq.meetings[0].notes}"
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              {enq.converted_wedding_id ? (
                <Link to={`/planner/weddings/${enq.converted_wedding_id}`} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-gold-700" />
                    Open Converted Wedding
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full text-xs font-bold"
                  onClick={() => {
                    setConvertTarget(enq);
                    setConvertBudget(enq.estimated_budget);
                    setConvertVenue(`Heritage Palace, ${enq.destination}`);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Convert to Active Wedding
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Convert to Wedding Modal */}
      <Modal
        isOpen={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        title="Convert Enquiry to Active Wedding"
        subtitle={`Provisioning project for ${convertTarget?.bride_name} & ${convertTarget?.groom_name} will automatically generate 25+ standard operational tasks.`}
      >
        <form onSubmit={handleConvert} className="space-y-4 text-xs">
          <div>
            <label className="label-base">Confirmed Wedding Budget (INR)</label>
            <input
              type="number"
              required
              className="input-base"
              value={convertBudget}
              onChange={(e) => setConvertBudget(Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Formatted: {formatINR(convertBudget)}</p>
          </div>
          <div>
            <label className="label-base">Primary Venue & City</label>
            <input
              type="text"
              required
              className="input-base"
              value={convertVenue}
              onChange={(e) => setConvertVenue(e.target.value)}
            />
          </div>
          <div className="p-3 bg-gold/10 rounded-xl border border-gold/30 text-forest-800 text-[11px]">
            <span className="font-bold block text-forest-900 mb-0.5">Automated Task Generation:</span>
            Converting this enquiry will inject The Royal Knot's 25+ luxury wedding playbook tasks (venue agreement, late-night sound permits, mandap engineering, live dhol, plate audits) into the workspace.
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setConvertTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" isLoading={isConverting} className="font-bold">
              Execute Conversion
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Enquiry Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Capture Prospective Wedding Lead"
        subtitle="Log couple wedding requirements from WhatsApp, Instagram, or Phone consultation."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Bride's Name</label>
              <input
                type="text"
                required
                className="input-base"
                value={newEnq.bride_name}
                onChange={(e) => setNewEnq({ ...newEnq, bride_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Groom's Name</label>
              <input
                type="text"
                required
                className="input-base"
                value={newEnq.groom_name}
                onChange={(e) => setNewEnq({ ...newEnq, groom_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Email Address</label>
              <input
                type="email"
                required
                className="input-base"
                value={newEnq.contact_email}
                onChange={(e) => setNewEnq({ ...newEnq, contact_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Phone Number</label>
              <input
                type="tel"
                required
                className="input-base"
                value={newEnq.contact_phone}
                onChange={(e) => setNewEnq({ ...newEnq, contact_phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Destination</label>
              <select
                className="input-base"
                value={newEnq.destination}
                onChange={(e) => setNewEnq({ ...newEnq, destination: e.target.value })}
              >
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Guests</label>
              <input
                type="number"
                className="input-base"
                value={newEnq.estimated_guests}
                onChange={(e) => setNewEnq({ ...newEnq, estimated_guests: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label-base">Lead Source</label>
              <select
                className="input-base"
                value={newEnq.enquiry_source}
                onChange={(e) => setNewEnq({ ...newEnq, enquiry_source: e.target.value })}
              >
                {ENQUIRY_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-base">Estimated Budget (INR)</label>
            <input
              type="number"
              required
              className="input-base"
              value={newEnq.estimated_budget}
              onChange={(e) => setNewEnq({ ...newEnq, estimated_budget: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label-base">Specific Couple Requirements</label>
            <textarea
              rows={2}
              className="input-base"
              placeholder="e.g. Vintage Baraat, 7-course Marwari banquet, celebrity dhol..."
              value={newEnq.requirements}
              onChange={(e) => setNewEnq({ ...newEnq, requirements: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Record Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

