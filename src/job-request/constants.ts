// src/job-request/constants.ts

/* ---------- Dropdown data (single source of truth) ---------- */

export const serviceOfferings = [
  "01 - Asbestos Abatement",
  "02 - Abrasive Blasting",
  "03 - Carpentry Services",
  "04 - Civil Construction",
  "05 - Commercial Scaffolding",
  "06 - Composite Wrap",
  "07 - Concrete Construction",
  "08 - Corrosion Services - Other",
  "09 - Corrosion Under Fireproofing",
  "10 - Corrosion Under Insulation",
  "11 - CP Construction",
  "12 - CP Products",
] as const;

export const freightOptions = [
  "1 - Carrier Bills Customer Direct",
  "2 - Brandsafway Pays - Do Not Rebill Customer",
  "3 - Brandsafway Pays - Bill Customer",
  "4 - Customer Pick-Up",
  "5 - Brandsafway Pays to Jobsite - Customer Pays Return Freight",
] as const;

export const plantIds = ["8350316", "8350328"] as const;

export const scaffoldTypes = [
  "1 - Cuptype Imperial",
  "2 - Cuptype Metric",
  "3 - Frame & Brace",
  "4 - Layher",
  "5 - Miscellaneous",
  "6 - Nonrental",
  "7 - Safway",
  "8 - Skylimber",
  "9 - Tube & Clamp",
] as const;

/* Special Billing Requirements */
export const retentionOptions = ["No", "Yes"] as const;

// If you want different wording/options, change them here (client + server will inherit).
export const callOutOptions = ["None", "4 Hour Minimum", "8 Hour Minimum", "Other"] as const;

export const asbestosOptions = ["No", "Yes"] as const;

/* Invoice / Payment */
export const invoiceSubmissionMethods = ["Email", "Portal"] as const;
export const paymentMethods = ["Check", "ACH"] as const;

/* Market/Submarket cascading */
export const marketToSubmarkets = {
  "1 - Chemical": ["Chemical Plant", "Petrochemical Plant"],
  "2 - Civil": ["Bridges", "Dams", "Roads", "Transit Ways"],
  "3 - Commercial": [
    "Casinos",
    "Condos / Apartments",
    "Hotels",
    "Office Buildings",
    "Parking Garages",
    "Special Events",
    "Stadiums",
    "Theaters",
  ],
  "4 - Institutional": ["Airports", "Government Buildings", "Hospitals", "Schools / Universities"],
  "5 - Industrial Other": [
    "Automotive Plants",
    "Food and Beverage",
    "Cement Plants",
    "Gas Plants",
    "Manufacturing Plants",
    "Mines",
    "Sewage Treatment Plants",
    "Shipyards",
    "Steel Mills",
    "Water Treatment Plants",
  ],
  "6 - Gas": [
    "Liquid Natural Gas",
    "Compressor & Metering Stations",
    "Natural Gas",
    "Natural Gas Liquification",
    "Well Casing - Gas",
    "Well Casing - Liquid",
  ],
  "7 - Offshore": ["Drill Rigs", "Production Platforms"],
  "8 - Oil Sands": ["Mining", "SAGD", "Modular Yards", "Upgraders"],
  "9 - Power Plants": [
    "Combined-Cycle Plant",
    "Gas Turbine Plant",
    "Hydro Electric Plant",
    "Nuclear Plant",
    "Other Power Plant",
    "Steam Turbine Plant",
    "Solar",
    "Wind",
  ],
  "10 - Pulp & Paper": ["Paper Mill", "Pulp Mill"],
  "11 - Refinery": ["Pipeline/Terminals", "Refinery"],
} as const;

export const markets = Object.keys(marketToSubmarkets) as Array<keyof typeof marketToSubmarkets>;

/* ---------- Types (optional, but handy) ---------- */
export type ServiceOffering = (typeof serviceOfferings)[number];
export type FreightOption = (typeof freightOptions)[number];
export type PlantId = (typeof plantIds)[number];
export type ScaffoldType = (typeof scaffoldTypes)[number];

export type RetentionOption = (typeof retentionOptions)[number];
export type CallOutOption = (typeof callOutOptions)[number];
export type AsbestosOption = (typeof asbestosOptions)[number];

export type InvoiceSubmissionMethod = (typeof invoiceSubmissionMethods)[number];
export type PaymentMethod = (typeof paymentMethods)[number];

export type Market = (typeof markets)[number];
export type Submarket = (typeof marketToSubmarkets)[Market][number];
