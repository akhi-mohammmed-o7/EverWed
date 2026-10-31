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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Vendor, VendorCreate } from "@/types";
import { VENDOR_CATEGORIES, DESTINATIONS } from "@/lib/constants";

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const offered = servicesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await services.vendors.create({ ...newVendor, services_offered: offered });
      setIsModalOpen(false);
      loadVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.contact_person.toLowerCase().includes(q)
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
            Verified high-end banquet caterers, spatial designers, artists, and logistics operators across Rajasthan.
          </p>
        </div>

        <Button variant="gold" onClick={() => setIsModalOpen(true)} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Vendor
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor name, category, contact..."
            className="input-base pl-9 text-xs py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === "all" ? "bg-forest-800 text-ivory" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
            }`}
          >
            All Categories
          </button>
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat ? "bg-forest-800 text-ivory" : "bg-ivory-100 text-forest-700 hover:bg-ivory-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((v) => (
          <Card key={v.id} className="p-5 flex flex-col justify-between hover:border-gold/40 transition-all">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gold-800 bg-gold/10 px-2.5 py-0.5 rounded-full">
                  {v.category}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {v.rating.toFixed(1)}
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-forest-900 mt-2.5">{v.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Contact: {v.contact_person}</p>

              <div className="mt-3 space-y-1 text-xs text-forest-700">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {v.city}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  {v.phone}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  <span className="truncate">{v.email}</span>
                </p>
              </div>

              {v.services_offered && v.services_offered.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Specialist Offerings
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {v.services_offered.map((svc, i) => (
                      <span key={i} className="text-[10px] bg-ivory-100 text-forest-800 px-2 py-0.5 rounded">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Pricing model: <strong className="capitalize text-forest-900">{v.pricing_model_default.replace("_", " ")}</strong>
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Register Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Verified Vendor Partner"
        subtitle="Add a luxury supplier into The Royal Knot directory."
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Vendor / Company Name</label>
            <input
              type="text"
              required
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
                className="input-base"
                value={newVendor.contact_person}
                onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Rating (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                className="input-base"
                value={newVendor.rating}
                onChange={(e) => setNewVendor({ ...newVendor, rating: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Phone Number</label>
              <input
                type="tel"
                required
                className="input-base"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Email</label>
              <input
                type="email"
                required
                className="input-base"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label-base">Services Offered (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Royal Marwari Thali, Live Continental, Dessert Counter"
              className="input-base"
              value={servicesInput}
              onChange={(e) => setServicesInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              Register Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

