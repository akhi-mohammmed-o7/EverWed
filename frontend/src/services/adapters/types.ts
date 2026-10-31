import type {
  User,
  LoginRequest,
  LoginResponse,
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

export interface AuthService {
  login(payload: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
}

export interface EnquiryService {
  list(filters?: { status?: string }): Promise<Enquiry[]>;
  get(id: string): Promise<Enquiry>;
  create(payload: EnquiryCreate): Promise<Enquiry>;
  update(id: string, payload: EnquiryUpdate): Promise<Enquiry>;
  convert(id: string, payload: ConvertEnquiryRequest): Promise<{ message: string; wedding: Wedding }>;
}

export interface WeddingService {
  list(filters?: { status?: string }): Promise<Wedding[]>;
  get(id: string): Promise<Wedding>;
  create(payload: WeddingCreate): Promise<Wedding>;
  update(id: string, payload: WeddingUpdate): Promise<Wedding>;
}

export interface EventService {
  listForWedding(weddingId: string): Promise<WeddingEvent[]>;
  get(eventId: string): Promise<WeddingEvent>;
  create(weddingId: string, payload: EventCreate): Promise<WeddingEvent>;
  update(eventId: string, payload: EventUpdate): Promise<WeddingEvent>;
}

export interface VendorService {
  list(filters?: { category?: string; city?: string }): Promise<Vendor[]>;
  get(id: string): Promise<Vendor>;
  create(payload: VendorCreate): Promise<Vendor>;
  update(id: string, payload: VendorUpdate): Promise<Vendor>;
}

export interface QuoteService {
  list(weddingId: string, category?: string): Promise<Quote[]>;
  compare(weddingId: string, category: string): Promise<QuoteComparison>;
  create(payload: QuoteCreate): Promise<Quote>;
  selectWinner(quoteId: string): Promise<{ message: string; selected_quote: Quote; agreed_price_inr: number; vendor_name: string }>;
}

export interface TaskService {
  list(weddingId: string, filters?: { status?: string; category?: string; priority?: string; owner?: string }): Promise<Task[]>;
  create(weddingId: string, payload: TaskCreate): Promise<Task>;
  update(taskId: string, payload: TaskUpdate): Promise<Task>;
}

export interface OperationService {
  getOverview(weddingId: string): Promise<OperationsOverview>;
  addScheduleItem(weddingId: string, eventId: string, payload: ScheduleItemCreate): Promise<ScheduleItem>;
  listSchedule(weddingId: string, eventId?: string): Promise<ScheduleItem[]>;
  updateScheduleItem(itemId: string, payload: Partial<ScheduleItem>): Promise<ScheduleItem>;
  logVendorArrival(payload: {
    wedding_id: string;
    event_id: string;
    vendor_id: string;
    planned_arrival_time: string;
    actual_arrival_time?: string;
    delay_minutes?: number;
    notes?: string;
  }): Promise<VendorArrivalLog>;
  reportIssue(payload: {
    wedding_id: string;
    event_id: string;
    title: string;
    severity: string;
    owner: string;
    action_taken?: string;
  }): Promise<OperationalIssue>;
  resolveIssue(issueId: string, action_taken: string): Promise<OperationalIssue>;
}

export interface FinanceService {
  listClientPayments(weddingId: string): Promise<ClientPayment[]>;
  recordClientPayment(payload: ClientPaymentCreate): Promise<ClientPayment>;
  listVendorBills(weddingId: string): Promise<VendorBill[]>;
  recordVendorBill(payload: VendorBillCreate): Promise<VendorBill>;
  recordVendorPayment(payload: VendorPaymentCreate): Promise<VendorPayment>;
  getFinancialSummary(weddingId: string): Promise<FinancialSummary>;
}

export interface DashboardService {
  getOverview(): Promise<DashboardOverview>;
}

export interface GuestService {
  list(weddingId: string): Promise<Guest[]>;
  create(guest: Omit<Guest, "id">): Promise<Guest>;
  update(id: string, payload: Partial<Guest>): Promise<Guest>;
  delete(id: string): Promise<void>;
}

export interface ServiceAdapter {
  auth: AuthService;
  enquiries: EnquiryService;
  weddings: WeddingService;
  events: EventService;
  vendors: VendorService;
  quotes: QuoteService;
  tasks: TaskService;
  operations: OperationService;
  finance: FinanceService;
  dashboard: DashboardService;
  guests: GuestService;
  isDemo: boolean;
}

