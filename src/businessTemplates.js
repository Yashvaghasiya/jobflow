// Business presets are suggestions only; existing records are never rewritten.
import {Zap,Wrench,AirVent,Hammer,Paintbrush,Sparkles,Bug,Truck,Camera,Sun,Scissors,Utensils,Cake,Heart,Dumbbell,Shirt,Code,Megaphone,Palette,Signpost,Printer,Armchair,GraduationCap,Smartphone,Car,BriefcaseBusiness} from 'lucide-react';
const icons={Zap,Wrench,AirVent,Hammer,Paintbrush,Sparkles,Bug,Truck,Camera,Sun,Scissors,Utensils,Cake,Heart,Dumbbell,Shirt,Code,Megaphone,Palette,Signpost,Printer,Armchair,GraduationCap,Smartphone,Car,BriefcaseBusiness};
export const businessTemplates=[
  {
    "id": "electrician",
    "name": "Electrician",
    "group": "HOME & REPAIR",
    "icon": "Zap",
    "defaultSac": "998719",
    "services": [
      "Fan & light fitting",
      "Switch & MCB repair",
      "Inverter setup",
      "House rewiring",
      "Geyser wiring"
    ],
    "workflow": [
      "Visit & diagnosis",
      "Quote approval",
      "Execution",
      "Testing & handover"
    ],
    "categories": [
      "Wire & cable",
      "Switches & sockets",
      "MCB & panels"
    ],
    "reminders": [
      "Pre-monsoon check",
      "Battery top-up"
    ]
  },
  {
    "id": "plumber",
    "name": "Plumber",
    "group": "HOME & REPAIR",
    "icon": "Wrench",
    "defaultSac": "998719",
    "services": [
      "Tap & mixer repair",
      "Drain unblocking",
      "Tank cleaning",
      "Motor pump installation",
      "Leak detection"
    ],
    "workflow": [
      "Inspection & quote",
      "Materials",
      "Repair",
      "Pressure test & cleanup"
    ],
    "categories": [
      "Pipes & fittings",
      "Solvents & sealants",
      "Valves"
    ],
    "reminders": [
      "Tank cleaning due",
      "Pump checkup"
    ]
  },
  {
    "id": "ac-appliance-repair",
    "name": "AC/Appliance Repair",
    "group": "HOME & REPAIR",
    "icon": "AirVent",
    "defaultSac": "998719",
    "services": [
      "AC service & coil wash",
      "Gas refill",
      "AC installation",
      "PCB repair",
      "Fridge repair"
    ],
    "workflow": [
      "Diagnosis",
      "Quote & part sourcing",
      "Repair",
      "Testing & warranty"
    ],
    "categories": [
      "Refrigerant gas",
      "Capacitors & PCBs",
      "Copper pipe"
    ],
    "reminders": [
      "Pre-summer service",
      "AMC renewal"
    ]
  },
  {
    "id": "carpenter",
    "name": "Carpenter",
    "group": "HOME & REPAIR",
    "icon": "Hammer",
    "defaultSac": "995476",
    "services": [
      "Lock & hinge repair",
      "Modular kitchen",
      "Wardrobe",
      "TV unit",
      "Furniture assembly"
    ],
    "workflow": [
      "Measurement & sketch",
      "Advance",
      "Fabrication",
      "Fitting & handover"
    ],
    "categories": [
      "Plywood",
      "Laminates",
      "Hardware"
    ],
    "reminders": [
      "Door alignment",
      "Hinge lubrication"
    ]
  },
  {
    "id": "painting-waterproofing",
    "name": "Painting & Waterproofing",
    "group": "HOME & REPAIR",
    "icon": "Paintbrush",
    "defaultSac": "995473",
    "services": [
      "Interior repaint",
      "Exterior painting",
      "Terrace waterproofing",
      "Crack repair",
      "Wood polish"
    ],
    "workflow": [
      "Visit & quote",
      "Surface preparation",
      "Coat application",
      "Cleanup & sign-off"
    ],
    "categories": [
      "Paints",
      "Putty & primer",
      "Waterproofing chemicals"
    ],
    "reminders": [
      "Pre-monsoon check",
      "Festive follow-up"
    ]
  },
  {
    "id": "home-cleaning",
    "name": "Home Cleaning",
    "group": "HOME & REPAIR",
    "icon": "Sparkles",
    "defaultSac": "998533",
    "services": [
      "Full home deep clean",
      "Kitchen deep clean",
      "Bathroom descaling",
      "Sofa shampoo",
      "Floor polishing"
    ],
    "workflow": [
      "Slot booking",
      "Cleaning",
      "Inspection",
      "Invoice"
    ],
    "categories": [
      "Chemicals",
      "Cloths & pads",
      "PPE"
    ],
    "reminders": [
      "Quarterly clean due",
      "Festive pre-booking"
    ]
  },
  {
    "id": "pest-control",
    "name": "Pest Control",
    "group": "HOME & REPAIR",
    "icon": "Bug",
    "defaultSac": "998531",
    "services": [
      "Cockroach gel",
      "Termite treatment",
      "Bed bug treatment",
      "Rodent control",
      "Fogging"
    ],
    "workflow": [
      "Inspection",
      "Deployment",
      "Booster dose",
      "Certificate"
    ],
    "categories": [
      "Insecticides & gels",
      "Traps & baits",
      "Safety gear"
    ],
    "reminders": [
      "Booster (14 days)",
      "Quarterly AMC"
    ]
  },
  {
    "id": "packers-movers",
    "name": "Packers & Movers",
    "group": "HOME & REPAIR",
    "icon": "Truck",
    "defaultSac": "996511",
    "services": [
      "Local shifting",
      "Intercity relocation",
      "Office shifting",
      "Vehicle transport",
      "Storage"
    ],
    "workflow": [
      "Survey & quote",
      "Packing & labeling",
      "Transit",
      "Settlement"
    ],
    "categories": [
      "Cartons",
      "Bubble wrap",
      "Labor"
    ],
    "reminders": [
      "Storage rent",
      "Post-move follow-up"
    ]
  },
  {
    "id": "cctv-security",
    "name": "CCTV & Security",
    "group": "HOME & REPAIR",
    "icon": "Camera",
    "defaultSac": "998719",
    "services": [
      "CCTV installation",
      "DVR/NVR & mobile view",
      "Video door phone",
      "Access control",
      "Camera repair"
    ],
    "workflow": [
      "Site survey",
      "Bill of materials & quote",
      "Cabling & configuration",
      "Handover"
    ],
    "categories": [
      "Cameras & recorders",
      "Hard drives",
      "Cables"
    ],
    "reminders": [
      "HDD check (6 months)",
      "AMC renewal"
    ]
  },
  {
    "id": "solar-installation",
    "name": "Solar Installation",
    "group": "HOME & REPAIR",
    "icon": "Sun",
    "defaultSac": "995461",
    "services": [
      "Rooftop on-grid plant",
      "Off-grid setup",
      "Net-metering liaison",
      "Panel cleaning",
      "Inverter service"
    ],
    "workflow": [
      "Feasibility",
      "Installation",
      "Commissioning",
      "Handover"
    ],
    "categories": [
      "Modules & inverters",
      "Structures",
      "Cables"
    ],
    "reminders": [
      "Quarterly cleaning",
      "Annual health check"
    ]
  },
  {
    "id": "salon",
    "name": "Salon",
    "group": "PERSONAL & EVENTS",
    "icon": "Scissors",
    "defaultSac": "999721",
    "services": [
      "Haircut & styling",
      "Colour & highlights",
      "Smoothening & keratin",
      "Facial & cleanup",
      "Bridal makeup"
    ],
    "workflow": [
      "Booking",
      "Service",
      "Billing",
      "Re-booking"
    ],
    "categories": [
      "Cosmetics & kits",
      "Dyes & chemicals",
      "Disposables"
    ],
    "reminders": [
      "Root touch-up (6 weeks)",
      "Monthly facial"
    ]
  },
  {
    "id": "catering",
    "name": "Catering",
    "group": "PERSONAL & EVENTS",
    "icon": "Utensils",
    "defaultSac": "996334",
    "services": [
      "Wedding buffet",
      "Corporate lunch",
      "Party catering",
      "Sit-down service",
      "Bulk meals"
    ],
    "workflow": [
      "Menu & tasting",
      "Quote & advance",
      "Setup & service",
      "Settlement"
    ],
    "categories": [
      "Groceries",
      "Perishables",
      "Labor"
    ],
    "reminders": [
      "Head-count (T-3)",
      "Balance payment"
    ]
  },
  {
    "id": "bakery",
    "name": "Bakery",
    "group": "PERSONAL & EVENTS",
    "icon": "Cake",
    "defaultSac": "1905",
    "services": [
      "Custom theme cakes",
      "Photo cakes",
      "Cupcakes & brownies",
      "Gift hampers",
      "Corporate bulk"
    ],
    "workflow": [
      "Order & advance",
      "Baking & decoration",
      "Delivery",
      "Review"
    ],
    "categories": [
      "Baking staples",
      "Cream & chocolate",
      "Boxes"
    ],
    "reminders": [
      "Dispatch check (T-1)",
      "Festive pre-booking"
    ]
  },
  {
    "id": "photography",
    "name": "Photography",
    "group": "PERSONAL & EVENTS",
    "icon": "Camera",
    "defaultSac": "998381",
    "services": [
      "Wedding shoot",
      "Cinematic video",
      "Maternity & newborn",
      "Product shoot",
      "Event coverage"
    ],
    "workflow": [
      "Date lock & advance",
      "Shoot",
      "Edit & album",
      "Delivery"
    ],
    "categories": [
      "Gear rental",
      "Storage",
      "Album printing"
    ],
    "reminders": [
      "Shortlisting",
      "Final payment"
    ]
  },
  {
    "id": "wedding-planner",
    "name": "Wedding Planner",
    "group": "PERSONAL & EVENTS",
    "icon": "Heart",
    "defaultSac": "998596",
    "services": [
      "Wedding planning",
      "Mandap & decor",
      "Artist & DJ management",
      "Corporate events",
      "Vendor liaison"
    ],
    "workflow": [
      "Consultation & budget",
      "Contract & advances",
      "Execution",
      "Settlement"
    ],
    "categories": [
      "Flowers",
      "Fabric & fabrication",
      "AV & sound"
    ],
    "reminders": [
      "Vendor advances",
      "Milestone payments"
    ]
  },
  {
    "id": "gym-fitness",
    "name": "Gym & Fitness",
    "group": "PERSONAL & EVENTS",
    "icon": "Dumbbell",
    "defaultSac": "999723",
    "services": [
      "Personal training",
      "Membership",
      "Transformation package",
      "Online coaching",
      "Diet plan"
    ],
    "workflow": [
      "Assessment",
      "Fee collection",
      "Training & weigh-ins",
      "Renewal"
    ],
    "categories": [
      "Equipment",
      "Sanitizing",
      "Utilities"
    ],
    "reminders": [
      "Renewal due",
      "Inactivity check-in"
    ]
  },
  {
    "id": "tailoring",
    "name": "Tailoring",
    "group": "PERSONAL & EVENTS",
    "icon": "Shirt",
    "defaultSac": "998822",
    "services": [
      "Blouse stitching",
      "Suit & kurti",
      "Gown & lehenga",
      "Men's wear",
      "Alteration"
    ],
    "workflow": [
      "Consultation & fabric",
      "Measurement & slip",
      "Stitching & trial",
      "Handover"
    ],
    "categories": [
      "Thread & zips",
      "Lining & lace",
      "Machine upkeep"
    ],
    "reminders": [
      "Fitting appointment",
      "Pickup notice"
    ]
  },
  {
    "id": "web-development",
    "name": "Web Development",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Code",
    "defaultSac": "998314",
    "services": [
      "Business website",
      "E-commerce store",
      "Web app",
      "UI/UX design",
      "Maintenance AMC"
    ],
    "workflow": [
      "Scope & quote",
      "Prototype",
      "Build & test",
      "Launch & balance"
    ],
    "categories": [
      "Hosting & domain",
      "Plugins",
      "Subscriptions"
    ],
    "reminders": [
      "Renewal reminder",
      "AMC checklist"
    ]
  },
  {
    "id": "digital-marketing",
    "name": "Digital Marketing",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Megaphone",
    "defaultSac": "998365",
    "services": [
      "Social media management",
      "Meta & Google ads",
      "SEO",
      "Influencer campaigns",
      "Local SEO"
    ],
    "workflow": [
      "Audit & strategy",
      "Content calendar",
      "Campaigns",
      "Report & renewal"
    ],
    "categories": [
      "Tools",
      "Stock assets",
      "Ad wallet"
    ],
    "reminders": [
      "Retainer invoice",
      "Approval follow-up"
    ]
  },
  {
    "id": "graphic-design",
    "name": "Graphic Design",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Palette",
    "defaultSac": "998391",
    "services": [
      "Logo & brand kit",
      "Packaging design",
      "Social creatives",
      "Brochure",
      "Pitch deck"
    ],
    "workflow": [
      "Brief & moodboard",
      "Concepts & iterations",
      "Proof",
      "Handoff"
    ],
    "categories": [
      "Licenses",
      "Fonts",
      "Stock & mockups"
    ],
    "reminders": [
      "Feedback deadline",
      "Festive outreach"
    ]
  },
  {
    "id": "signage-boards",
    "name": "Signage & Boards",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Signpost",
    "defaultSac": "995468",
    "services": [
      "ACP board",
      "3D acrylic LED letters",
      "Neon sign",
      "Vinyl board",
      "Lightbox"
    ],
    "workflow": [
      "Site visit",
      "Fabrication",
      "Installation",
      "Handover"
    ],
    "categories": [
      "ACP & acrylic",
      "LED & SMPS",
      "Labor"
    ],
    "reminders": [
      "Measurement appointment",
      "Annual LED check"
    ]
  },
  {
    "id": "printing-packaging",
    "name": "Printing & Packaging",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Printer",
    "defaultSac": "998912",
    "services": [
      "Offset printing",
      "Cartons",
      "Labels & stickers",
      "Cards & stationery",
      "Rigid boxes"
    ],
    "workflow": [
      "Specification & proof",
      "Press run",
      "Finishing & dispatch",
      "Settlement"
    ],
    "categories": [
      "Paper board",
      "Inks & lamination",
      "Freight"
    ],
    "reminders": [
      "Proof sign-off",
      "Re-order cycle"
    ]
  },
  {
    "id": "interior-designer",
    "name": "Interior Designer",
    "group": "PROFESSIONAL & CREATIVE",
    "icon": "Armchair",
    "defaultSac": "995476",
    "services": [
      "Turnkey interiors",
      "Modular kitchen & wardrobe",
      "3D design",
      "False ceiling",
      "Office fit-out"
    ],
    "workflow": [
      "Site & brief",
      "3D & bill of quantities",
      "Civil & carpentry",
      "Handover"
    ],
    "categories": [
      "Plywood & laminates",
      "Hardware",
      "Contractors"
    ],
    "reminders": [
      "BOQ milestones",
      "Warranty inspection"
    ]
  },
  {
    "id": "tutoring",
    "name": "Tutoring",
    "group": "LOCAL SERVICES",
    "icon": "GraduationCap",
    "defaultSac": "999293",
    "services": [
      "Board exam coaching",
      "JEE/NEET preparation",
      "Home tuition",
      "Test series",
      "Spoken English"
    ],
    "workflow": [
      "Inquiry & demo",
      "Enrollment & fee",
      "Classes & tests",
      "Parent-teacher meeting"
    ],
    "categories": [
      "Study material",
      "Classroom rent",
      "Faculty pay"
    ],
    "reminders": [
      "Fee due",
      "Absentee notice"
    ]
  },
  {
    "id": "mobile-repair",
    "name": "Mobile Repair",
    "group": "LOCAL SERVICES",
    "icon": "Smartphone",
    "defaultSac": "998715",
    "services": [
      "Display replacement",
      "Battery replacement",
      "Charging port repair",
      "Motherboard repair",
      "Software flash"
    ],
    "workflow": [
      "Intake & diagnosis",
      "Job sheet",
      "Repair",
      "Demo & bill"
    ],
    "categories": [
      "Screens",
      "Batteries",
      "Consumables"
    ],
    "reminders": [
      "Pickup (48 hrs)",
      "Warranty notice"
    ]
  },
  {
    "id": "car-detailing",
    "name": "Car Detailing",
    "group": "LOCAL SERVICES",
    "icon": "Car",
    "defaultSac": "998714",
    "services": [
      "Foam wash & vacuum",
      "Interior deep clean",
      "Polish",
      "Ceramic coating",
      "Paint protection film"
    ],
    "workflow": [
      "Check-in",
      "Wash & treatment",
      "Quality check",
      "Handover"
    ],
    "categories": [
      "Shampoos",
      "Polish & pads",
      "Ceramic & PPF"
    ],
    "reminders": [
      "Coating care (6 months)",
      "Monthly wash"
    ]
  },
  {
    "id": "other",
    "name": "Other",
    "group": "OTHER",
    "icon": "BriefcaseBusiness",
    "defaultSac": "",
    "services": [
      "Generic service (add your own)"
    ],
    "workflow": [
      "Enquiry",
      "Quotation",
      "Advance",
      "Execution",
      "Handover"
    ],
    "categories": [
      "Materials",
      "Labor",
      "Transport",
      "Miscellaneous"
    ],
    "reminders": [
      "Payment follow-up"
    ]
  }
].map(t=>Object.freeze({...t,icon:icons[t.icon],services:Object.freeze(t.services),workflow:Object.freeze(t.workflow),categories:Object.freeze(t.categories),reminders:Object.freeze(t.reminders)}));
export const businessGroups=Object.freeze(['HOME & REPAIR','PERSONAL & EVENTS','PROFESSIONAL & CREATIVE','LOCAL SERVICES']);
export const getBusinessTemplate=id=>businessTemplates.find(t=>t.id===id)||businessTemplates.find(t=>t.id==='other');
export const needsBusinessOnboarding=(profile,view='owner')=>view==='owner'&&!profile?.business_type;
export default businessTemplates;
