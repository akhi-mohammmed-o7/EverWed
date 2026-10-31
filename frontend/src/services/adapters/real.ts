import { apiClient } from "../api/client";
import type { ServiceAdapter } from "./types";
import type {
  LoginRequest,
  LoginResponse,
  User,
  Enquiry,
  EnquiryCreate,
  EnquiryUpdate,
  ConvertEnquiryRequest,
  Wedding,
  WeddingCreate,
  WeddingUpdate,
  WeddingEvent,
  EventCreate,
  EventUpdate,
  Vendor,
  VendorCreate,
  VendorUpdate,
  Quote,
  QuoteCreate,
  QuoteComparison,
  Task,
  TaskCreate,
  TaskUpdate,
  ScheduleItem,
  ScheduleItemCreate,
  VendorArrivalLog,
  OperationalIssue,
  OperationsOverview,
  ClientPayment,
  ClientPaymentCreate,
  VendorBill,
  VendorBillCreate,
  VendorPayment,
  VendorPaymentCreate,
  FinancialSummary,
  DashboardOverview,
  Guest,
} from "@/types";

export const realAdapter: ServiceAdapter = {
  isDemo: false,

  auth: {
    login: (payload: LoginRequest): Promise<LoginResponse> =>
      apiClient.post<LoginResponse>("/api/v1/auth/login", payload),
    logout: () => apiClient.post<void>("/api/v1/auth/logout", {}),
    me: () => apiClient.get<User>("/api/v1/auth/me"),
  },

  enquiries: {
    list: (filters) => {
      const params = filters?.status ? `?status=${filters.status}` : "";
      return apiClient.get<Enquiry[]>(`/api/v1/enquiries${params}`);
    },
    get: (id) => apiClient.get<Enquiry>(`/api/v1/enquiries/${id}`),
    create: (payload: EnquiryCreate) => apiClient.post<Enquiry>("/api/v1/enquiries", payload),
    update: (id, payload: EnquiryUpdate) => apiClient.patch<Enquiry>(`/api/v1/enquiries/${id}`, payload),
    convert: (id, payload: ConvertEnquiryRequest) =>
      apiClient.post<{ message: string; wedding: Wedding }>(`/api/v1/enquiries/${id}/convert`, payload),
  },

  weddings: {
    list: (filters) => {
      const params = filters?.status ? `?status=${filters.status}` : "";
      return apiClient.get<Wedding[]>(`/api/v1/weddings${params}`);
    },
    get: (id) => apiClient.get<Wedding>(`/api/v1/weddings/${id}`),
    create: (payload: WeddingCreate) => apiClient.post<Wedding>("/api/v1/weddings", payload),
    update: (id, payload: WeddingUpdate) => apiClient.patch<Wedding>(`/api/v1/weddings/${id}`, payload),
  },

  events: {
    listForWedding: (weddingId) => apiClient.get<WeddingEvent[]>(`/api/v1/weddings/${weddingId}/events`),
    get: (eventId) => apiClient.get<WeddingEvent>(`/api/v1/events/${eventId}`),
    create: (weddingId, payload: EventCreate) =>
      apiClient.post<WeddingEvent>(`/api/v1/weddings/${weddingId}/events`, payload),
    update: (eventId, payload: EventUpdate) => apiClient.patch<WeddingEvent>(`/api/v1/events/${eventId}`, payload),
  },

  vendors: {
    list: (filters) => {
      const params = new URLSearchParams();
      if (filters?.category) params.set("category", filters.category);
      if (filters?.city) params.set("city", filters.city);
      const q = params.toString();
      return apiClient.get<Vendor[]>(`/api/v1/vendors${q ? "?" + q : ""}`);
    },
    get: (id) => apiClient.get<Vendor>(`/api/v1/vendors/${id}`),
    create: (payload: VendorCreate) => apiClient.post<Vendor>("/api/v1/vendors", payload),
    update: (id, payload: VendorUpdate) => apiClient.patch<Vendor>(`/api/v1/vendors/${id}`, payload),
  },

  quotes: {
    list: (weddingId, category) => {
      const params = new URLSearchParams({ wedding_id: weddingId });
      if (category) params.set("category", category);
      return apiClient.get<Quote[]>(`/api/v1/quotes?${params.toString()}`);
    },
    compare: (weddingId, category) =>
      apiClient.get<QuoteComparison>(
        `/api/v1/quotes/compare?wedding_id=${weddingId}&category=${encodeURIComponent(category)}`
      ),
    create: (payload: QuoteCreate) => apiClient.post<Quote>("/api/v1/quotes", payload),
    selectWinner: (quoteId) =>
      apiClient.post<{ message: string; selected_quote: Quote; agreed_price_inr: number; vendor_name: string }>(
        `/api/v1/quotes/${quoteId}/select`,
        {}
      ),
  },

  tasks: {
    list: (weddingId, filters) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.priority) params.set("priority", filters.priority);
      if (filters?.owner) params.set("owner", filters.owner);
      const q = params.toString();
      return apiClient.get<Task[]>(`/api/v1/weddings/${weddingId}/tasks${q ? "?" + q : ""}`);
    },
    create: (weddingId, payload: TaskCreate) => apiClient.post<Task>(`/api/v1/weddings/${weddingId}/tasks`, payload),
    update: (taskId, payload: TaskUpdate) => apiClient.patch<Task>(`/api/v1/tasks/${taskId}`, payload),
  },

  operations: {
    getOverview: (weddingId) => apiClient.get<OperationsOverview>(`/api/v1/operations/weddings/${weddingId}/overview`),
    addScheduleItem: (weddingId, eventId, payload: ScheduleItemCreate) =>
      apiClient.post<ScheduleItem>(`/api/v1/operations/weddings/${weddingId}/events/${eventId}/schedule`, payload),
    listSchedule: (weddingId, eventId) => {
      const params = eventId ? `?event_id=${eventId}` : "";
      return apiClient.get<ScheduleItem[]>(`/api/v1/operations/weddings/${weddingId}/schedule${params}`);
    },
    updateScheduleItem: (itemId, payload) => apiClient.patch<ScheduleItem>(`/api/v1/operations/schedule/${itemId}`, payload),
    logVendorArrival: (payload) => apiClient.post<VendorArrivalLog>("/api/v1/operations/vendor-arrivals", payload),
    reportIssue: (payload) => apiClient.post<OperationalIssue>("/api/v1/operations/issues", payload),
    resolveIssue: (issueId, action_taken) =>
      apiClient.post<OperationalIssue>(`/api/v1/operations/issues/${issueId}/resolve`, { action_taken }),
  },

  finance: {
    listClientPayments: (weddingId) =>
      apiClient.get<ClientPayment[]>(`/api/v1/finance/client-payments?wedding_id=${weddingId}`),
    recordClientPayment: (payload: ClientPaymentCreate) =>
      apiClient.post<ClientPayment>("/api/v1/finance/client-payments", payload),
    listVendorBills: (weddingId) =>
      apiClient.get<VendorBill[]>(`/api/v1/finance/vendor-bills?wedding_id=${weddingId}`),
    recordVendorBill: (payload: VendorBillCreate) =>
      apiClient.post<VendorBill>("/api/v1/finance/vendor-bills", payload),
    recordVendorPayment: (payload: VendorPaymentCreate) =>
      apiClient.post<VendorPayment>("/api/v1/finance/vendor-payments", payload),
    getFinancialSummary: (weddingId) =>
      apiClient.get<FinancialSummary>(`/api/v1/finance/weddings/${weddingId}/summary`),
  },

  dashboard: {
    getOverview: () => apiClient.get<DashboardOverview>("/api/v1/dashboard/overview"),
  },

  guests: {
    list: (_weddingId) => Promise.resolve([]),
    create: (guest) => Promise.resolve({ id: "g-" + Date.now(), ...guest } as Guest),
    update: (id, payload) => Promise.resolve({ id, ...payload } as Guest),
    delete: (_id) => Promise.resolve(),
  },
};

