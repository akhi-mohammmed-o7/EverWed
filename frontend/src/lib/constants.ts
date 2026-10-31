export const APP_NAME = "EverWed";
export const APP_TAGLINE = "Luxury Wedding Planning & Operational Management";

export const VENDOR_CATEGORIES = [
  "Catering",
  "Decor",
  "Photography",
  "Entertainment/DJ",
  "Makeup",
  "Hospitality",
  "Logistics",
  "Audio/Visual",
  "Transportation",
  "Lighting",
  "Invitations",
] as const;

export const WEDDING_TRADITIONS = [
  {
    id: "hindu",
    label: "Hindu Traditions",
    description: "Vedic rites, sacred pheras, vibrant sangeet and multi-day regal festivities",
    badge: "5+ Celebrations",
    icon: "🪔",
  },
  {
    id: "muslim",
    label: "Muslim Traditions",
    description: "Nikah contract ceremony, celebratory Walima feast and traditional mehendi",
    badge: "3+ Celebrations",
    icon: "🌙",
  },
  {
    id: "sikh",
    label: "Sikh Traditions",
    description: "Anand Karaj morning ceremony at Gurdwara, vibrant Jaggo and grand reception",
    badge: "3+ Celebrations",
    icon: "🪯",
  },
  {
    id: "christian",
    label: "Christian Traditions",
    description: "Rehearsal dinner, traditional church nuptials and grand evening ballroom reception",
    badge: "3+ Celebrations",
    icon: "💒",
  },
  {
    id: "custom",
    label: "Mixed / Bespoke",
    description: "Blend royal traditions or curate a personalized contemporary celebration",
    badge: "Custom Curated",
    icon: "✨",
  },
];

export const CEREMONY_TEMPLATES: Record<
  string,
  Array<{ name: string; description: string; typical_duration: string; typical_hall: string }>
> = {
  hindu: [
    { name: "Royal Mehendi", description: "Bespoke bridal and guest henna rituals with live folk singers", typical_duration: "14:00 - 18:00", typical_hall: "Zenana Courtyard Gardens" },
    { name: "Haldi Sunshine Carnival", description: "Vibrant yellow floral marigold blessings and flower showers", typical_duration: "10:00 - 13:00", typical_hall: "Poolside Pavilion" },
    { name: "Desert Beats Sangeet", description: "Celebrity DJ, choreographed family performances and late night dhol", typical_duration: "19:00 - 01:00", typical_hall: "Manek Chowk Amphitheatre" },
    { name: "Vedic Pheras & Baraat", description: "Grand vintage car baraat, varmala and sacred Vedic rituals", typical_duration: "16:00 - 21:00", typical_hall: "Sarvato Bhadra Mandap" },
    { name: "Grand Imperial Reception", description: "Multi-course banquet feast, live orchestra and red carpet photo-ops", typical_duration: "19:30 - 23:30", typical_hall: "Chandra Mahal Royal Ballroom" },
  ],
  muslim: [
    { name: "Mehendi & Dholki", description: "Intimate family henna gathering with traditional singing", typical_duration: "17:00 - 21:00", typical_hall: "Terrace Courtyard" },
    { name: "Sacred Nikah Ceremony", description: "Solemn Islamic marriage contract ceremony and celebratory du'a", typical_duration: "11:00 - 14:00", typical_hall: "Darbar Hall" },
    { name: "Imperial Walima Banquet", description: "Lavish reception hosted by the groom's family with royal feast", typical_duration: "19:30 - 23:30", typical_hall: "Grand Banquet Palace" },
  ],
  sikh: [
    { name: "Jaggo Night", description: "Festive nighttime celebration with decorated brass pots and bhangra", typical_duration: "20:00 - 01:00", typical_hall: "Heritage Lawn" },
    { name: "Anand Karaj Nuptials", description: "Lavan hymns and blissful ceremony in the presence of Guru Granth Sahib", typical_duration: "09:30 - 13:00", typical_hall: "Gurdwara Sahib Hall" },
    { name: "Royal Reception", description: "Evening celebration dinner with couple entrance and live band", typical_duration: "19:30 - 23:30", typical_hall: "Palace Ballrooms" },
  ],
  christian: [
    { name: "Rehearsal Dinner", description: "Intimate gathering for wedding party, speeches and toasts", typical_duration: "19:00 - 22:00", typical_hall: "Private Dining Salon" },
    { name: "Holy Matrimony Service", description: "Vows, ring exchange and organ hymn blessings", typical_duration: "11:00 - 12:30", typical_hall: "Historic Chapel / Cathedral" },
    { name: "Cocktail & Dinner Reception", description: "First dance, cake cutting, toasts and late night dancing", typical_duration: "18:30 - 23:30", typical_hall: "Imperial Glasshouse Ballroom" },
  ],
  custom: [
    { name: "Welcome Cocktails & Soirée", description: "Warm greeting event for destination traveling guests", typical_duration: "18:00 - 22:00", typical_hall: "Sunset Lounge Terrace" },
    { name: "Main Wedding Celebration", description: "Signature ceremonial exchange designed to your story", typical_duration: "16:00 - 20:00", typical_hall: "Central Royal Lawn" },
    { name: "Gala Dinner & Afterparty", description: "Celebration feast followed by late night party", typical_duration: "20:00 - 02:00", typical_hall: "Grand Imperial Ballroom" },
  ],
};

export const PACKAGE_TIERS = [
  {
    id: "essential",
    name: "Essential",
    tier: "Intimate Celebrations",
    badge: "Day-of & Coordination",
    base_price: 500000,
    events_covered: 2,
    vendor_slots: 4,
    description: "Ideal for intimate heritage weddings requiring meticulous coordination and key vendor curation.",
    features: [
      "Coverage for 2 signature events",
      "Coordination of up to 4 core vendors",
      "Day-of bridal suite coordinator",
      "Full digital timeline & task tracker",
      "Standard decor curation & table styling",
      "Guest arrival & VIP room block logs",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    tier: "Full-Service Experience",
    badge: "Most Popular",
    highlighted: true,
    base_price: 1500000,
    events_covered: 4,
    vendor_slots: 8,
    description: "Complete hands-on wedding planning from initial moodboards to post-wedding financial settlements.",
    features: [
      "Coverage for up to 4 full wedding events",
      "End-to-end management of 8+ luxury vendors",
      "Side-by-side vendor quotation comparison engine",
      "Detailed 3D floral & mandap spatial renders",
      "Dedicated senior lead planner & 2 coordinators",
      "Complete RSVP, guest transportation & logistics",
      "Pre-tasting banquets & menu engineering",
    ],
  },
  {
    id: "royal",
    name: "Royal Bespoke",
    tier: "Ultra-Luxury Palace Edition",
    badge: "White-Glove Concierge",
    base_price: 3500000,
    events_covered: 6,
    vendor_slots: 15,
    description: "The pinnacle of royal hospitality in Rajasthan’s finest palaces with 24/7 dedicated entourage.",
    features: [
      "Unlimited multi-day event coverage",
      "Unlimited vendor slots with transparent PO sync",
      "Celebrity artist, DJ & live orchestra booking",
      "Vintage Rolls Royce & Baraat elephant/horse logistics",
      "Custom gold-embossed stationery & welcome hampers",
      "Team of 6 on-site day-of event managers",
      "Live command center with generator & A/V backups",
      "Executive financial auditing & variance controls",
    ],
  },
];

export interface ServiceCategoryDef {
  id: string;
  name: string;
  icon: string;
  pricing_basis: "Fixed" | "Per Plate" | "Per Session" | "Per Day" | "Per Unit" | "Per Person";
  description: string;
  default_price: number;
}

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  {
    id: "venue",
    name: "Palace Venues & Luxury Stays",
    icon: "🏰",
    pricing_basis: "Fixed",
    description: "Exclusive rental of heritage courtyards, ballrooms, and 400+ guest royal room blocks.",
    default_price: 2500000,
  },
  {
    id: "catering",
    name: "Royal Banquet & Live Counters",
    icon: "🍽️",
    pricing_basis: "Per Plate",
    description: "7-course Marwari, Mughlai, Continental live kitchens, chaat streets and dessert studios.",
    default_price: 4500,
  },
  {
    id: "decor",
    name: "Spatial Architecture & Florals",
    icon: "💐",
    pricing_basis: "Fixed",
    description: "Dutch rose mandaps, ambient vintage chandeliers, crystal drapes and acoustic trusses.",
    default_price: 3500000,
  },
  {
    id: "photography",
    name: "Cinematic Reel & Drone Studio",
    icon: "📸",
    pricing_basis: "Fixed",
    description: "4K cinematic teaser films, candid photographers, drone permits and instant photo lounges.",
    default_price: 850000,
  },
  {
    id: "makeup",
    name: "Celebrity Bridal Styling",
    icon: "💄",
    pricing_basis: "Per Session",
    description: "HD airbrush makeup, saree/lehenga drapes, hair styling for bride and family entourage.",
    default_price: 180000,
  },
  {
    id: "entertainment",
    name: "Celebrity DJ, Dhol & Folk Troupe",
    icon: "🎵",
    pricing_basis: "Fixed",
    description: "Desert folk dance troupes, master Punjabi dhol players and top club celebrity DJs.",
    default_price: 650000,
  },
  {
    id: "invitations",
    name: "Gold-Leaf Stationery & Gifts",
    icon: "📜",
    pricing_basis: "Per Unit",
    description: "Boxed lacquer invitations, digital interactive RSVP invites and bespoke wedding favors.",
    default_price: 350000,
  },
  {
    id: "transport",
    name: "Vintage Baraat & Luxury Shuttles",
    icon: "🚗",
    pricing_basis: "Per Day",
    description: "Heritage convertibles, Mercedes sprinters for airport transfers and helicopter charters.",
    default_price: 400000,
  },
  {
    id: "guests",
    name: "Guest Concierge & Luggage Tagging",
    icon: "👥",
    pricing_basis: "Fixed",
    description: "Dedicated airport welcome desks, room check-in helpdesks and WhatsApp concierge bots.",
    default_price: 250000,
  },
  {
    id: "lighting",
    name: "Concert A/V & Cold-Fire Pyro",
    icon: "💡",
    pricing_basis: "Fixed",
    description: "Line-array concert sound, low-fog cold-fire pyro for varmala and heavy power backups.",
    default_price: 500000,
  },
];

export interface DestinationItem {
  id: string;
  city: string;
  state?: string;
  country: string;
  region: "Domestic" | "International";
  popularVenues: string[];
}

export const DESTINATION_CATALOG: DestinationItem[] = [
  {
    id: "jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    region: "Domestic",
    popularVenues: ["City Palace", "Rambagh Palace", "Samode Palace", "Fairmont Jaipur", "Jai Mahal Palace"],
  },
  {
    id: "udaipur",
    city: "Udaipur",
    state: "Rajasthan",
    country: "India",
    region: "Domestic",
    popularVenues: ["Taj Lake Palace", "The Oberoi Udaivilas", "Jagmandir Island Palace", "The Leela Palace Udaipur", "Chunda Palace"],
  },
  {
    id: "jodhpur",
    city: "Jodhpur",
    state: "Rajasthan",
    country: "India",
    region: "Domestic",
    popularVenues: ["Umaid Bhawan Palace", "Mehrangarh Fort", "Ajit Bhawan", "Indana Palace"],
  },
  {
    id: "jaisalmer",
    city: "Jaisalmer",
    state: "Rajasthan",
    country: "India",
    region: "Domestic",
    popularVenues: ["Suryagarh Jaisalmer", "Jaisalmer Marriott Resort", "Fort Rajwada"],
  },
  {
    id: "goa",
    city: "Goa",
    state: "Goa",
    country: "India",
    region: "Domestic",
    popularVenues: ["Taj Exotica Resort & Spa", "Alila Diwa Goa", "W Goa", "The Leela Goa", "Grand Hyatt Goa"],
  },
  {
    id: "delhi-ncr",
    city: "Delhi NCR",
    state: "Delhi / Haryana",
    country: "India",
    region: "Domestic",
    popularVenues: ["The Leela Palace New Delhi", "ITC Grand Bharat Gurugram", "The Taj Mahal Hotel", "Tivoli Grand"],
  },
  {
    id: "mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    region: "Domestic",
    popularVenues: ["Taj Mahal Palace & Tower", "The St. Regis Mumbai", "JW Marriott Juhu", "Sofitel Mumbai BKC"],
  },
  {
    id: "mussoorie",
    city: "Mussoorie",
    state: "Uttarakhand",
    country: "India",
    region: "Domestic",
    popularVenues: ["JW Marriott Walnut Grove Resort", "Jaypee Residency Manor", "The Claridges Nabha Estate"],
  },
  {
    id: "rishikesh",
    city: "Rishikesh",
    state: "Uttarakhand",
    country: "India",
    region: "Domestic",
    popularVenues: ["Taj Rishikesh Resort & Spa", "Ananda in the Himalayas", "The Roseate Ganges"],
  },
  {
    id: "agra",
    city: "Agra",
    state: "Uttar Pradesh",
    country: "India",
    region: "Domestic",
    popularVenues: ["The Oberoi Amarvilas", "ITC Mughal", "Taj Hotel & Convention Centre"],
  },
  {
    id: "hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    region: "Domestic",
    popularVenues: ["Taj Falaknuma Palace", "ITC Kohenur", "Park Hyatt Hyderabad", "Fort Grand Shamshabad"],
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    region: "Domestic",
    popularVenues: ["The Leela Palace Bengaluru", "Taj West End", "Bangalore Palace", "ITC Gardenia"],
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "International",
    popularVenues: ["Burj Al Arab Jumeirah", "Atlantis The Royal", "One&Only Royal Mirage", "Armani Hotel Dubai"],
  },
  {
    id: "lake-como",
    city: "Lake Como",
    country: "Italy",
    region: "International",
    popularVenues: ["Villa d'Este", "Villa del Balbianello", "Grand Hotel Tremezzo", "Villa Erba"],
  },
  {
    id: "bali",
    city: "Bali",
    country: "Indonesia",
    region: "International",
    popularVenues: ["Bulgari Resort Bali", "AYANA Resort Bali", "The Edge Bali", "Alila Villas Uluwatu"],
  },
  {
    id: "phuket",
    city: "Phuket",
    country: "Thailand",
    region: "International",
    popularVenues: ["Amanpuri", "Trisara Phuket", "Sri Panwa Phuket", "InterContinental Phuket Resort"],
  },
];

// Simple list for backward compatibility with existing dropdowns
export const DESTINATIONS = DESTINATION_CATALOG.map(
  (d) => `${d.city}${d.state ? `, ${d.state}` : ""}${d.country !== "India" ? ` (${d.country})` : ""}`
);

export const ENQUIRY_SOURCES = ["Instagram", "WhatsApp", "Referral", "Google", "Direct Call", "Website"];

export const PAYMENT_STAGES = [
  { value: "booking_deposit", label: "Booking Deposit (25%)" },
  { value: "advance_payment", label: "Pre-Wedding Advance (50%)" },
  { value: "final_settlement", label: "Final Settlement (25%)" },
  { value: "extra_charge", label: "Operational Change Order" },
];

export const TASK_CATEGORIES = [
  "Venue",
  "Decor",
  "Catering",
  "Invitations",
  "Logistics",
  "Day-of",
  "Legal/Contract",
  "Photography",
  "Entertainment/DJ",
  "Audio/Visual",
  "Hospitality",
  "Planning",
] as const;
