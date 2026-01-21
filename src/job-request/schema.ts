// src/job-request/schema.ts
import { z } from "zod";
import {
  serviceOfferings,
  freightOptions,
  plantIds,
  scaffoldTypes,
  marketToSubmarkets,
  markets,
  retentionOptions,
  callOutOptions,
  asbestosOptions,
  invoiceSubmissionMethods,
  paymentMethods,
} from "./constants";

/** Utility: convert "" to undefined so Zod required enums work on <select> */
const emptyToUndefined = (v: unknown) => {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
};

/** Utility: trimmed required string (not blank) */
const requiredTrimmed = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: `${label} is required` });

/** Shared schema used by client + server */
export const jobRequestSchema = z
  .object({
    // Header/top row
    todays_date: z.string().optional(),

    completed_by: requiredTrimmed("Completed By"),
    job_no: requiredTrimmed("Job No"),
    proposal_bid_no: z.preprocess(emptyToUndefined, z.string().optional()),

    // Core job info
    division_no: requiredTrimmed("Division No"),
    job_description: requiredTrimmed("Job Description").refine((s) => s.length >= 5, {
      message: "Job Description is required",
    }),

    new_customer: z.preprocess(
      emptyToUndefined,
      z.enum(["Yes", "No"], { required_error: "Select New Customer" })
    ),
    service_offering: z.preprocess(
      emptyToUndefined,
      z.enum(serviceOfferings, { required_error: "Select Service Offering" })
    ),
    freight: z.preprocess(
      emptyToUndefined,
      z.enum(freightOptions, { required_error: "Select Freight" })
    ),
    engineering_services: z.preprocess(
      emptyToUndefined,
      z.enum(["Yes", "No"], { required_error: "Select Engineering Services" })
    ),

    // Customer fields (mostly optional)
    customer_number: z.preprocess(emptyToUndefined, z.string().optional()),
    customer_name: z.preprocess(emptyToUndefined, z.string().optional()),
    general_contractor: z.preprocess(emptyToUndefined, z.string().optional()),
    phone_number: z.preprocess(emptyToUndefined, z.string().optional()),
    address: z.preprocess(emptyToUndefined, z.string().optional()),
    city: z.preprocess(emptyToUndefined, z.string().optional()),
    state: z.preprocess(emptyToUndefined, z.string().optional()),
    zip: z.preprocess(emptyToUndefined, z.string().optional()),
    sub_contractor: z.preprocess(emptyToUndefined, z.string().optional()),
    attention: z.preprocess(emptyToUndefined, z.string().optional()),

    billing_address: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_city: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_state: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_zip: z.preprocess(emptyToUndefined, z.string().optional()),

    customer_contact: z.preprocess(emptyToUndefined, z.string().optional()),
    customer_phone: z.preprocess(emptyToUndefined, z.string().optional()),

    foreman_proj_mgr: z.preprocess(emptyToUndefined, z.string().optional()),
    billed_by: z.preprocess(emptyToUndefined, z.string().optional()),
    sales_person: z.preprocess(emptyToUndefined, z.string().optional()),

    contract_po_amount: z.coerce
      .number({ required_error: "Contract/PO Amount is required" })
      .positive("Contract/PO Amount must be > 0"),
    contract_po_no: requiredTrimmed("Contract / P.O. No."),

    // REQUIRED selects
    plant_id: z.preprocess(
      emptyToUndefined,
      z.enum(plantIds, { required_error: "Plant ID is required" })
    ),
    scaffold_type: z.preprocess(
      emptyToUndefined,
      z.enum(scaffoldTypes, { required_error: "Scaffold Type is required" })
    ),
    market: z.preprocess(emptyToUndefined, z.enum(markets, { required_error: "Market is required" })),
    submarket: z.preprocess(emptyToUndefined, z.string().min(1, "Submarket is required")),

    // Jobsite info
    jobsite_address: z.preprocess(emptyToUndefined, z.string().optional()),
    jobsite_city: z.preprocess(emptyToUndefined, z.string().optional()),
    jobsite_state: z.preprocess(emptyToUndefined, z.string().optional()),
    jobsite_zip: z.preprocess(emptyToUndefined, z.string().optional()),
    county_parish: z.preprocess(emptyToUndefined, z.string().optional()),

    /* ---------- Special Billing Requirements (DB enforced) ---------- */
    retention: z.preprocess(
      emptyToUndefined,
      z.enum(retentionOptions, { required_error: "Retention is required" })
    ),
    retention_amount_pct: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .min(0, "Retention % must be 0-100")
        .max(100, "Retention % must be 0-100")
        .optional()
    ),
    call_out: z.preprocess(
      emptyToUndefined,
      z.enum(callOutOptions, { required_error: "Call Out is required" })
    ),
    asbestos_related: z.preprocess(
      emptyToUndefined,
      z.enum(asbestosOptions, { required_error: "Asbestos Related is required" })
    ),

    /* ---------- Accounts Payable Info (DB enforced not blank) ---------- */
    ap_contact: requiredTrimmed("Accounts Payable Contact"),
    ap_phone: requiredTrimmed("Accounts Payable Phone"),
    ap_email: requiredTrimmed("Accounts Payable Email").refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: "Accounts Payable Email must be a valid email address" }
    ),

    /* ---------- Invoice submission + portal (DB enforced) ---------- */
    invoice_submission_method: z.preprocess(
      emptyToUndefined,
      z.enum(invoiceSubmissionMethods, { required_error: "Invoice Submission Method is required" })
    ),
    portal_name: z.preprocess(emptyToUndefined, z.string().optional()),

    /* ---------- Payment (DB enforced) ---------- */
    payment_method: z.preprocess(
      emptyToUndefined,
      z.enum(paymentMethods, { required_error: "Payment Method is required" })
    ),

    /* ---------- NEW required comment ---------- */
    proposal_not_signed_justification: requiredTrimmed(
      "Please give job details/justification for proposal not being signed."
    ),
  })
  .superRefine((val, ctx) => {
    // Market/submarket must match
    const allowed = marketToSubmarkets[val.market] ?? [];
    if (!allowed.includes(val.submarket as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Submarket does not match selected Market.",
        path: ["submarket"],
      });
    }

    // If retention is Yes => retention_amount_pct required
    if (val.retention === "Yes") {
      if (val.retention_amount_pct === undefined || Number.isNaN(val.retention_amount_pct)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Retention amount % is required when Retention is Yes.",
          path: ["retention_amount_pct"],
        });
      }
    }

    // If Portal => portal_name required
    if (val.invoice_submission_method === "Portal") {
      const p = (val.portal_name ?? "").trim();
      if (!p) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Portal Name is required when Portal is selected.",
          path: ["portal_name"],
        });
      }
    }
  });

export type JobRequestValues = z.infer<typeof jobRequestSchema>;
