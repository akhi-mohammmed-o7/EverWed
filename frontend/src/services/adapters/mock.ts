import type { ServiceAdapter } from "./types";
import type {
  User,
  UserCreate,
  CoupleSignupRequest,
  Enquiry,
  Wedding,
  WeddingEvent,
  Vendor,
  Quote,
  Task,
  ClientPayment,
  VendorBill,
  VendorPayment,
  DashboardOverview,
  ScheduleItem,
  VendorArrivalLog,
  OperationalIssue,
  Guest,
} from "@/types";

let mockToken: string | null = null;
const mockUser: User = { uid: 1, name: "Priya Arora", email: "priya@everwed.in", role: "admin" };
let _mockUsers: User[] = [
  mockUser,
  { uid: 99, name: "Demo Planner", email: "planner@demo.everwed.local", role: "planner" },
  { uid: 2, name: "Aisha Sharma", email: "aisha@heritageknot.com", role: "couple", wedding_id: "wed-royal-jaipur-001" },
];

const NOW = new Date().toISOString();
const WEDDING_ID = "wed-royal-jaipur-001";
const ENQ_ID = "enq-royal-demo-001";

const initialEnquiries: Enquiry[] = [
  {
    id: ENQ_ID,
    bride_name: "Aisha Sharma",
    groom_name: "Vikram Singh Rathore",
    contact_email: "aisha.vikram@heritageknot.com",
    contact_phone: "+91 98290 12345",
    enquiry_source: "Instagram",
    package_type: "Royal Bespoke",
    target_date: "2026-12-10",
    destination: "Jaipur",
    estimated_guests: 450,
    theme: "Royal Heritage Palace",
    estimated_budget: 35000000,
    requirements: "Destination winter palace wedding with authentic royal banquet, vintage drapes, and celebrity sangeet.",
    status: "confirmed",
    meetings: [
      {
        meeting_date: "2026-11-05T15:00:00Z",
        location_or_link: "Rambagh Palace Jaipur Lounge",
        notes: "Couple confirmed 450 guests, approved full-service royal bespoke planning.",
        outcome: "Service agreement signed digitally with 25% booking advance.",
        created_at: NOW,
      },
    ],
    agreement_signed: true,
    agreement_file: "https://storage.royalknot.in/agreements/aisha-vikram-signed.pdf",
    converted_wedding_id: WEDDING_ID,
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-20T14:00:00Z",
  },
  {
    id: "enq-002",
    bride_name: "Meera Patel",
    groom_name: "Arjun Mehta",
    contact_email: "meera.arjun@gmail.com",
    contact_phone: "+91 99280 54321",
    enquiry_source: "Google",
    package_type: "Signature",
    target_date: "2027-02-14",
    destination: "Udaipur",
    estimated_guests: 300,
    theme: "Lake Palace Romantic",
    estimated_budget: 18000000,
    requirements: "Lakeside romantic celebrations with floating floral mandap and live classical sitar.",
    status: "meeting_scheduled",
    meetings: [
      {
        meeting_date: "2026-11-12T16:00:00Z",
        location_or_link: "Google Meet",
        notes: "Initial tasting session discussion.",
        outcome: "Pending venue shortlist approval.",
        created_at: NOW,
      },
    ],
    agreement_signed: false,
    created_at: "2026-10-25T09:00:00Z",
    updated_at: "2026-10-26T11:00:00Z",
  },
  {
    id: "enq-003",
    bride_name: "Anjali Kapoor",
    groom_name: "Rohan Gupta",
    contact_email: "anjali.rohan@outlook.com",
    contact_phone: "+91 97720 66778",
    enquiry_source: "Referral",
    package_type: "Essential",
    target_date: "2027-01-20",
    destination: "Jaipur",
    estimated_guests: 150,
    theme: "Garden Chic Bohemian",
    estimated_budget: 6500000,
    requirements: "Intimate heritage boutique hotel with eco-friendly florals and live jazz.",
    status: "new",
    meetings: [],
    agreement_signed: false,
    created_at: "2026-10-28T14:00:00Z",
    updated_at: "2026-10-28T14:00:00Z",
  },
];

const initialWeddings: Wedding[] = [
  {
    id: WEDDING_ID,
    enquiry_id: ENQ_ID,
    title: "The Royal Union: Aisha & Vikram",
    bride_name: "Aisha Sharma",
    groom_name: "Vikram Singh Rathore",
    contact_phone: "+91 98290 12345",
    contact_email: "aisha.vikram@heritageknot.com",
    destination: "Jaipur",
    primary_venue: "City Palace & Rambagh, Jaipur",
    package_type: "Royal Bespoke",
    guest_estimate: 450,
    theme: "Royal Heritage Palace",
    budget_allocated: 35000000,
    start_date: "2026-12-10",
    end_date: "2026-12-13",
    status: "in_progress",
    events_count: 4,
    vendors_count: 5,
    tasks_count: 28,
    tasks_completed: 12,
    total_agreed_vendor_cost: 5750000,
    total_paid_by_client: 25000000,
    total_paid_to_vendors: 2475000,
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-28T14:00:00Z",
  },
  {
    id: "wed-udaipur-002",
    title: "Lakeside Romance: Meera & Arjun",
    bride_name: "Meera Patel",
    groom_name: "Arjun Mehta",
    contact_phone: "+91 99280 54321",
    contact_email: "meera.arjun@gmail.com",
    destination: "Udaipur",
    primary_venue: "Lake Palace Hotel, Udaipur",
    package_type: "Signature",
    guest_estimate: 300,
    theme: "Lake Palace Romantic",
    budget_allocated: 18000000,
    start_date: "2027-02-14",
    end_date: "2027-02-16",
    status: "planning",
    events_count: 3,
    vendors_count: 3,
    tasks_count: 28,
    tasks_completed: 5,
    total_agreed_vendor_cost: 3200000,
    total_paid_by_client: 5000000,
    total_paid_to_vendors: 800000,
    created_at: "2026-10-26T09:00:00Z",
    updated_at: "2026-10-26T09:00:00Z",
  },
];

const initialEvents: WeddingEvent[] = [
  {
    id: "evt-mehendi",
    name: "Royal Mehendi Carnival",
    wedding_id: WEDDING_ID,
    date: "2026-12-10",
    start_time: "14:00",
    end_time: "18:00",
    venue_hall: "Zenana Courtyard Gardens",
    coordinator_name: "Pooja Verma",
    coordinator_phone: "+91 98290 99001",
    guest_estimate: 250,
    status: "scheduled",
    notes: "10 master mehendi artists arranged, floral jewelry delivered.",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "evt-sangeet",
    name: "Desert Beats Sangeet",
    wedding_id: WEDDING_ID,
    date: "2026-12-11",
    start_time: "19:00",
    end_time: "01:00",
    venue_hall: "Manek Chowk Stage",
    coordinator_name: "Rohan Joshi",
    coordinator_phone: "+91 98290 99002",
    guest_estimate: 450,
    status: "scheduled",
    notes: "Celebrity DJ Kabir booked, acoustic line-array installed.",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "evt-pheras",
    name: "Vedic Wedding & Sacred Pheras",
    wedding_id: WEDDING_ID,
    date: "2026-12-12",
    start_time: "16:00",
    end_time: "21:00",
    venue_hall: "Sarvato Bhadra Mandap",
    coordinator_name: "Pooja Verma",
    coordinator_phone: "+91 98290 99001",
    guest_estimate: 450,
    status: "scheduled",
    notes: "Baraat vintage carriage path cleared, pandit ji protocol set.",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "evt-reception",
    name: "Grand Imperial Reception",
    wedding_id: WEDDING_ID,
    date: "2026-12-13",
    start_time: "19:30",
    end_time: "23:30",
    venue_hall: "Chandra Mahal Gardens",
    coordinator_name: "Arjun Rathore",
    coordinator_phone: "+91 98290 99003",
    guest_estimate: 500,
    status: "scheduled",
    notes: "Silver service royal banquet with 12 live counters.",
    created_at: NOW,
    updated_at: NOW,
  },
];

const initialVendors: Vendor[] = [
  {
    id: "v-royal-palace-caterers",
    name: "Rajputana Royal Feast and Catering",
    category: "Catering",
    contact_person: "Chef Vikram Rathore",
    phone: "+91 98290 11223",
    email: "vikram@rajputanafeast.com",
    city: "Jaipur",
    rating: 4.9,
    services_offered: ["Heritage Marwari Thali", "Live Continental Counters", "Mughlai BBQ", "Dessert Studios"],
    pricing_model_default: "per_plate",
    bank_account_details: "HDFC0001234 - AC 50200011223344",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-shahi-caterers-udaipur",
    name: "Mewar Shahi Banquets",
    category: "Catering",
    contact_person: "Manish Sharma",
    phone: "+91 94140 55667",
    email: "manish@mewarbanquets.com",
    city: "Udaipur",
    rating: 4.8,
    services_offered: ["Royal Mewari Feasts", "Chaat Street", "Gourmet Pan-Asian"],
    pricing_model_default: "per_plate",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-palace-decor",
    name: "Virasat Decor and Spatial Design",
    category: "Decor",
    contact_person: "Ananya Sen",
    phone: "+91 98290 77889",
    email: "ananya@virasatdesign.in",
    city: "Jaipur",
    rating: 5.0,
    services_offered: ["Floral Mandaps", "Bespoke Lighting", "Vintage Drapes", "Architectural Renders"],
    pricing_model_default: "fixed",
    bank_account_details: "SBIN0007890 - AC 30987654321",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-darbar-floral",
    name: "Royal Darbar Floral Architecture",
    category: "Decor",
    contact_person: "Devendra Chouhan",
    phone: "+91 98291 33445",
    email: "devendra@darbarflorals.com",
    city: "Udaipur",
    rating: 4.85,
    services_offered: ["Imported Dutch Orchids", "Glasshouse Pavilion", "Fountain Displays"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-regal-photo",
    name: "The Heritage Reel Studios",
    category: "Photography",
    contact_person: "Rohan Mehra",
    phone: "+91 98280 99887",
    email: "rohan@heritagereel.com",
    city: "Udaipur",
    rating: 4.95,
    services_offered: ["Cinematic 4K Films", "Candid Photography", "Drone Coverage", "Live Streaming"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-cine-lens",
    name: "Imperial Cine and Moments",
    category: "Photography",
    contact_person: "Kunal Kashyap",
    phone: "+91 98110 55443",
    email: "kunal@imperialcine.in",
    city: "Delhi NCR",
    rating: 4.88,
    services_offered: ["Editorial Vogue Shoots", "Same-day Edit Teasers", "Luxury Leather Albums"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-royal-dhol-dj",
    name: "DJ Kabir and Desert Beats Production",
    category: "Entertainment/DJ",
    contact_person: "Kabir Mathur",
    phone: "+91 99280 44332",
    email: "booking@djkabir.in",
    city: "Jaipur",
    rating: 4.9,
    services_offered: ["Sangeet DJ", "Rajasthani Folk Troupe", "Live Dhol Players", "Intelligent Stage Lighting"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-desert-rhythms",
    name: "Desert Rhythms Symphony and Orchestra",
    category: "Entertainment/DJ",
    contact_person: "Salim Khan",
    phone: "+91 94140 22119",
    email: "salim@desertrhythms.in",
    city: "Jodhpur",
    rating: 4.82,
    services_offered: ["Manganiyar Qawwali Ensemble", "Instrumental Sitar-Violin Fusion", "Bhangra Troupe"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-kalyani-styling",
    name: "Kalyani Celebrity Bridal Styling",
    category: "Makeup",
    contact_person: "Kalyani Verma",
    phone: "+91 98290 88776",
    email: "kalyani@kalyanistyling.in",
    city: "Jaipur",
    rating: 4.98,
    services_offered: ["Airbrush HD Bridal Makeup", "Traditional Saree Drapes", "Haute Coiffure", "Groom Grooming"],
    pricing_model_default: "per_plate",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-meera-atelier",
    name: "Meera Couture Beauty Atelier",
    category: "Makeup",
    contact_person: "Meera Singhania",
    phone: "+91 98101 22334",
    email: "contact@meerabeauty.in",
    city: "Delhi NCR",
    rating: 4.85,
    services_offered: ["Glass Skin Makeup", "Bridal Trousseau Styling", "Family Package for 10 Guests"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-royal-concierge",
    name: "Rajputana Royal Concierge and Hospitality",
    category: "Hospitality",
    contact_person: "Nandini Rathore",
    phone: "+91 98292 44556",
    email: "nandini@royalconcierge.in",
    city: "Jaipur",
    rating: 4.92,
    services_offered: ["Airport Arrival Desks", "Baggage Escort and Tagging", "Hotel Room Blocks Check-in", "WhatsApp Bot Support"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-marwar-logistics",
    name: "Marwar Express Luxury Fleet and Logistics",
    category: "Logistics",
    contact_person: "Gaurav Bhati",
    phone: "+91 98293 66778",
    email: "logistics@marwarexpress.com",
    city: "Jodhpur",
    rating: 4.88,
    services_offered: ["Golf Cart Shuttles", "Luggage Vans", "Vendor Loading Dock Management", "Emergency Fuel Backups"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-acoustic-crown",
    name: "Acoustic Crown Concert Sound and Visuals",
    category: "Audio/Visual",
    contact_person: "Praveen Dave",
    phone: "+91 98294 11998",
    email: "praveen@acousticcrown.com",
    city: "Jaipur",
    rating: 4.94,
    services_offered: ["JBL VTX Line-Array", "P3 LED Video Walls", "Wireless Shure Axient", "Digital Yamaha Consoles"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-heritage-vintage-fleet",
    name: "Heritage Royal Vintage Fleets",
    category: "Transportation",
    contact_person: "Ranvijay Singh",
    phone: "+91 98295 77112",
    email: "fleet@heritagevintage.in",
    city: "Jaipur",
    rating: 4.96,
    services_offered: ["Vintage Rolls Royce 1938", "Jaguar Convertibles for Baraat", "Mercedes Sprinter Shuttles"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-lumiere-lighting",
    name: "Lumiere Architectural Lights and Pyro FX",
    category: "Lighting",
    contact_person: "Abhinav Rawat",
    phone: "+91 98296 33221",
    email: "info@lumierelighting.in",
    city: "Jaipur",
    rating: 4.91,
    services_offered: ["Warm White Facade Washes", "Low-Fog Cold-Fire Varmala Pyro", "Crystal Chandeliers"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "v-lacquer-invites",
    name: "Kashmiri Lacquer and Gold-Leaf Invites",
    category: "Invitations",
    contact_person: "Zoya Mir",
    phone: "+91 98118 99887",
    email: "orders@lacquerinvites.in",
    city: "Delhi NCR",
    rating: 4.95,
    services_offered: ["Handcrafted Wooden Box Invites", "24K Gold Foil Inserts", "Digital Micro-Site RSVPs", "Saffron Welcome Gifts"],
    pricing_model_default: "fixed",
    created_at: NOW,
    updated_at: NOW,
  },
];

const initialQuotes: Quote[] = [
  {
    id: "q-caterer-winner",
    wedding_id: WEDDING_ID,
    vendor_id: "v-royal-palace-caterers",
    vendor_name: "Rajputana Royal Feast and Catering",
    vendor_category: "Catering",
    event_id: "evt-reception",
    pricing_type: "per_plate",
    unit_price: 4500,
    estimated_quantity: 450,
    normalized_total: 2025000,
    scope_of_work: "7-course Royal Marwari feast, 12 live interactive counters, silver cutlery service",
    inclusions: ["Silver service royal cutlery", "Uniformed waitstaff", "Chafing dishes", "Midnight chai stall", "Artisan dessert studio"],
    exclusions: ["Imported international spirits"],
    extra_hour_rate: 25000,
    status: "selected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-caterer-competitor",
    wedding_id: WEDDING_ID,
    vendor_id: "v-shahi-caterers-udaipur",
    vendor_name: "Mewar Shahi Banquets",
    vendor_category: "Catering",
    event_id: "evt-reception",
    pricing_type: "per_plate",
    unit_price: 3800,
    estimated_quantity: 450,
    normalized_total: 1710000,
    scope_of_work: "5-course regional banquet feast with standard buffet service tables",
    inclusions: ["Standard steel cutlery", "Basic buffet waitstaff", "Fresh welcome drinks"],
    exclusions: ["Silver plate service", "Live artisan dessert studio"],
    extra_hour_rate: 18000,
    status: "rejected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-decor-winner",
    wedding_id: WEDDING_ID,
    vendor_id: "v-palace-decor",
    vendor_name: "Virasat Decor and Spatial Design",
    vendor_category: "Decor",
    event_id: "evt-pheras",
    pricing_type: "fixed",
    unit_price: 3500000,
    estimated_quantity: 1,
    normalized_total: 3500000,
    scope_of_work: "Full floral Dutch rose mandap, ambient chandeliers, vintage velvet drapes",
    inclusions: ["Complete 3D spatial renders", "Fresh Dutch rose imports", "Crystal chandeliers", "Setup and post-event teardown"],
    exclusions: ["Heavy generator fuel costs"],
    extra_hour_rate: 0,
    status: "selected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-decor-competitor",
    wedding_id: WEDDING_ID,
    vendor_id: "v-darbar-floral",
    vendor_name: "Royal Darbar Floral Architecture",
    vendor_category: "Decor",
    event_id: "evt-pheras",
    pricing_type: "fixed",
    unit_price: 4200000,
    estimated_quantity: 1,
    normalized_total: 4200000,
    scope_of_work: "Glasshouse floral pavilion with imported orchids and fountain displays",
    inclusions: ["Exotic Thai orchids", "Glasshouse truss architecture", "Water fountain integration"],
    exclusions: ["Permits for heritage structure mounting"],
    extra_hour_rate: 0,
    status: "rejected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-photo-winner",
    wedding_id: WEDDING_ID,
    vendor_id: "v-regal-photo",
    vendor_name: "The Heritage Reel Studios",
    vendor_category: "Photography",
    event_id: "evt-pheras",
    pricing_type: "fixed",
    unit_price: 850000,
    estimated_quantity: 1,
    normalized_total: 850000,
    scope_of_work: "4K cinematic film teaser, 3 candid photographers, drone permits, same-day trailer",
    inclusions: ["3 Senior Candid Photographers", "2 Cinematographers with Gimbal", "4K Licensed Drone Pilot", "Pre-wedding shoot complimentary"],
    exclusions: ["Raw footage hard drive shipping outside India"],
    extra_hour_rate: 15000,
    status: "selected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-photo-competitor",
    wedding_id: WEDDING_ID,
    vendor_id: "v-cine-lens",
    vendor_name: "Imperial Cine and Moments",
    vendor_category: "Photography",
    event_id: "evt-pheras",
    pricing_type: "fixed",
    unit_price: 1100000,
    estimated_quantity: 1,
    normalized_total: 1100000,
    scope_of_work: "Vogue editorial wedding spread with Italian leather bound hardcovers",
    inclusions: ["Fashion photographer director", "4 Photographers", "Teaser film in 48 hours"],
    exclusions: ["Drone permits in restricted palace zones"],
    extra_hour_rate: 20000,
    status: "rejected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-entertainment-winner",
    wedding_id: WEDDING_ID,
    vendor_id: "v-royal-dhol-dj",
    vendor_name: "DJ Kabir and Desert Beats Production",
    vendor_category: "Entertainment/DJ",
    event_id: "evt-sangeet",
    pricing_type: "fixed",
    unit_price: 650000,
    estimated_quantity: 1,
    normalized_total: 650000,
    scope_of_work: "Celebrity club DJ set, 8 Punjabi dhol players, 12-member Rajasthani folk dance troupe",
    inclusions: ["DJ Kabir live 4-hour performance", "8 Master Dhol players for Baraat", "Folk dancers for guest welcome", "Backline sound engineer"],
    exclusions: ["Artist rider hotel stay and business flights"],
    extra_hour_rate: 35000,
    status: "selected",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "q-entertainment-competitor",
    wedding_id: WEDDING_ID,
    vendor_id: "v-desert-rhythms",
    vendor_name: "Desert Rhythms Symphony and Orchestra",
    vendor_category: "Entertainment/DJ",
    event_id: "evt-sangeet",
    pricing_type: "fixed",
    unit_price: 550000,
    estimated_quantity: 1,
    normalized_total: 550000,
    scope_of_work: "Traditional acoustic instrumentalists, sitar player and Manganiyar qawwali ensemble",
    inclusions: ["Acoustic ensemble", "Traditional folk welcoming", "Standard PA sound setup"],
    exclusions: ["DJ equipment", "Late night sound extensions"],
    extra_hour_rate: 15000,
    status: "rejected",
    created_at: NOW,
    updated_at: NOW,
  },
];

const initialTasks: Task[] = [
  { id: "task-01", wedding_id: WEDDING_ID, title: "Execute Palace / Heritage Venue Rental Agreement", category: "Venue", owner: "Pooja Verma", due_date: "2026-09-10", priority: "urgent", status: "done", notes: "Agreement countersigned and deposit released.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-02", wedding_id: WEDDING_ID, title: "Obtain Local Sound & Late-Night Music Licenses (PPL/IPRS)", category: "Legal/Contract", owner: "Rohan Joshi", due_date: "2026-10-10", priority: "high", status: "done", notes: "Police commissioner & municipal permits secured.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-03", wedding_id: WEDDING_ID, title: "Finalize Room Block Allocation for 400+ Guests", category: "Hospitality", owner: "Pooja Verma", due_date: "2026-10-25", priority: "high", status: "done", notes: "Rooming list mapped across Rambagh & Jai Mahal.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-04", wedding_id: WEDDING_ID, title: "Book Sangeet Celebrity DJ & Live Dhol Troupe", category: "Entertainment/DJ", owner: "Rohan Joshi", due_date: "2026-10-10", priority: "high", status: "done", notes: "DJ Kabir contract executed.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-05", wedding_id: WEDDING_ID, title: "Coordinate Helicopter / Vintage Car Charter for Baraat", category: "Logistics", owner: "Pooja Verma", due_date: "2026-11-10", priority: "medium", status: "in_progress", notes: "1938 Buick Convertible reserved.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-06", wedding_id: WEDDING_ID, title: "Approve Royal Heritage Floral Design & Lighting Renders", category: "Decor", owner: "Rohan Joshi", due_date: "2026-10-25", priority: "high", status: "in_progress", notes: "Mandap spatial 3D model under review.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-07", wedding_id: WEDDING_ID, title: "Lock 400-Guest Per-Plate Banquet Contract & Live Counters", category: "Catering", owner: "Pooja Verma", due_date: "2026-11-20", priority: "urgent", status: "done", notes: "Rajputana Royal Feast quote selected.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-08", wedding_id: WEDDING_ID, title: "Reserve Backup Power Generators (500kVA for Mandap)", category: "Logistics", owner: "Rohan Joshi", due_date: "2026-11-20", priority: "urgent", status: "in_progress", notes: "Silent acoustic generator truck scheduled.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-09", wedding_id: WEDDING_ID, title: "Design & Print Gold-Embossed Welcome Itineraries & Menus", category: "Invitations", owner: "Pooja Verma", due_date: "2026-11-15", priority: "medium", status: "to_plan", notes: "Gold leaf sample proofs awaiting couple sign-off.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-10", wedding_id: WEDDING_ID, title: "Install Line-Array Acoustics & Truss Lighting in Ballroom", category: "Audio/Visual", owner: "Rohan Joshi", due_date: "2026-12-08", priority: "high", status: "to_plan", notes: "Rigger team call time confirmed.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-11", wedding_id: WEDDING_ID, title: "Review Drone Videography & Multi-Cam Photography Shot List", category: "Photography", owner: "Pooja Verma", due_date: "2026-11-25", priority: "medium", status: "to_plan", notes: "Director shot list meeting set with couple.", is_overdue: false, created_at: NOW, updated_at: NOW },
  { id: "task-12", wedding_id: WEDDING_ID, title: "Verify Groom Baraat Route, Horse & Brass Band Timing", category: "Day-of", owner: "Rohan Joshi", due_date: "2026-12-12", priority: "urgent", status: "to_plan", notes: "Traffic marshals and police escort booked.", is_overdue: false, created_at: NOW, updated_at: NOW },
];

const initialClientPayments: ClientPayment[] = [
  { id: "pay-client-demo-1", wedding_id: WEDDING_ID, stage: "booking_deposit", amount: 10000000, payment_method: "Bank Transfer", transaction_reference: "TXN-DEMO-BOOKING-01", payment_date: "2026-11-01", status: "received", notes: "Booking confirmation deposit (28.5%).", created_at: NOW },
  { id: "pay-client-demo-2", wedding_id: WEDDING_ID, stage: "advance_payment", amount: 15000000, payment_method: "Bank Transfer", transaction_reference: "TXN-DEMO-ADVANCE-02", payment_date: "2026-11-20", status: "received", notes: "Pre-wedding advance payment (42.8%).", created_at: NOW },
];

const initialVendorPayments: VendorPayment[] = [
  { id: "vpay-demo-1", bill_id: "bill-demo-caterer-01", vendor_id: "v-royal-palace-caterers", amount: 1000000, payment_type: "advance", payment_method: "Bank Transfer", transaction_reference: "TXN-VEND-CAT-ADV", payment_date: "2026-12-01", created_at: NOW },
  { id: "vpay-demo-2", bill_id: "bill-demo-caterer-01", vendor_id: "v-royal-palace-caterers", amount: 1475000, payment_type: "final", payment_method: "Bank Transfer", transaction_reference: "TXN-VEND-CAT-FINAL", payment_date: "2026-12-15", created_at: NOW },
];

const initialVendorBills: VendorBill[] = [
  {
    id: "bill-demo-caterer-01",
    wedding_id: WEDDING_ID,
    vendor_id: "v-royal-palace-caterers",
    vendor_name: "Rajputana Royal Feast & Catering",
    vendor_category: "Catering",
    event_id: "evt-reception",
    quote_id: "q-caterer-winner",
    bill_number: "INV-CAT-2026-DEMO",
    agreed_amount: 2250000,
    billed_amount: 2475000,
    variance: 225000,
    variance_reason: "Client confirmed 50 extra banquet guests on event eve.",
    total_paid: 2475000,
    outstanding_balance: 0,
    status: "paid",
    payments: initialVendorPayments,
    bill_date: "2026-12-14",
    due_date: "2026-12-25",
    created_at: NOW,
  },
];

const initialSchedule: ScheduleItem[] = [
  { id: "sch-demo-1", wedding_id: WEDDING_ID, event_id: "evt-pheras", time_slot: "16:00", title: "Baraat Procession Begins", description: "Groom departs Hawa Mahal gate on vintage carriage with brass band.", responsible_person: "Pooja Verma", location: "North Palace Courtyard", status: "completed", created_at: NOW, updated_at: NOW },
  { id: "sch-demo-2", wedding_id: WEDDING_ID, event_id: "evt-pheras", time_slot: "17:00", title: "Varmala Ceremony", description: "Floral garland exchange with cold-fire pyro shower.", responsible_person: "Rohan Joshi", location: "Sarvato Bhadra Mandap", status: "in_progress", created_at: NOW, updated_at: NOW },
  { id: "sch-demo-3", wedding_id: WEDDING_ID, event_id: "evt-pheras", time_slot: "17:45", title: "Vedic Pheras & Kanyadaan", description: "Seven sacred vows around the Vedic holy fire.", responsible_person: "Pooja Verma", location: "Sarvato Bhadra Mandap", status: "pending", created_at: NOW, updated_at: NOW },
  { id: "sch-demo-4", wedding_id: WEDDING_ID, event_id: "evt-pheras", time_slot: "20:00", title: "Royal Banquet Dinner Opens", description: "Silver service seating for couple and royal families.", responsible_person: "Arjun Rathore", location: "Chandra Mahal Dining Terrace", status: "pending", created_at: NOW, updated_at: NOW },
];

const initialArrivals: VendorArrivalLog[] = [
  { id: "arr-demo-1", wedding_id: WEDDING_ID, event_id: "evt-reception", vendor_id: "v-royal-palace-caterers", vendor_name: "Rajputana Royal Feast & Catering", service_category: "Catering", planned_arrival_time: "12:00", actual_arrival_time: "12:10", status: "arrived", contact_phone: "+91 98290 11223", delay_minutes: 10, notes: "Truck arrived at service gate, prep kitchen fully active." },
  { id: "arr-demo-2", wedding_id: WEDDING_ID, event_id: "evt-reception", vendor_id: "v-palace-decor", vendor_name: "Virasat Decor & Spatial Design", service_category: "Decor", planned_arrival_time: "09:00", actual_arrival_time: "09:00", status: "arrived", contact_phone: "+91 98290 77889", delay_minutes: 0, notes: "Truss structure mounted and flowers conditioned." },
  { id: "arr-demo-3", wedding_id: WEDDING_ID, event_id: "evt-reception", vendor_id: "v-royal-dhol-dj", vendor_name: "DJ Kabir & Desert Beats Production", service_category: "Entertainment/DJ", planned_arrival_time: "16:00", actual_arrival_time: "16:45", status: "delayed", contact_phone: "+91 99280 44332", delay_minutes: 45, notes: "Highway transport delay; stage sound check expedited." },
];

const initialIssues: OperationalIssue[] = [
  { id: "iss-demo-1", wedding_id: WEDDING_ID, event_id: "evt-reception", title: "Ballroom chandelier electrical surge — backup generator engaged", severity: "medium", owner: "Vikram Rathore", status: "resolved", action_taken: "Generator truck connected and load-tested. Normal voltage restored in 6 minutes.", created_at: NOW, resolved_at: NOW },
  { id: "iss-demo-2", wedding_id: WEDDING_ID, event_id: "evt-pheras", title: "Rose petal shower shortage for Mandap entry", severity: "low", owner: "Pooja Verma", status: "open", action_taken: "Express runner dispatched to City Flower Market.", created_at: NOW },
];

const initialGuests: Guest[] = [
  { id: "g-001", wedding_id: WEDDING_ID, name: "Ramesh Sharma", email: "ramesh.s@heritageknot.com", phone: "+91 98100 11111", side: "bride", rsvp_status: "confirmed", meal_preference: "Jain Vegetarian", table_number: "Royal A1", is_vip: true, plus_ones: 1, notes: "First row seating near mandap" },
  { id: "g-002", wedding_id: WEDDING_ID, name: "Sunita Sharma", email: "sunita.s@gmail.com", phone: "+91 98100 22222", side: "bride", rsvp_status: "confirmed", meal_preference: "Vegetarian", table_number: "Royal A1", is_vip: true, plus_ones: 0 },
  { id: "g-003", wedding_id: WEDDING_ID, name: "General Rajendra Singh Rathore", email: "raj.rathore@gov.in", phone: "+91 99280 33333", side: "groom", rsvp_status: "confirmed", meal_preference: "Non-Vegetarian", table_number: "Regal B1", is_vip: true, plus_ones: 1, notes: "VIP security liaison escort needed" },
  { id: "g-004", wedding_id: WEDDING_ID, name: "Kavita Rathore", phone: "+91 99280 44444", side: "groom", rsvp_status: "confirmed", meal_preference: "Vegetarian", table_number: "Regal B1", is_vip: true, plus_ones: 0 },
  { id: "g-005", wedding_id: WEDDING_ID, name: "Priya Kapoor", email: "priya.k@gmail.com", phone: "+91 97110 55555", side: "bride", rsvp_status: "confirmed", meal_preference: "Vegetarian", table_number: "Lounge 3", is_vip: false, plus_ones: 1 },
  { id: "g-006", wedding_id: WEDDING_ID, name: "Major Sahil Mehta", email: "sahil.m@army.in", side: "groom", rsvp_status: "pending", meal_preference: "Non-Vegetarian", is_vip: false, plus_ones: 0 },
  { id: "g-007", wedding_id: WEDDING_ID, name: "Dr. Divya Nair", email: "divya.n@apollo.org", side: "mutual", rsvp_status: "declined", meal_preference: "Vegetarian", is_vip: false, plus_ones: 0, notes: "Sending congratulations gift hamper" },
];

function delay(ms = 250): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

let _enquiries = [...initialEnquiries];
let _weddings = [...initialWeddings];
let _events = [...initialEvents];
let _vendors = [...initialVendors];
let _quotes = [...initialQuotes];
let _tasks = [...initialTasks];
let _clientPayments = [...initialClientPayments];
let _vendorBills = [...initialVendorBills];
let _vendorPayments = [...initialVendorPayments];
let _schedule = [...initialSchedule];
let _arrivals = [...initialArrivals];
let _issues = [...initialIssues];
let _guests = [...initialGuests];

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const mockAdapter: ServiceAdapter = {
  isDemo: true,

  auth: {
    async setupFounder() {
      throw new Error("Founder setup is available only when connected to the EverWed backend.");
    },
    async founderSetupAvailable() {
      return false;
    },
    async login(payload) {
      await delay();
      if (payload.username === "admin" && payload.password === "admin") {
        mockToken = "session-token-admin-" + Date.now();
        localStorage.setItem("auth_token", mockToken);
        localStorage.setItem("auth_user", JSON.stringify(mockUser));
        return { token: mockToken, user: mockUser };
      }
      if (payload.username === "couple" && payload.password === "couple123") {
        const coupleUser: User = { uid: 2, name: "Aisha Sharma", email: "aisha@heritageknot.com", role: "couple", wedding_id: WEDDING_ID };
        mockToken = "session-token-couple-" + Date.now();
        localStorage.setItem("auth_token", mockToken);
        localStorage.setItem("auth_user", JSON.stringify(coupleUser));
        return { token: mockToken, user: coupleUser };
      }
      if (payload.username !== "planner" || payload.password !== "planner123") {
        throw new Error("Invalid demo credentials. Use the documented demo account and password.");
      }
      const user: User = { uid: 99, name: "Demo Planner", email: "planner@demo.everwed.local", role: "planner" };
      mockToken = "session-token-planner-" + Date.now();
      localStorage.setItem("auth_token", mockToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      return { token: mockToken, user };
    },
    async logout() {
      await delay(150);
      mockToken = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },
    async me() {
      await delay(100);
      const saved = localStorage.getItem("auth_user");
      if (saved) {
        return JSON.parse(saved) as User;
      }
      return mockUser;
    },
    async listUsers() {
      await delay();
      return [..._mockUsers];
    },
    async createUser(payload: UserCreate) {
      await delay();
      if (_mockUsers.some((item) => item.email?.toLowerCase() === payload.email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }
      const user: User = {
        uid: Math.max(0, ..._mockUsers.map((item) => item.uid)) + 1,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        wedding_id: payload.wedding_id,
      };
      _mockUsers = [..._mockUsers, user];
      return user;
    },
    async setUserActive(uid: number, active: boolean) {
      await delay();
      if (uid === 1 && !active) throw new Error("You cannot deactivate your own Founder account.");
      const index = _mockUsers.findIndex((item) => item.uid === uid);
      if (index < 0) throw new Error("Account not found.");
      const updated = { ..._mockUsers[index], active };
      _mockUsers[index] = updated;
      return updated;
    },
    async registerCouple(_payload: CoupleSignupRequest) {
      throw new Error("Couple registration requires the persistent EverWed backend. Disable demo preview to register.");
    },
    async registerPlanner() { throw new Error("Planner applications require the persistent EverWed backend."); },
    async setPlannerApproval() { throw new Error("Planner approval requires the persistent EverWed backend."); },
  },

  enquiries: {
    async list(filters) {
      await delay();
      let results = [..._enquiries];
      if (filters?.status) results = results.filter((e) => e.status === filters.status);
      return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async get(id) {
      await delay();
      const e = _enquiries.find((enq) => enq.id === id);
      if (!e) throw new Error(`Enquiry '${id}' not found`);
      return e;
    },
    async create(payload) {
      await delay();
      const now = new Date().toISOString();
      const newEnq: Enquiry = {
        id: generateId("enq"),
        ...payload,
        enquiry_source: payload.enquiry_source ?? "Direct",
        package_type: payload.package_type ?? "Signature",
        destination: payload.destination ?? "Jaipur",
        estimated_guests: payload.estimated_guests ?? 400,
        theme: payload.theme ?? "Royal Heritage",
        status: "new",
        meetings: [],
        agreement_signed: false,
        created_at: now,
        updated_at: now,
      };
      _enquiries = [newEnq, ..._enquiries];
      return newEnq;
    },
    async update(id, payload) {
      await delay();
      const idx = _enquiries.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error(`Enquiry '${id}' not found`);
      const existing = _enquiries[idx];
      const meetings = payload.meeting ? [...existing.meetings, payload.meeting] : existing.meetings;
      const updated: Enquiry = {
        ...existing,
        ...payload,
        status: (payload.status as Enquiry["status"]) ?? existing.status,
        meetings,
        updated_at: new Date().toISOString(),
      };
      _enquiries[idx] = updated;
      return updated;
    },
    async convert(id, payload) {
      await delay();
      const enq = _enquiries.find((e) => e.id === id);
      if (!enq) throw new Error(`Enquiry '${id}' not found`);
      if (enq.converted_wedding_id) throw new Error(`Enquiry already converted to wedding '${enq.converted_wedding_id}'`);
      const now = new Date().toISOString();
      const wid = generateId("wed");
      const title = `The Royal Union: ${enq.bride_name} & ${enq.groom_name}`;
      const wedding: Wedding = {
        id: wid,
        enquiry_id: id,
        title,
        bride_name: enq.bride_name,
        groom_name: enq.groom_name,
        contact_phone: enq.contact_phone,
        contact_email: enq.contact_email,
        destination: enq.destination,
        primary_venue: payload.primary_venue || `Heritage Palace, ${enq.destination}`,
        package_type: payload.package_type || enq.package_type,
        guest_estimate: enq.estimated_guests,
        theme: enq.theme,
        budget_allocated: payload.confirmed_budget || enq.estimated_budget,
        start_date: payload.wedding_start_date || enq.target_date || "2027-01-15",
        end_date: payload.wedding_end_date || "2027-01-18",
        status: "planning",
        events_count: 0,
        vendors_count: 0,
        tasks_count: 28,
        tasks_completed: 0,
        total_agreed_vendor_cost: 0,
        total_paid_by_client: 0,
        total_paid_to_vendors: 0,
        created_at: now,
        updated_at: now,
      };
      _weddings = [wedding, ..._weddings];
      _enquiries = _enquiries.map((e) => (e.id === id ? { ...e, status: "confirmed" as const, converted_wedding_id: wid, updated_at: now } : e));
      return { message: "Enquiry successfully converted to Wedding with 25+ standard operational tasks generated", wedding };
    },
  },

  weddings: {
    async list(filters) {
      await delay();
      let results = [..._weddings];
      if (filters?.status) results = results.filter((w) => w.status === filters.status);
      return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async get(id) {
      await delay();
      const w = _weddings.find((wedding) => wedding.id === id);
      if (!w) throw new Error(`Wedding '${id}' not found`);
      return w;
    },
    async create(payload) {
      await delay();
      const now = new Date().toISOString();
      const w: Wedding = {
        id: generateId("wed"),
        ...payload,
        destination: payload.destination ?? "Jaipur",
        package_type: payload.package_type ?? "Signature",
        guest_estimate: payload.guest_estimate ?? 400,
        theme: payload.theme ?? "Royal Heritage",
        status: "planning",
        events_count: 0,
        vendors_count: 0,
        tasks_count: 28,
        tasks_completed: 0,
        total_agreed_vendor_cost: 0,
        total_paid_by_client: 0,
        total_paid_to_vendors: 0,
        created_at: now,
        updated_at: now,
      };
      _weddings = [w, ..._weddings];
      return w;
    },
    async update(id, payload) {
      await delay();
      const idx = _weddings.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error(`Wedding '${id}' not found`);
      const updated: Wedding = {
        ..._weddings[idx],
        ...payload,
        status: (payload.status as Wedding["status"]) ?? _weddings[idx].status,
        updated_at: new Date().toISOString(),
      };
      _weddings[idx] = updated;
      return updated;
    },
    async assignPlanner(id, plannerEmail) {
      await delay();
      const planner = _mockUsers.find((item) => item.email?.toLowerCase() === plannerEmail.toLowerCase() && item.role === "planner");
      if (!planner) throw new Error("Choose an existing planner account.");
      const idx = _weddings.findIndex((item) => item.id === id);
      if (idx < 0) throw new Error(`Wedding '${id}' not found`);
      const updated = { ..._weddings[idx], assigned_planner_email: planner.email };
      _weddings[idx] = updated;
      return updated;
    },
    async onboardCouple() {
      throw new Error("Wedding onboarding requires the persistent EverWed backend.");
    },
  },

  events: {
    async listForWedding(weddingId) {
      await delay();
      return _events
        .filter((e) => e.wedding_id === weddingId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
    },
    async get(eventId) {
      await delay();
      const e = _events.find((evt) => evt.id === eventId);
      if (!e) throw new Error(`Event '${eventId}' not found`);
      return e;
    },
    async create(weddingId, payload) {
      await delay();
      const now = new Date().toISOString();
      const evt: WeddingEvent = {
        id: generateId("evt"),
        wedding_id: weddingId,
        ...payload,
        guest_estimate: payload.guest_estimate ?? 400,
        status: "scheduled",
        created_at: now,
        updated_at: now,
      };
      _events = [..._events, evt];
      // update event count
      const w = _weddings.find((wedding) => wedding.id === weddingId);
      if (w) w.events_count = _events.filter((e) => e.wedding_id === weddingId).length;
      return evt;
    },
    async update(eventId, payload) {
      await delay();
      const idx = _events.findIndex((e) => e.id === eventId);
      if (idx === -1) throw new Error(`Event '${eventId}' not found`);
      const updated: WeddingEvent = {
        ..._events[idx],
        ...payload,
        status: (payload.status as WeddingEvent["status"]) ?? _events[idx].status,
        updated_at: new Date().toISOString(),
      };
      _events[idx] = updated;
      return updated;
    },
    async delete(eventId) {
      await delay();
      const existing = _events.find((event) => event.id === eventId);
      if (!existing) throw new Error(`Event '${eventId}' not found`);
      _events = _events.filter((event) => event.id !== eventId);
      const wedding = _weddings.find((item) => item.id === existing.wedding_id);
      if (wedding) wedding.events_count = _events.filter((event) => event.wedding_id === wedding.id).length;
    },
  },

  vendors: {
    async list(filters) {
      await delay();
      let results = [..._vendors];
      if (filters?.category) {
        results = results.filter((v) => v.category.toLowerCase() === filters.category!.toLowerCase());
      }
      if (filters?.city) {
        results = results.filter((v) => v.city.toLowerCase() === filters.city!.toLowerCase());
      }
      return results.sort((a, b) => b.rating - a.rating);
    },
    async get(id) {
      await delay();
      const v = _vendors.find((vendor) => vendor.id === id);
      if (!v) throw new Error(`Vendor '${id}' not found`);
      return v;
    },
    async create(payload) {
      await delay();
      const now = new Date().toISOString();
      const v: Vendor = {
        id: generateId("v"),
        ...payload,
        city: payload.city ?? "Jaipur",
        rating: payload.rating ?? 4.8,
        services_offered: payload.services_offered ?? [],
        pricing_model_default: (payload.pricing_model_default as "fixed" | "per_plate") ?? "fixed",
        created_at: now,
        updated_at: now,
      };
      _vendors = [v, ..._vendors];
      return v;
    },
    async update(id, payload) {
      await delay();
      const idx = _vendors.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error(`Vendor '${id}' not found`);
      const updated = { ..._vendors[idx], ...payload, updated_at: new Date().toISOString() };
      _vendors[idx] = updated;
      return updated;
    },
  },

  quotes: {
    async list(weddingId, category) {
      await delay();
      let results = _quotes.filter((q) => q.wedding_id === weddingId);
      if (category) {
        results = results.filter((q) => q.vendor_category.toLowerCase() === category.toLowerCase());
      }
      return results;
    },
    async compare(weddingId, category) {
      await delay();
      const wedding = _weddings.find((w) => w.id === weddingId);
      const guestCount = wedding?.guest_estimate ?? 450;
      const matching = _quotes.filter(
        (q) => q.wedding_id === weddingId && q.vendor_category.toLowerCase() === category.toLowerCase()
      );
      if (!matching.length) throw new Error(`No quotations recorded for ${category}`);
      const items = matching.map((q) => {
        const compTotal = q.pricing_type === "per_plate" ? q.unit_price * guestCount : q.unit_price;
        return {
          quote_id: q.id,
          vendor_id: q.vendor_id,
          vendor_name: q.vendor_name,
          category: q.vendor_category,
          pricing_type: q.pricing_type,
          unit_price: q.unit_price,
          estimated_quantity: q.pricing_type === "per_plate" ? guestCount : 1,
          normalized_total: compTotal,
          extra_hour_rate: q.extra_hour_rate,
          inclusions: q.inclusions,
          status: q.status,
          is_winner: q.status === "selected",
          scope_of_work: q.scope_of_work,
        };
      });
      const lowest = [...items].sort((a, b) => a.normalized_total - b.normalized_total)[0];
      const selected = items.find((i) => i.is_winner);
      return {
        wedding_id: weddingId,
        category,
        guest_count: guestCount,
        quotes: items,
        lowest_quote_id: lowest?.quote_id,
        selected_quote_id: selected?.quote_id,
      };
    },
    async create(payload) {
      await delay();
      const now = new Date().toISOString();
      const vendor = _vendors.find((v) => v.id === payload.vendor_id);
      const normalized =
        payload.pricing_type === "per_plate"
          ? payload.unit_price * (payload.estimated_quantity ?? 1)
          : payload.unit_price;
      const q: Quote = {
        id: generateId("q"),
        wedding_id: payload.wedding_id,
        vendor_id: payload.vendor_id,
        vendor_name: vendor?.name ?? "Specialist Vendor",
        vendor_category: payload.category,
        event_id: payload.event_id,
        pricing_type: (payload.pricing_type as "fixed" | "per_plate") ?? "fixed",
        unit_price: payload.unit_price,
        estimated_quantity: payload.estimated_quantity ?? 1,
        normalized_total: normalized,
        scope_of_work: payload.scope_of_work,
        inclusions: payload.inclusions ?? [],
        exclusions: payload.exclusions ?? [],
        extra_hour_rate: payload.extra_hour_rate ?? 0,
        status: "draft",
        created_at: now,
        updated_at: now,
      };
      _quotes = [..._quotes, q];
      return q;
    },
    async selectWinner(quoteId) {
      await delay();
      const target = _quotes.find((q) => q.id === quoteId);
      if (!target) throw new Error(`Quotation '${quoteId}' not found`);
      const wid = target.wedding_id;
      const cat = target.vendor_category;
      _quotes = _quotes.map((q) => {
        if (q.id === quoteId) return { ...q, status: "selected" as const, updated_at: new Date().toISOString() };
        if (q.wedding_id === wid && q.vendor_category.toLowerCase() === cat.toLowerCase() && q.id !== quoteId) {
          return { ...q, status: "rejected" as const, updated_at: new Date().toISOString() };
        }
        return q;
      });
      return {
        message: `Quote '${quoteId}' selected as winner. Competing quotes in ${cat} marked as rejected.`,
        selected_quote: { ...target, status: "selected" as const },
        agreed_price_inr: target.normalized_total,
        vendor_name: target.vendor_name,
      };
    },
  },

  tasks: {
    async list(weddingId, filters) {
      await delay();
      let results = _tasks.filter((t) => t.wedding_id === weddingId);
      if (filters?.status) results = results.filter((t) => t.status === filters.status);
      if (filters?.category) results = results.filter((t) => t.category.toLowerCase() === filters.category!.toLowerCase());
      if (filters?.priority) results = results.filter((t) => t.priority === filters.priority);
      if (filters?.owner) results = results.filter((t) => t.owner.toLowerCase().includes(filters.owner!.toLowerCase()));
      const today = new Date().toISOString().split("T")[0];
      return results
        .map((t) => ({ ...t, is_overdue: t.due_date < today && t.status !== "done" }))
        .sort((a, b) => {
          const pw = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (pw[a.priority] ?? 2) - (pw[b.priority] ?? 2) || a.due_date.localeCompare(b.due_date);
        });
    },
    async create(weddingId, payload) {
      await delay();
      const now = new Date().toISOString();
      const t: Task = {
        id: generateId("task"),
        wedding_id: weddingId,
        ...payload,
        category: payload.category ?? "Planning",
        priority: (payload.priority as Task["priority"]) ?? "medium",
        event_id: payload.event_id,
        status: "to_plan",
        is_overdue: false,
        created_at: now,
        updated_at: now,
      };
      _tasks = [t, ..._tasks];
      return t;
    },
    async update(taskId, payload) {
      await delay();
      const idx = _tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) throw new Error(`Task '${taskId}' not found`);
      const updated: Task = {
        ..._tasks[idx],
        ...payload,
        event_id: payload.event_id === null ? undefined : payload.event_id ?? _tasks[idx].event_id,
        priority: (payload.priority as Task["priority"]) ?? _tasks[idx].priority,
        status: (payload.status as Task["status"]) ?? _tasks[idx].status,
        updated_at: new Date().toISOString(),
      };
      _tasks[idx] = updated;
      return updated;
    },
    async delete(taskId) {
      await delay();
      _tasks = _tasks.filter((task) => task.id !== taskId);
    },
  },

  operations: {
    async getOverview(weddingId) {
      await delay();
      const w = _weddings.find((wedding) => wedding.id === weddingId);
      if (!w) throw new Error(`Wedding '${weddingId}' not found`);
      const events = _events.filter((e) => e.wedding_id === weddingId);
      const schedule = _schedule
        .filter((s) => s.wedding_id === weddingId)
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
      const arrivals = _arrivals.filter((a) => a.wedding_id === weddingId);
      const activeIssues = _issues.filter((i) => i.wedding_id === weddingId && i.status !== "resolved");
      const resolvedCount = _issues.filter((i) => i.wedding_id === weddingId && i.status === "resolved").length;
      return {
        wedding_id: weddingId,
        wedding_title: w.title,
        events_today: events,
        schedule,
        vendor_arrivals: arrivals,
        active_issues: activeIssues,
        resolved_issues_count: resolvedCount,
      };
    },
    async addScheduleItem(weddingId, eventId, payload) {
      await delay();
      const now = new Date().toISOString();
      const s: ScheduleItem = {
        id: generateId("sch"),
        wedding_id: weddingId,
        event_id: eventId,
        ...payload,
        status: "pending",
        created_at: now,
        updated_at: now,
      };
      _schedule = [..._schedule, s];
      return s;
    },
    async listSchedule(weddingId, eventId) {
      await delay();
      let results = _schedule.filter((s) => s.wedding_id === weddingId);
      if (eventId) results = results.filter((s) => s.event_id === eventId);
      return results.sort((a, b) => a.time_slot.localeCompare(b.time_slot));
    },
    async updateScheduleItem(itemId, payload) {
      await delay();
      const idx = _schedule.findIndex((s) => s.id === itemId);
      if (idx === -1) throw new Error(`Schedule item '${itemId}' not found`);
      const updated = { ..._schedule[idx], ...payload, updated_at: new Date().toISOString() };
      _schedule[idx] = updated;
      return updated;
    },
    async logVendorArrival(payload) {
      await delay();
      const vendor = _vendors.find((v) => v.id === payload.vendor_id);
      const delayMins = payload.delay_minutes ?? 0;
      const status: VendorArrivalLog["status"] = payload.actual_arrival_time
        ? delayMins > 15
          ? "delayed"
          : "arrived"
        : "expected";
      const log: VendorArrivalLog = {
        id: generateId("arr"),
        wedding_id: payload.wedding_id,
        event_id: payload.event_id,
        vendor_id: payload.vendor_id,
        vendor_name: vendor?.name ?? "Vendor Partner",
        service_category: vendor?.category ?? "General",
        planned_arrival_time: payload.planned_arrival_time,
        actual_arrival_time: payload.actual_arrival_time,
        status,
        contact_phone: vendor?.phone,
        delay_minutes: delayMins,
        notes: payload.notes,
      };
      _arrivals = [log, ..._arrivals.filter((a) => a.vendor_id !== payload.vendor_id || a.event_id !== payload.event_id)];
      return log;
    },
    async reportIssue(payload) {
      await delay();
      const now = new Date().toISOString();
      const issue: OperationalIssue = {
        id: generateId("iss"),
        ...payload,
        severity: payload.severity as OperationalIssue["severity"],
        status: "open",
        created_at: now,
      };
      _issues = [issue, ..._issues];
      return issue;
    },
    async resolveIssue(issueId, action_taken) {
      await delay();
      const idx = _issues.findIndex((i) => i.id === issueId);
      if (idx === -1) throw new Error(`Operational issue '${issueId}' not found`);
      const updated = { ..._issues[idx], status: "resolved" as const, action_taken, resolved_at: new Date().toISOString() };
      _issues[idx] = updated;
      return updated;
    },
  },

  finance: {
    async listClientPayments(weddingId) {
      await delay();
      return _clientPayments
        .filter((p) => p.wedding_id === weddingId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async recordClientPayment(payload) {
      await delay();
      const existing = _clientPayments.find((p) => p.transaction_reference === payload.transaction_reference);
      if (existing) {
        throw new Error(`Payment with transaction reference '${payload.transaction_reference}' already recorded`);
      }
      const now = new Date().toISOString();
      const p: ClientPayment = {
        id: generateId("pay-client"),
        ...payload,
        payment_method: payload.payment_method ?? "Bank Transfer",
        status: "received",
        created_at: now,
      };
      _clientPayments = [p, ..._clientPayments];
      return p;
    },
    async listVendorBills(weddingId) {
      await delay();
      return _vendorBills.filter((b) => b.wedding_id === weddingId);
    },
    async recordVendorBill(payload) {
      await delay();
      const vendor = _vendors.find((v) => v.id === payload.vendor_id);
      const variance = Math.round((payload.billed_amount - payload.agreed_amount) * 100) / 100;
      if (variance > 0 && !payload.variance_reason) {
        throw new Error(
          `Final bill amount (₹${payload.billed_amount.toLocaleString()}) exceeds agreed price (₹${payload.agreed_amount.toLocaleString()}) by ₹${variance.toLocaleString()}. An explicit variance_reason is mandatory.`
        );
      }
      const now = new Date().toISOString();
      const bill: VendorBill = {
        id: generateId("bill"),
        ...payload,
        vendor_name: vendor?.name ?? "Vendor",
        vendor_category: vendor?.category ?? "General",
        variance,
        total_paid: 0,
        outstanding_balance: payload.billed_amount,
        status: "pending",
        payments: [],
        created_at: now,
      };
      _vendorBills = [bill, ..._vendorBills];
      return bill;
    },
    async recordVendorPayment(payload) {
      await delay();
      const bill = _vendorBills.find((b) => b.id === payload.bill_id);
      if (!bill) throw new Error(`Vendor bill '${payload.bill_id}' not found`);
      const currentPaid = bill.total_paid;
      if (currentPaid + payload.amount > bill.billed_amount + 0.01) {
        throw new Error(`Payment would exceed remaining balance of ₹${(bill.billed_amount - currentPaid).toLocaleString()}`);
      }
      const now = new Date().toISOString();
      const payment: VendorPayment = {
        id: generateId("vpay"),
        bill_id: payload.bill_id,
        vendor_id: bill.vendor_id,
        amount: payload.amount,
        payment_type: (payload.payment_type as "advance" | "final") ?? "advance",
        payment_method: payload.payment_method ?? "Bank Transfer",
        transaction_reference: payload.transaction_reference,
        payment_date: payload.payment_date,
        created_at: now,
      };
      _vendorPayments = [payment, ..._vendorPayments];
      bill.total_paid += payload.amount;
      bill.outstanding_balance = Math.max(0, bill.billed_amount - bill.total_paid);
      bill.status = bill.total_paid >= bill.billed_amount ? "paid" : "partially_paid";
      bill.payments.push(payment);
      return payment;
    },
    async getFinancialSummary(weddingId) {
      await delay();
      const w = _weddings.find((wedding) => wedding.id === weddingId);
      if (!w) throw new Error(`Wedding '${weddingId}' not found`);
      const contractValue = w.budget_allocated;
      const clientPaid = _clientPayments
        .filter((p) => p.wedding_id === weddingId && ["received", "verified"].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);
      const clientOutstanding = Math.max(0, contractValue - clientPaid);
      const agreedVendorTotal = _quotes
        .filter((q) => q.wedding_id === weddingId && q.status === "selected")
        .reduce((sum, q) => sum + q.normalized_total, 0);
      const bills = _vendorBills.filter((b) => b.wedding_id === weddingId);
      const actualBillsTotal = bills.reduce((sum, b) => sum + b.billed_amount, 0);
      const vendorPaid = bills.reduce((sum, b) => sum + b.total_paid, 0);
      const vendorOutstanding = Math.max(0, actualBillsTotal - vendorPaid);
      const costVariance = actualBillsTotal - agreedVendorTotal;
      const expenses = actualBillsTotal > 0 ? actualBillsTotal : agreedVendorTotal;
      const netProfit = contractValue - expenses;
      const marginPct = contractValue > 0 ? (netProfit / contractValue) * 100 : 0;
      return {
        wedding_id: weddingId,
        wedding_title: w.title,
        total_contract_value: contractValue,
        client_paid_amount: clientPaid,
        client_outstanding_receivable: clientOutstanding,
        client_payment_status: clientPaid >= contractValue ? "paid" : clientPaid > 0 ? "partial" : "pending",
        agreed_vendor_total: agreedVendorTotal,
        actual_vendor_bills_total: actualBillsTotal,
        vendor_paid_amount: vendorPaid,
        vendor_outstanding_payable: vendorOutstanding,
        cost_variance: costVariance,
        net_agency_profit: netProfit,
        profit_margin_percentage: marginPct,
      };
    },
  },

  dashboard: {
    async getOverview() {
      await delay();
      const activeWeddings = _weddings.filter((w) => ["planning", "in_progress"].includes(w.status));
      const today = new Date().toISOString().split("T")[0];
      const upcomingEvents = _events
        .filter((e) => e.date >= today && e.status !== "completed")
        .sort((a, b) => a.date.localeCompare(b.date));
      const pendingTasks = _tasks.filter((t) => t.status !== "done");
      const overdueTasks = pendingTasks.filter((t) => t.due_date < today);
      const totalContract = _weddings.reduce((s, w) => s + w.budget_allocated, 0);
      const clientPaid = _clientPayments
        .filter((p) => ["received", "verified"].includes(p.status))
        .reduce((s, p) => s + p.amount, 0);
      const totalBills = _vendorBills.reduce((s, b) => s + b.billed_amount, 0);
      const vendorPaid = _vendorBills.reduce((s, b) => s + b.total_paid, 0);
      const summaries = await Promise.all(
        _weddings.map(async (w) => {
          try {
            const f = await mockAdapter.finance.getFinancialSummary(w.id);
            return {
              wedding_id: w.id,
              title: w.title,
              destination: w.destination,
              package_type: w.package_type,
              guest_estimate: w.guest_estimate,
              contract_value: f.total_contract_value,
              client_paid: f.client_paid_amount,
              vendor_costs: f.actual_vendor_bills_total || f.agreed_vendor_total,
              gross_profit: f.net_agency_profit,
              margin_percent: f.profit_margin_percentage,
            };
          } catch {
            return null;
          }
        })
      );
      return {
        active_weddings_count: activeWeddings.length,
        upcoming_events_count: upcomingEvents.length,
        pending_tasks_count: pendingTasks.length,
        overdue_tasks_count: overdueTasks.length,
        total_client_receivables_outstanding: Math.max(0, totalContract - clientPaid),
        total_client_payments_received: clientPaid,
        total_vendor_payables_outstanding: Math.max(0, totalBills - vendorPaid),
        total_vendor_bills_recorded: totalBills,
        season_contracted_revenue: totalContract,
        season_actual_expenses: totalBills,
        season_estimated_profit: totalContract - totalBills,
        active_weddings: summaries.filter(Boolean) as DashboardOverview["active_weddings"],
        upcoming_events: upcomingEvents.slice(0, 8),
        urgent_tasks: pendingTasks.filter((t) => ["urgent", "high"].includes(t.priority)).slice(0, 8),
        recent_issues: _issues.filter((i) => i.status !== "resolved").slice(0, 8),
      };
    },
  },

  guests: {
    async list(weddingId) {
      await delay();
      return _guests.filter((g) => g.wedding_id === weddingId);
    },
    async create(guest) {
      await delay();
      const g: Guest = { id: generateId("g"), ...guest };
      _guests = [g, ..._guests];
      return g;
    },
    async update(id, payload) {
      await delay();
      const idx = _guests.findIndex((g) => g.id === id);
      if (idx === -1) throw new Error(`Guest '${id}' not found`);
      const updated = { ..._guests[idx], ...payload };
      _guests[idx] = updated;
      return updated;
    },
    async delete(id) {
      await delay();
      _guests = _guests.filter((g) => g.id !== id);
    },
    async importCsv() {
      throw new Error("CSV guest import requires the persistent EverWed backend.");
    },
  },
};
