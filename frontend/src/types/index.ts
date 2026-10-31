// ── Auth Types ──
export interface User {
  uid: number;
  name: string;
  email?: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ── Common API Types ──
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    detail?: string;
  };
}

// ── Enquiry Types ──
export interface MeetingRecord {
  meeting_date: string;
  location_or_link: string;
  notes: string;
  outcome?: string;
  created_at: string;
}

export interface Enquiry {
  id: string;
  bride_name: string;
  groom_name: string;
  contact_email: string;
  contact_phone: string;
  enquiry_source: string;
  package_type: string;
  target_date?: string;
  destination: string;
  estimated_guests: number;
  theme: string;
  estimated_budget: number;
  requirements?: string;
  status: 'new' | 'meeting_scheduled' | 'agreement_sent' | 'confirmed' | 'lost';
  meetings: MeetingRecord[];
  agreement_signed: boolean;
  agreement_file?: string;
  converted_wedding_id?: string;
  odoo_lead_id?: number;
  odoo_partner_id?: number;
  created_at: string;
  updated_at: string;
}

export interface EnquiryCreate {
  bride_name: string;
  groom_name: string;
  contact_email: string;
  contact_phone: string;
  enquiry_source?: string;
  package_type?: string;
  target_date?: string;
  destination?: string;
  estimated_guests?: number;
  theme?: string;
  estimated_budget: number;
  requirements?: string;
}

export interface EnquiryUpdate {
  status?: string;
  meeting?: MeetingRecord;
  agreement_signed?: boolean;
  agreement_file?: string;
  requirements?: string;
  estimated_budget?: number;
  estimated_guests?: number;
}

export interface ConvertEnquiryRequest {
  package_type?: string;
  confirmed_budget?: number;
  primary_venue?: string;
  wedding_start_date?: string;
  wedding_end_date?: string;
}

// ── Wedding Types ──
export interface Wedding {
  id: string;
  enquiry_id?: string;
  title: string;
  bride_name: string;
  groom_name: string;
  contact_phone: string;
  contact_email: string;
  destination: string;
  primary_venue: string;
  package_type: string;
  guest_estimate: number;
  theme: string;
  budget_allocated: number;
  start_date: string;
  end_date: string;
  status: 'planning' | 'in_progress' | 'completed' | 'settled';
  events_count: number;
  vendors_count: number;
  tasks_count: number;
  tasks_completed: number;
  total_agreed_vendor_cost: number;
  total_paid_by_client: number;
  total_paid_to_vendors: number;
  odoo_project_id?: number;
  odoo_partner_id?: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingCreate {
  title: string;
  bride_name: string;
  groom_name: string;
  contact_phone: string;
  contact_email: string;
  destination?: string;
  primary_venue: string;
  package_type?: string;
  guest_estimate?: number;
  theme?: string;
  budget_allocated: number;
  start_date: string;
  end_date: string;
  enquiry_id?: string;
}

export interface WeddingUpdate {
  title?: string;
  primary_venue?: string;
  package_type?: string;
  guest_estimate?: number;
  theme?: string;
  budget_allocated?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// ── Event Types ──
export interface WeddingEvent {
  id: string;
  name: string;
  wedding_id: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_hall: string;
  coordinator_name: string;
  coordinator_phone?: string;
  guest_estimate: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  odoo_task_id?: number;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_hall: string;
  coordinator_name: string;
  coordinator_phone?: string;
  guest_estimate?: number;
  notes?: string;
}

export interface EventUpdate {
  name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  venue_hall?: string;
  coordinator_name?: string;
  coordinator_phone?: string;
  guest_estimate?: number;
  status?: string;
  notes?: string;
}

// ── Vendor Types ──
export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_person: string;
  phone: string;
  email: string;
  city: string;
  rating: number;
  services_offered: string[];
  pricing_model_default: 'fixed' | 'per_plate';
  bank_account_details?: string;
  odoo_partner_id?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorCreate {
  name: string;
  category: string;
  contact_person: string;
  phone: string;
  email: string;
  city?: string;
  rating?: number;
  services_offered?: string[];
  pricing_model_default?: string;
  bank_account_details?: string;
}

export interface VendorUpdate {
  name?: string;
  category?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  city?: string;
  rating?: number;
  services_offered?: string[];
  bank_account_details?: string;
}

// ── Quote Types ──
export interface Quote {
  id: string;
  wedding_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_category: string;
  event_id?: string;
  pricing_type: 'fixed' | 'per_plate';
  unit_price: number;
  estimated_quantity: number;
  normalized_total: number;
  scope_of_work: string;
  inclusions: string[];
  exclusions: string[];
  extra_hour_rate: number;
  status: 'draft' | 'submitted' | 'selected' | 'rejected';
  odoo_purchase_order_id?: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteCreate {
  wedding_id: string;
  vendor_id: string;
  event_id?: string;
  category: string;
  pricing_type?: string;
  unit_price: number;
  estimated_quantity?: number;
  scope_of_work: string;
  inclusions?: string[];
  exclusions?: string[];
  extra_hour_rate?: number;
  notes?: string;
}

export interface QuoteComparisonItem {
  quote_id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  pricing_type: string;
  unit_price: number;
  estimated_quantity: number;
  normalized_total: number;
  extra_hour_rate: number;
  inclusions: string[];
  status: string;
  is_winner: boolean;
}

export interface QuoteComparison {
  wedding_id: string;
  category: string;
  guest_count: number;
  quotes: QuoteComparisonItem[];
  lowest_quote_id?: string;
  selected_quote_id?: string;
}

// ── Task Types ──
export interface Task {
  id: string;
  wedding_id: string;
  event_id?: string;
  title: string;
  category: string;
  owner: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'to_plan' | 'in_progress' | 'done';
  notes?: string;
  is_overdue: boolean;
  odoo_task_id?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  event_id?: string;
  title: string;
  category?: string;
  owner: string;
  due_date: string;
  priority?: string;
  notes?: string;
}

export interface TaskUpdate {
  title?: string;
  event_id?: string;
  category?: string;
  owner?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  notes?: string;
}

// ── Operations Types ──
export interface ScheduleItem {
  id: string;
  wedding_id: string;
  event_id: string;
  time_slot: string;
  title: string;
  description?: string;
  responsible_person: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  created_at: string;
  updated_at: string;
}

export interface ScheduleItemCreate {
  time_slot: string;
  title: string;
  description?: string;
  responsible_person: string;
  location: string;
}

export interface VendorArrivalLog {
  id: string;
  wedding_id: string;
  event_id: string;
  vendor_id: string;
  vendor_name: string;
  service_category: string;
  planned_arrival_time: string;
  actual_arrival_time?: string;
  status: 'expected' | 'arrived' | 'delayed' | 'absent';
  contact_phone?: string;
  delay_minutes: number;
  notes?: string;
}

export interface OperationalIssue {
  id: string;
  wedding_id: string;
  event_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  status: 'open' | 'resolving' | 'resolved';
  action_taken?: string;
  created_at: string;
  resolved_at?: string;
}

export interface OperationsOverview {
  wedding_id: string;
  wedding_title: string;
  events_today: WeddingEvent[];
  schedule: ScheduleItem[];
  vendor_arrivals: VendorArrivalLog[];
  active_issues: OperationalIssue[];
  resolved_issues_count: number;
}

// ── Finance Types ──
export interface ClientPayment {
  id: string;
  wedding_id: string;
  stage: string;
  amount: number;
  payment_method: string;
  transaction_reference: string;
  payment_date: string;
  status: 'received' | 'verified';
  notes?: string;
  odoo_payment_id?: number;
  created_at: string;
}

export interface ClientPaymentCreate {
  wedding_id: string;
  stage: string;
  amount: number;
  payment_method?: string;
  transaction_reference: string;
  payment_date: string;
  notes?: string;
}

export interface VendorBill {
  id: string;
  wedding_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_category: string;
  event_id?: string;
  quote_id?: string;
  bill_number: string;
  agreed_amount: number;
  billed_amount: number;
  variance: number;
  variance_reason?: string;
  total_paid: number;
  outstanding_balance: number;
  status: 'pending' | 'partially_paid' | 'paid';
  payments: VendorPayment[];
  bill_date: string;
  due_date: string;
  odoo_invoice_id?: number;
  created_at: string;
}

export interface VendorBillCreate {
  wedding_id: string;
  vendor_id: string;
  event_id?: string;
  quote_id?: string;
  bill_number: string;
  agreed_amount: number;
  billed_amount: number;
  variance_reason?: string;
  bill_date: string;
  due_date: string;
}

export interface VendorPayment {
  id: string;
  bill_id: string;
  vendor_id: string;
  amount: number;
  payment_type: 'advance' | 'final';
  payment_method: string;
  transaction_reference: string;
  payment_date: string;
  odoo_payment_id?: number;
  created_at: string;
}

export interface VendorPaymentCreate {
  bill_id: string;
  amount: number;
  payment_type?: string;
  payment_method?: string;
  transaction_reference: string;
  payment_date: string;
  notes?: string;
}

export interface FinancialSummary {
  wedding_id: string;
  wedding_title: string;
  total_contract_value: number;
  client_paid_amount: number;
  client_outstanding_receivable: number;
  client_payment_status: string;
  agreed_vendor_total: number;
  actual_vendor_bills_total: number;
  vendor_paid_amount: number;
  vendor_outstanding_payable: number;
  cost_variance: number;
  net_agency_profit: number;
  profit_margin_percentage: number;
}

// ── Dashboard Types ──
export interface WeddingProfitabilitySummary {
  wedding_id: string;
  title: string;
  destination: string;
  package_type: string;
  guest_estimate: number;
  contract_value: number;
  client_paid: number;
  vendor_costs: number;
  gross_profit: number;
  margin_percent: number;
}

export interface DashboardOverview {
  active_weddings_count: number;
  upcoming_events_count: number;
  pending_tasks_count: number;
  overdue_tasks_count: number;
  total_client_receivables_outstanding: number;
  total_client_payments_received: number;
  total_vendor_payables_outstanding: number;
  total_vendor_bills_recorded: number;
  season_contracted_revenue: number;
  season_actual_expenses: number;
  season_estimated_profit: number;
  active_weddings: WeddingProfitabilitySummary[];
  upcoming_events: WeddingEvent[];
  urgent_tasks: Task[];
  recent_issues: OperationalIssue[];
}

// ── Guest & RSVP Types (Couple Portal) ──
export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  email?: string;
  phone?: string;
  side: 'bride' | 'groom' | 'mutual';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  meal_preference?: string;
  table_number?: string;
  is_vip: boolean;
  plus_ones: number;
  notes?: string;
}
