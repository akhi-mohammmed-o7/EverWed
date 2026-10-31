import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Crown,
  Utensils,
  Trash2,
  Pencil,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { services } from "@/services";
import type { Guest } from "@/types";
import { getActiveWeddingId } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Wedding } from "@/types";

export const CoupleGuestsPage: React.FC = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [rsvpFilter, setRsvpFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importErrors, setImportErrors] = useState<Array<{ row: number; message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuest, setNewGuest] = useState<Omit<Guest, "id">>({
    wedding_id: user?.wedding_id || getActiveWeddingId(),
    name: "",
    email: "",
    phone: "",
    side: "mutual",
    rsvp_status: "pending",
    meal_preference: "",
    table_number: "",
    is_vip: false,
    plus_ones: 0,
    notes: "",
  });

  const loadGuests = async () => {
    const weddingId = user?.wedding_id;
    if (!weddingId) {
      setGuests([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setGuests(await services.guests.list(weddingId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your guest list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
    if (user?.wedding_id) services.weddings.get(user.wedding_id).then(setWedding).catch((error) => console.error("Unable to load wedding estimate:", error));
  }, [user?.wedding_id]);

  const resetGuestForm = () => {
    setEditingGuestId(null);
    setNewGuest({
      wedding_id: user?.wedding_id || getActiveWeddingId(),
      name: "",
      email: "",
      phone: "",
      side: "bride",
      rsvp_status: "pending",
      meal_preference: "Vegetarian",
      table_number: "",
      is_vip: false,
      plus_ones: 0,
      notes: "",
    });
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name.trim()) return;
    if (!user?.wedding_id) {
      setError("Your wedding workspace is not ready yet.");
      return;
    }
    setError("");
    try {
      if (editingGuestId) {
        await services.guests.update(editingGuestId, {
          name: newGuest.name.trim(),
          email: (newGuest.email || "").trim(),
          phone: (newGuest.phone || "").trim(),
          side: newGuest.side,
          rsvp_status: newGuest.rsvp_status,
          meal_preference: (newGuest.meal_preference || "").trim(),
          table_number: (newGuest.table_number || "").trim(),
          is_vip: newGuest.is_vip,
          plus_ones: newGuest.plus_ones,
          notes: (newGuest.notes || "").trim(),
        });
      } else {
        await services.guests.create({ ...newGuest, wedding_id: user.wedding_id });
      }
      setIsAddModalOpen(false);
      resetGuestForm();
      await loadGuests();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this guest.");
    }
  };

  const handleCsvImport = async (file: File | undefined) => {
    if (!file) return;
    if (!user?.wedding_id) {
      setError("Your wedding workspace is not ready yet.");
      return;
    }
    setImportBusy(true);
    setError("");
    setImportMessage("");
    setImportErrors([]);
    try {
      const csv = await file.text();
      const result = await services.guests.importCsv(user.wedding_id, csv);
      setImportMessage(
        `Imported ${result.created} guest${result.created === 1 ? "" : "s"}. Skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}. ${result.error_count} row${result.error_count === 1 ? "" : "s"} failed validation.`
      );
      setImportErrors(result.errors);
      await loadGuests();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to import this CSV file.");
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openAddGuest = () => {
    resetGuestForm();
    setIsAddModalOpen(true);
    setError("");
  };

  const openEditGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setNewGuest({
      wedding_id: guest.wedding_id,
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      side: guest.side,
      rsvp_status: guest.rsvp_status,
      meal_preference: guest.meal_preference || "",
      table_number: guest.table_number || "",
      is_vip: guest.is_vip,
      plus_ones: guest.plus_ones,
      notes: guest.notes || "",
    });
    setIsAddModalOpen(true);
    setError("");
  };

  const handleDelete = async (id: string) => {
    setError("");
    try {
      await services.guests.delete(id);
      await loadGuests();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove this guest.");
    }
  };

  const filtered = guests.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      g.name.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.table_number && g.table_number.toLowerCase().includes(q));
    const matchesSide = sideFilter === "all" || g.side === sideFilter;
    const matchesRsvp = rsvpFilter === "all" || g.rsvp_status === rsvpFilter;
    return matchesSearch && matchesSide && matchesRsvp;
  });

  const totalHeadcount = guests.reduce((sum, g) => sum + 1 + (g.plus_ones || 0), 0);
  const confirmedCount = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const pendingCount = guests.filter((g) => g.rsvp_status === "pending").length;
  const declinedCount = guests.filter((g) => g.rsvp_status === "declined").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Guest Hospitality & Seating
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
            Guest List, RSVP & Table Mapping
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage invitations, dietary preferences, VIP seating arrangements, and RSVP confirmations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleCsvImport(event.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={importBusy} className="font-bold">
            <Upload className="w-4 h-4 mr-1.5" />
            Import CSV
          </Button>
          <Button variant="gold" onClick={openAddGuest} className="font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            Add guest
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {importMessage && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p>{importMessage}</p>
          <p className="mt-1 text-xs">CSV columns accepted: name, email, phone, side, rsvp, plus ones, meal, table number, vip, notes.</p>
          {importErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {importErrors.map((issue) => (
                <li key={`${issue.row}-${issue.message}`}>Row {issue.row}: {issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Planned guest estimate" value={wedding?.guest_estimate ?? "—"} subtitle="Planning estimate" icon={<Users className="w-5 h-5 text-forest-800" />} />
        <StatCard
          title="Guests on record"
          value={totalHeadcount}
          subtitle={`${guests.length} invitations sent`}
          icon={<Users className="w-5 h-5 text-forest-800" />}
        />
        <StatCard
          title="Confirmed invitations"
          value={confirmedCount}
          subtitle={`${Math.round((confirmedCount / (guests.length || 1)) * 100)}% attendance confirmed`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Pending Responses"
          value={pendingCount}
          subtitle="Follow-ups in progress"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Declined responses"
          value={declinedCount}
          subtitle="Guests not attending"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, table number..."
            className="input-base pl-9 text-xs py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-ivory-100 p-1 rounded-xl">
            {["all", "bride", "groom", "mutual"].map((s) => (
              <button
                key={s}
                onClick={() => setSideFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  sideFilter === s ? "bg-white text-forest-900 shadow-xs" : "text-forest-700"
                }`}
              >
                {s === "all" ? "All Sides" : `${s}'s Side`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-ivory-100 p-1 rounded-xl">
            {["all", "confirmed", "pending", "declined"].map((r) => (
              <button
                key={r}
                onClick={() => setRsvpFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  rsvpFilter === r ? "bg-white text-forest-900 shadow-xs" : "text-forest-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 text-forest-800 uppercase tracking-wider font-semibold border-b border-border/80">
              <tr>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4">Table / Seating</th>
                <th className="py-3 px-4">Dietary Preference</th>
                <th className="py-3 px-4">Plus-Ones</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    {guests.length === 0
                      ? "No guests recorded yet. Add your first guest invitation."
                      : "No guests match these filters."}
                  </td>
                </tr>
              )}
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-ivory-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-900">{g.name}</span>
                      {g.is_vip && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/20 text-gold-900 border border-gold/40 flex items-center gap-0.5">
                          <Crown className="w-3 h-3 text-gold-700" /> VIP
                        </span>
                      )}
                    </div>
                    {g.email && <span className="text-[11px] text-muted-foreground block">{g.email}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-forest-700 capitalize">{g.side}</td>
                  <td className="py-3.5 px-4">
                    <Badge status={g.rsvp_status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{g.table_number || "Unassigned"}</td>
                  <td className="py-3.5 px-4 text-forest-800">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Utensils className="w-3 h-3 text-gold-700" />
                      {g.meal_preference || "Standard"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-forest-900">{g.plus_ones > 0 ? `+${g.plus_ones}` : "0"}</td>
                  <td className="py-3.5 px-4 text-muted-foreground italic max-w-xs truncate">{g.notes || "-"}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEditGuest(g)}
                      className="p-1 text-forest-700 hover:bg-ivory-100 rounded transition-colors"
                      title="Edit guest"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remove guest"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Guest Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetGuestForm(); }}
        title={editingGuestId ? "Edit guest" : "Add guest invitation"}
        subtitle="Record contact details, RSVP, meal choice, and table seating."
      >
        <form onSubmit={handleAddGuest} className="space-y-3.5 text-xs">
          <div>
            <label className="label-base">Guest Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Maharani Gayatri Devi"
              className="input-base"
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Email</label>
              <input
                type="email"
                placeholder="guest@domain.com"
                className="input-base"
                value={newGuest.email || ""}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label-base">Phone</label>
              <input
                type="tel"
                placeholder="+91 98000 00000"
                className="input-base"
                value={newGuest.phone || ""}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Family Side</label>
              <select
                className="input-base"
                value={newGuest.side}
                onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value as any })}
              >
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="mutual">Mutual Friend</option>
              </select>
            </div>
            <div>
              <label className="label-base">RSVP Status</label>
              <select
                className="input-base"
                value={newGuest.rsvp_status}
                onChange={(e) => setNewGuest({ ...newGuest, rsvp_status: e.target.value as any })}
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="label-base">Plus Ones</label>
              <input
                type="number"
                min="0"
                max="5"
                className="input-base"
                value={newGuest.plus_ones}
                onChange={(e) => setNewGuest({ ...newGuest, plus_ones: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Meal Preference</label>
              <select
                className="input-base"
                value={newGuest.meal_preference}
                onChange={(e) => setNewGuest({ ...newGuest, meal_preference: e.target.value })}
              >
                <option value="">No preference</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Jain Vegetarian">Jain Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
            <div>
              <label className="label-base">Table Assignment</label>
              <input
                type="text"
                placeholder="e.g. Table A1"
                className="input-base"
                value={newGuest.table_number || ""}
                onChange={(e) => setNewGuest({ ...newGuest, table_number: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="vipCheck"
              className="rounded"
              checked={newGuest.is_vip}
              onChange={(e) => setNewGuest({ ...newGuest, is_vip: e.target.checked })}
            />
            <label htmlFor="vipCheck" className="text-xs font-semibold text-forest-900 cursor-pointer">
              Mark as VIP guest
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); resetGuestForm(); }}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              {editingGuestId ? "Save changes" : "Save guest"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

