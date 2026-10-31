import React, { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Vendor, VendorCreate } from "@/types";
import { VENDOR_CATEGORIES, DESTINATIONS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export const VendorsPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);
  const [error, setError] = useState("");

  const [newVendor, setNewVendor] = useState<VendorCreate>({
    name: "",
    category: "Catering",
    contact_person: "",
    phone: "",
    email: "",
    city: "Jaipur",
    rating: 4.9,
    services_offered: [],
    pricing_model_default: "fixed",
    bank_account_details: "",
  });
  const [servicesInput, setServicesInput] = useState("");

  const loadVendors = () => {
    setIsLoading(true);
    services.vendors
      .list(categoryFilter === "all" ? undefined : { category: categoryFilter })
      .then((data) => setVendors(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, [categoryFilter]);

  const resetVendorForm = () => {
    setEditingVendorId(null);
    setNewVendor({
      name: "",
      category: "Catering",
      contact_person: "",
      phone: "",
      email: "",
      city: "Jaipur",
      rating: 4.9,
      services_offered: [],
      pricing_model_default: "fixed",
      bank_account_details: "",
    });
    setServicesInput("");
  };

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setNewVendor({
      name: vendor.name,
      category: vendor.category,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      email: vendor.email,
      city: vendor.city,
      rating: vendor.rating,
      services_offered: vendor.services_offered || [],
      pricing_model_default: vendor.pricing_model_default,
      bank_account_details: vendor.bank_account_details || "",
    });
    setServicesInput((vendor.services_offered || []).join(", "));
    setSelectedVendorForDetail(null);
    setIsModalOpen(true);
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const offered = servicesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = { ...newVendor, services_offered: offered };
      if (editingVendorId) {
        await services.vendors.update(editingVendorId, payload);
      } else {
        await services.vendors.create(payload);
      }
      setIsModalOpen(false);
      resetVendorForm();
      loadVendors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this vendor.");
    }
  };

  const filtered = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.contact_person.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Partner Network
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Vetted Luxury Vendor Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified luxury banquet caterers, spatial designers, artists, and logistics teams across destinations.
          </p>
        </div>

        {canManage && (
          <Button
            variant="gold"
            onClick={() => {
              if (categoryFilter !== "all") {
                setNewVendor((prev) => ({ ...prev, category: categoryFilter }));
              }
              setIsModalOpen(true);
            }}
            className="font-bold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register New Supplier
          </Button>
        )}
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor name, category, contact, city..."
            className="input-base pl-9 text-xs py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === "all" ? "bg-forest-800 text-ivory shadow-xs" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
            }`}
          >
            All ({vendors.length})
          </button>
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat ? "bg-forest-800 text-ivory shadow-xs" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading vetted suppliers...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center space-y-4">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              No Suppliers Found in {categoryFilter === "all" ? "Directory" : categoryFilter}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              There are currently no supplier records matching your filter. You can easily register and onboard trusted partners directly into EverWed.
            </p>
          </div>
          {canManage && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                if (categoryFilter !== "all") {
                  setNewVendor((prev) => ({ ...prev, category: categoryFilter }));
                }
                setIsModalOpen(true);
              }}
              className="font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Supplier in {categoryFilter === "all" ? "Directory" : categoryFilter}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v) => (
            <Card
              key={v.id}
              className="p-5 flex flex-col justify-between hover:border-gold/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedVendorForDetail(v)}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-gold-900 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
                    {v.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {v.rating.toFixed(1)}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-forest-900 mt-2.5 group-hover:text-gold-800 transition-colors">
                  {v.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Primary Contact: {v.contact_person}</p>

                <div className="mt-3 space-y-1.5 text-xs text-forest-800">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                    <span>{v.city}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                    <span>{v.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </p>
                </div>

                {v.services_offered && v.services_offered.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Specialist Capabilities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {v.services_offered.slice(0, 3).map((svc, i) => (
                        <span key={i} className="text-[10px] bg-ivory-100 text-forest-900 font-medium px-2 py-0.5 rounded-lg border border-border/60">
                          {svc}
                        </span>
                      ))}
                      {v.services_offered.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center px-1">
                          +{v.services_offered.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">
                  Model: <strong className="capitalize text-forest-900">{v.pricing_model_default.replace("_", " ")}</strong>
                </span>
                <span className="text-gold-800 font-semibold text-[11px] flex items-center gap-1 group-hover:underline">
                  Inspect Profile <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── VENDOR INSPECTION DETAIL MODAL ── */}
      {selectedVendorForDetail && (
        <Modal
          isOpen={!!selectedVendorForDetail}
          onClose={() => setSelectedVendorForDetail(null)}
          title={selectedVendorForDetail.name}
          subtitle={`Verified Supplier Profile • Category: ${selectedVendorForDetail.category}`}
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between p-3 bg-ivory-50 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-forest-900">EverWed Verified Luxury Supplier</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{selectedVendorForDetail.rating.toFixed(1)} / 5.0 Rating</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Lead Contact
                </span>
                <p className="font-semibold text-forest-900 mt-0.5">{selectedVendorForDetail.contact_person}</p>
                <p className="text-muted-foreground">{selectedVendorForDetail.phone}</p>
                <p className="text-muted-foreground">{selectedVendorForDetail.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Location & Pricing
                </span>
                <p className="font-semibold text-forest-900 mt-0.5">{selectedVendorForDetail.city}</p>
                <p className="text-muted-foreground capitalize">
                  Pricing: {selectedVendorForDetail.pricing_model_default.replace("_", " ")}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Services & Inclusions Offered
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedVendorForDetail.services_offered?.map((s, idx) => (
                  <span key={idx} className="text-xs bg-ivory-100 text-forest-900 px-2.5 py-1 rounded-lg border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {selectedVendorForDetail.bank_account_details && (
              <div className="p-3 bg-stone-50 rounded-xl border border-border flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Settlement Bank Account
                  </span>
                  <p className="font-mono text-forest-900 font-medium">{selectedVendorForDetail.bank_account_details}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              {canManage && (
                <Button variant="gold" size="sm" onClick={() => openEditVendor(selectedVendorForDetail)}>
                  Edit supplier
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVendorForDetail(null)}
              >
                Close Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── REGISTER VENDOR MODAL (Founder only) ── */}
      <Modal
        isOpen={isModalOpen && canManage}
        onClose={() => { setIsModalOpen(false); resetVendorForm(); }}
        title={editingVendorId ? "Edit supplier" : "Register supplier"}
        subtitle="Save a supplier in the EverWed vendor directory."
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Vendor / Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajputana Royal Feast & Catering"
              className="input-base"
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Category</label>
              <select
                className="input-base"
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              >
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">City</label>
              <select
                className="input-base"
                value={newVendor.city}
                onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })}
              >
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Contact Person</label>
              <input
                type="text"
                required
                placeholder="e.g. Chef Vikram Rathore"
                className="input-base"
                value={newVendor.contact_person}
                onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Phone Number</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98290 11223"
                className="input-base"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. info@rajputanafeast.com"
              className="input-base"
              value={newVendor.email}
              onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-base">Services Offered (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. Heritage Marwari Thali, Live Live Counters, Dessert Studios"
              className="input-base"
              value={servicesInput}
              onChange={(e) => setServicesInput(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Settlement Bank Account Details</label>
            <input
              type="text"
              placeholder="e.g. HDFC0001234 - AC 50200011223344"
              className="input-base font-mono"
              value={newVendor.bank_account_details}
              onChange={(e) => setNewVendor({ ...newVendor, bank_account_details: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsModalOpen(false); resetVendorForm(); }}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" className="font-bold">
              {editingVendorId ? "Save changes" : "Register supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
