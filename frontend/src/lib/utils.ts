import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRFull(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0";
  if (currency === "INR") {
    return formatINR(amount);
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "TBD";
  try {
    return format(new Date(dateStr), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "TBD";
  try {
    return format(new Date(dateStr), "d MMM yyyy, h:mm a");
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    return differenceInDays(new Date(dateStr), new Date());
  } catch {
    return 0;
  }
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-50 text-blue-700 border border-blue-200",
    meeting_scheduled: "bg-amber-50 text-amber-700 border border-amber-200",
    agreement_sent: "bg-purple-50 text-purple-700 border border-purple-200",
    confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    lost: "bg-rose-50 text-rose-700 border border-rose-200",
    planning: "bg-blue-50 text-blue-700 border border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    settled: "bg-slate-50 text-slate-700 border border-slate-200",
    scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
    delayed: "bg-rose-50 text-rose-700 border border-rose-200",
    to_plan: "bg-stone-50 text-stone-600 border border-stone-200",
    done: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    draft: "bg-stone-50 text-stone-600 border border-stone-200",
    selected: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    partially_paid: "bg-sky-50 text-sky-700 border border-sky-200",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    open: "bg-rose-50 text-rose-700 border border-rose-200",
    resolving: "bg-amber-50 text-amber-700 border border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    expected: "bg-blue-50 text-blue-700 border border-blue-200",
    arrived: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    absent: "bg-rose-50 text-rose-700 border border-rose-200",
    low: "bg-slate-50 text-slate-600 border border-slate-200",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    high: "bg-orange-50 text-orange-700 border border-orange-200",
    urgent: "bg-rose-50 text-rose-700 border border-rose-200",
    critical: "bg-red-100 text-red-800 border border-red-300 font-semibold",
  };
  return map[status.toLowerCase()] ?? "bg-stone-50 text-stone-600 border border-stone-200";
}

export function formatStatusLabel(status: string): string {
  if (!status) return "";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getActiveWeddingId(): string {
  return localStorage.getItem("active_wedding_id") || "";
}

