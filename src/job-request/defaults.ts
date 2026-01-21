// src/job-request/defaults.ts
import type { JobRequestValues } from "./schema";

export const JOB_REQUEST_DEFAULTS: JobRequestValues = {
  todays_date: "",

  completed_by: "",
  job_no: "TBD",
  proposal_bid_no: "",

  division_no: "",
  job_description: "",

  new_customer: "No",
  service_offering: "05 - Commercial Scaffolding",
  freight: "1 - Carrier Bills Customer Direct",
  engineering_services: "No",

  customer_number: "",
  customer_name: "",
  general_contractor: "",
  phone_number: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  sub_contractor: "",
  attention: "",

  billing_address: "",
  billing_city: "",
  billing_state: "",
  billing_zip: "",

  customer_contact: "",
  customer_phone: "",

  foreman_proj_mgr: "",
  billed_by: "",
  sales_person: "",

  contract_po_amount: 0 as any,
  contract_po_no: "",

  plant_id: "" as any,
  scaffold_type: "" as any,
  market: "" as any,
  submarket: "",

  jobsite_address: "",
  jobsite_city: "",
  jobsite_state: "",
  jobsite_zip: "",
  county_parish: "",

  retention: "No",
  retention_amount_pct: undefined,
  call_out: "None",
  asbestos_related: "No",

  ap_contact: "",
  ap_phone: "",
  ap_email: "",

  invoice_submission_method: "Email",
  portal_name: "",

  payment_method: "Check",

  proposal_not_signed_justification: "",
};
