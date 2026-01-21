// app/api/job-request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { jobRequestSchema } from "@/src/job-request/schema";

export const runtime = "nodejs";

const REQUIRED_FILES = [
  { key: "po", label: "Approved PO" },
  { key: "estimate", label: "Proposal" }, // key stays estimate, label shown to user is Proposal
] as const;

function safeJsonError(message: string, status = 500, extra?: unknown) {
  return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
}

function parseTodaysDate(mmddyyyy?: string) {
  if (!mmddyyyy) return null;
  const parts = mmddyyyy.split("/");
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts.map((p) => p.trim());
  const m = Number(mm);
  const d = Number(dd);
  const y = Number(yyyy);
  if (!m || !d || !y) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getString(form: FormData, key: string) {
  const v = form.get(key);
  if (v === null || v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  return v; // keep raw; schema handles trimming/empty
}

function formToObject(form: FormData) {
  const keys = [
    "todays_date",
    "completed_by",
    "job_no",
    "proposal_bid_no",
    "division_no",
    "job_description",
    "new_customer",
    "service_offering",
    "freight",
    "engineering_services",
    "customer_number",
    "customer_name",
    "general_contractor",
    "phone_number",
    "address",
    "city",
    "state",
    "zip",
    "sub_contractor",
    "attention",
    "billing_address",
    "billing_city",
    "billing_state",
    "billing_zip",
    "customer_contact",
    "customer_phone",
    "foreman_proj_mgr",
    "billed_by",
    "sales_person",
    "contract_po_amount",
    "contract_po_no",
    "plant_id",
    "scaffold_type",
    "market",
    "submarket",
    "jobsite_address",
    "jobsite_city",
    "jobsite_state",
    "jobsite_zip",
    "county_parish",
    "retention",
    "retention_amount_pct",
    "call_out",
    "asbestos_related",
    "ap_contact",
    "ap_phone",
    "ap_email",
    "invoice_submission_method",
    "portal_name",
    "payment_method",
    "proposal_not_signed_justification",
  ] as const;

  const obj: Record<string, unknown> = {};
  for (const k of keys) obj[k] = getString(form, k);
  return obj;
}

async function sendResendEmail(args: { subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_TO;

  if (!apiKey || !from || !to) {
    throw new Error("Missing RESEND_API_KEY, RESEND_FROM, or RESEND_TO env vars.");
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    subject: args.subject,
    html: args.html,
  });

  if (error) throw new Error(`Resend email failed: ${error.message}`);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Required attachments
    for (const f of REQUIRED_FILES) {
      const file = form.get(f.key);
      if (!(file instanceof File) || file.size === 0) {
        return safeJsonError(`Missing required attachment: ${f.label}.`, 400);
      }
    }

    // Validate fields
    const parsed = jobRequestSchema.safeParse(formToObject(form));
    if (!parsed.success) {
      return safeJsonError("Validation failed.", 400, parsed.error.issues);
    }

    const payload = parsed.data;
    const isoTodaysDate = parseTodaysDate(payload.todays_date);

    // Insert request
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("job_requests")
      .insert({
        todays_date: isoTodaysDate,

        completed_by: payload.completed_by,
        job_no: payload.job_no,
        proposal_bid_no: payload.proposal_bid_no ?? null,

        division_no: payload.division_no,
        job_description: payload.job_description,
        service_offering: payload.service_offering,

        foreman_proj_mgr: payload.foreman_proj_mgr ?? null,
        billed_by: payload.billed_by ?? null,
        sales_person: payload.sales_person ?? null,

        general_contractor: payload.general_contractor ?? null,
        address: payload.address ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        zip: payload.zip ?? null,
        phone_number: payload.phone_number ?? null,
        sub_contractor: payload.sub_contractor ?? null,

        new_customer: payload.new_customer,
        customer_number: payload.customer_number ?? null,
        customer_name: payload.customer_name ?? null,
        attention: payload.attention ?? null,

        billing_address: payload.billing_address ?? null,
        billing_city: payload.billing_city ?? null,
        billing_state: payload.billing_state ?? null,
        billing_zip: payload.billing_zip ?? null,

        customer_contact: payload.customer_contact ?? null,
        customer_phone: payload.customer_phone ?? null,

        freight: payload.freight,
        engineering_services: payload.engineering_services,

        plant_id: payload.plant_id,
        scaffold_type: payload.scaffold_type,
        market: payload.market,
        submarket: payload.submarket,

        jobsite_address: payload.jobsite_address ?? null,
        jobsite_city: payload.jobsite_city ?? null,
        jobsite_state: payload.jobsite_state ?? null,
        jobsite_zip: payload.jobsite_zip ?? null,
        county_parish: payload.county_parish ?? null,

        contract_po_amount: payload.contract_po_amount,
        contract_po_no: payload.contract_po_no,

        retention: payload.retention,
        retention_amount_pct: payload.retention_amount_pct ?? null,
        call_out: payload.call_out,
        asbestos_related: payload.asbestos_related,

        ap_contact: payload.ap_contact,
        ap_phone: payload.ap_phone,
        ap_email: payload.ap_email,

        invoice_submission_method: payload.invoice_submission_method,
        portal_name: (payload.portal_name ?? "").trim(),

        payment_method: payload.payment_method,

        proposal_not_signed_justification: payload.proposal_not_signed_justification,

        status: "new",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("DB INSERT ERROR:", insertErr);
      return safeJsonError("DB insert failed.", 500, insertErr ?? "No inserted row returned.");
    }

    const requestId = inserted.id as string;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "job-execution-uploads";

    // Upload files + insert file rows
    for (const f of REQUIRED_FILES) {
      const file = form.get(f.key) as File;

      const arrayBuffer = await file.arrayBuffer();
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const safeName = `${f.key}-${randomUUID()}.${ext}`;
      const storagePath = `job-requests/${requestId}/${safeName}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(storagePath, Buffer.from(arrayBuffer), {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadErr) {
        console.error("UPLOAD ERROR:", uploadErr);
        await supabaseAdmin.from("job_requests").delete().eq("id", requestId);
        return safeJsonError(`Upload failed for ${f.label}.`, 500, uploadErr);
      }

      const { error: fileRowErr } = await supabaseAdmin.from("job_request_files").insert({
        request_id: requestId,
        file_label: f.label,
        storage_path: storagePath,
        original_filename: file.name,
        content_type: file.type,
      });

      if (fileRowErr) {
        console.error("FILE ROW INSERT ERROR:", fileRowErr);
        await supabaseAdmin.from("job_requests").delete().eq("id", requestId);
        return safeJsonError("File DB insert failed.", 500, fileRowErr);
      }
    }

    // Email (Resend) - after everything succeeded
    try {
      await sendResendEmail({
        subject: `New Job Setup Request - ${payload.job_no} - ${payload.division_no}`,
        html: `
          <p><b>New Job Setup Request Submitted</b></p>
          <p><b>Request ID:</b> ${requestId}</p>
          <p><b>Completed By:</b> ${payload.completed_by}</p>
          <p><b>Division No:</b> ${payload.division_no}</p>
          <p><b>Market/Submarket:</b> ${payload.market} / ${payload.submarket}</p>
          <p><b>Scaffold Type:</b> ${payload.scaffold_type}</p>
          <p><b>PO #:</b> ${payload.contract_po_no}</p>
        `,
      });
    } catch (emailErr) {
      // Don’t fail the request if email fails; log it
      console.error("RESEND EMAIL ERROR:", emailErr);
    }

    return NextResponse.json({ id: requestId }, { status: 200 });
  } catch (err: any) {
    console.error("JOB-REQUEST ERROR:", err);
    if (err instanceof z.ZodError) {
      return safeJsonError("Validation failed.", 400, err.issues);
    }
    return safeJsonError(err?.message ?? "Unexpected server error.", 500);
  }
}
