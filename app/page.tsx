// app/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "@/src/styles/jobRequest.module.css";

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
} from "@/src/job-request/constants";

import { jobRequestSchema, type JobRequestValues } from "@/src/job-request/schema";
import { JOB_REQUEST_DEFAULTS } from "@/src/job-request/defaults";

type ServerIssue = { path?: unknown; message?: unknown };

export default function Page() {
  const today = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(
      2,
      "0"
    )}/${d.getFullYear()}`;
  }, []);

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const poRef = useRef<HTMLInputElement | null>(null);
  const estRef = useRef<HTMLInputElement | null>(null);
  const [poName, setPoName] = useState("");
  const [proposalName, setProposalName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<JobRequestValues>({
    resolver: zodResolver(jobRequestSchema),
    defaultValues: JOB_REQUEST_DEFAULTS,
    mode: "onBlur",
  });

  const selectedMarket = watch("market");
  const submarketOptions = selectedMarket ? marketToSubmarkets[selectedMarket] ?? [] : [];

  const retention = watch("retention");
  const invoiceMethod = watch("invoice_submission_method");

  const keepJobNo = () => setValue("job_no", "TBD");

  const clearFiles = () => {
    if (poRef.current) poRef.current.value = "";
    if (estRef.current) estRef.current.value = "";
    setPoName("");
    setProposalName("");
  };

  const applyServerIssuesInline = (issues: unknown) => {
    if (!Array.isArray(issues)) return false;
    let applied = false;

    for (const issue of issues as ServerIssue[]) {
      const path = issue?.path;
      const message = issue?.message;
      const field =
        Array.isArray(path) && typeof path[0] === "string" ? (path[0] as string) : undefined;

      if (field && typeof message === "string") {
        applied = true;
        setError(field as any, { type: "server", message });
      }
    }
    return applied;
  };

  const onSubmit = async (values: JobRequestValues) => {
    setServerError(null);
    setServerSuccess(null);
    clearErrors();

    const po = poRef.current?.files?.[0];
    const proposal = estRef.current?.files?.[0]; // key remains estimate on the backend

    if (!po || !proposal) {
      setServerError("Approved PO and Proposal are both required.");
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      formData.append(k, String(v));
    });

    formData.append("todays_date", today);
    formData.append("po", po);
    formData.append("estimate", proposal); // keep this key to match route.ts

    const res = await fetch("/api/job-request", { method: "POST", body: formData });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const hadFieldIssues = applyServerIssuesInline(data?.details);
      setServerError(
        hadFieldIssues ? "Please correct the highlighted fields and resubmit." : data?.error ?? "Submission failed."
      );
      return;
    }

    setServerSuccess(`Submitted successfully (Request ID: ${data.id})`);

    reset(JOB_REQUEST_DEFAULTS, { keepErrors: false, keepDirty: false, keepTouched: false });
    setValue("job_no", "TBD");
    clearFiles();
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logoBox}>
          <Image src="/logo.png" alt="BrandSafway" width={150} height={42} />
        </div>
        <div className={styles.headerTitle}>JOB INFORMATION</div>
      </div>

      {serverError && <div className={`${styles.alert} ${styles.alertError}`}>{serverError}</div>}
      {serverSuccess && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>{serverSuccess}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 16 }}>
        {/* TOP ROW */}
        <div className={styles.topRowGrid}>
          <TopCell label="Today's Date:" value={today} />

          <TopInputCell
            label="Completed By:"
            error={errors.completed_by?.message}
            input={<input className={styles.topInput} {...register("completed_by")} />}
          />

          <TopInputCell
            label="Job No.:"
            input={
              <input
                className={`${styles.topInput} ${styles.disabledInput}`}
                disabled
                value="TBD"
                onChange={keepJobNo}
              />
            }
          />

          <TopInputCell
            label="Proposal/Bid No.:"
            input={<input className={styles.topInput} {...register("proposal_bid_no")} />}
          />
        </div>

        {/* MAIN 3-COLUMN SHEET */}
        <div className={styles.sheet}>
          <div className={styles.sheetCol}>
            <SheetRow label="Division No:" error={errors.division_no?.message}>
              <input className={styles.cellInput} {...register("division_no")} />
            </SheetRow>

            <SheetRow label="Job Description:" error={errors.job_description?.message}>
              <textarea className={styles.cellInput} style={{ minHeight: 72 }} {...register("job_description")} />
            </SheetRow>

            <SheetRow label="Service Offering:" error={errors.service_offering?.message}>
              <select className={styles.cellInput} {...register("service_offering")}>
                {serviceOfferings.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </SheetRow>

            <SheetRow label="Foreman/Proj Mgr:">
              <input className={styles.cellInput} {...register("foreman_proj_mgr")} />
            </SheetRow>

            <SheetRow label="Billed by:">
              <input className={styles.cellInput} {...register("billed_by")} />
            </SheetRow>

            <SheetRow label="Contract/PO Amount $:" error={errors.contract_po_amount?.message}>
              <input className={styles.cellInput} type="number" step="0.01" {...register("contract_po_amount")} />
            </SheetRow>

            <SheetRow label="Contract / P.O. No.:" error={errors.contract_po_no?.message}>
              <input className={styles.cellInput} {...register("contract_po_no")} />
            </SheetRow>

            <SheetRow label="Sales Person:">
              <input className={styles.cellInput} {...register("sales_person")} />
            </SheetRow>
          </div>

          <div className={styles.sheetColMid}>
            <div className={styles.midNote}>For Infrastructure Services only</div>

            <SheetRow label="General Contractor:">
              <input className={styles.cellInput} {...register("general_contractor")} />
            </SheetRow>

            <SheetRow label="Address:">
              <input className={styles.cellInput} {...register("address")} />
            </SheetRow>

            <div className={styles.splitRow}>
              <SheetRowInline label="City:">
                <input className={styles.cellInput} {...register("city")} />
              </SheetRowInline>
              <SheetRowInline label="State:">
                <input className={styles.cellInput} {...register("state")} />
              </SheetRowInline>
              <SheetRowInline label="Zip:">
                <input className={styles.cellInput} {...register("zip")} />
              </SheetRowInline>
            </div>

            <SheetRow label="Phone Number:">
              <input className={styles.cellInput} {...register("phone_number")} />
            </SheetRow>

            <SheetRow label="Sub-Contractor:">
              <input className={styles.cellInput} {...register("sub_contractor")} />
            </SheetRow>

            <div style={{ marginTop: 8 }}>
              <SheetRow label="Freight:" error={errors.freight?.message}>
                <select className={styles.cellInput} {...register("freight")}>
                  {freightOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </SheetRow>

              <SheetRow label="Engineering Services:" error={errors.engineering_services?.message}>
                <select className={styles.cellInput} {...register("engineering_services")}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </SheetRow>
            </div>
          </div>

          <div className={`${styles.sheetCol} ${styles.sheetColLast}`}>
            <div className={styles.rightHeader}>
              <div className={styles.rightHeaderLabel}>New Customer?</div>
              <select className={styles.cellInput} style={{ maxWidth: 220 }} {...register("new_customer")}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <SheetRow label="Customer Number:">
              <input className={styles.cellInput} {...register("customer_number")} />
            </SheetRow>

            <SheetRow label="Customer Name:">
              <input className={styles.cellInput} {...register("customer_name")} />
            </SheetRow>

            <SheetRow label="Attention:">
              <input className={styles.cellInput} {...register("attention")} />
            </SheetRow>

            <SheetRow label="Billing Address:">
              <input className={styles.cellInput} {...register("billing_address")} />
            </SheetRow>

            <div className={styles.splitRow}>
              <SheetRowInline label="City:">
                <input className={styles.cellInput} {...register("billing_city")} />
              </SheetRowInline>
              <SheetRowInline label="State:">
                <input className={styles.cellInput} {...register("billing_state")} />
              </SheetRowInline>
              <SheetRowInline label="Zip:">
                <input className={styles.cellInput} {...register("billing_zip")} />
              </SheetRowInline>
            </div>

            <SheetRow label="Customer Contact:">
              <input className={styles.cellInput} {...register("customer_contact")} />
            </SheetRow>

            <SheetRow label="Customer Phone:">
              <input className={styles.cellInput} {...register("customer_phone")} />
            </SheetRow>
          </div>
        </div>

        {/* NEXT SECTION */}
        <div className={styles.nextSection}>
          <div className={styles.nextSectionRow}>
            <div className={styles.nextSectionCell}>
              <div className={styles.inlineLabel}>Plant ID:</div>
              <select className={styles.cellInput} {...register("plant_id")}>
                <option value="">Select...</option>
                {plantIds.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.plant_id?.message && <div className={styles.errText}>{errors.plant_id.message}</div>}
            </div>

            <div className={styles.nextSectionCell}>
              <div className={styles.inlineLabel}>Scaffold Type:</div>
              <select className={styles.cellInput} {...register("scaffold_type")}>
                <option value="">Select...</option>
                {scaffoldTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.scaffold_type?.message && <div className={styles.errText}>{errors.scaffold_type.message}</div>}
            </div>
          </div>

          <div className={styles.nextSectionRow}>
            <div className={styles.nextSectionCell}>
              <div className={styles.inlineLabel}>Market:</div>
              <select
                className={styles.cellInput}
                {...register("market")}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue("market", v as any, { shouldValidate: true, shouldDirty: true });
                  setValue("submarket", "" as any, { shouldValidate: true, shouldDirty: true });
                }}
              >
                <option value="">Select...</option>
                {markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.market?.message && <div className={styles.errText}>{errors.market.message}</div>}
            </div>

            <div className={styles.nextSectionCell}>
              <div className={styles.inlineLabel}>Submarket:</div>
              <select
                className={styles.cellInput}
                disabled={!selectedMarket}
                value={watch("submarket") ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue("submarket", v as any, { shouldValidate: true, shouldDirty: true });
                  clearErrors(["market", "submarket"] as any);
                }}
              >
                <option value="">{selectedMarket ? "Select..." : "Select Market first"}</option>
                {submarketOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.submarket?.message && <div className={styles.errText}>{errors.submarket.message}</div>}
            </div>
          </div>

          <div className={styles.nextSectionNote}>Please provide complete address of the JOB SITE</div>

          <div className={styles.nextSectionRow}>
            <div className={styles.nextSectionCell} style={{ gridColumn: "1 / span 2" }}>
              <div className={styles.inlineLabel}>Physical address:</div>
              <input className={styles.cellInput} {...register("jobsite_address")} />
            </div>
          </div>

          <div className={styles.nextSectionRow3}>
            <div className={styles.inlineCell}>
              <div className={styles.inlineLabel}>City:</div>
              <input className={styles.cellInput} {...register("jobsite_city")} />
            </div>

            <div className={styles.inlineCell}>
              <div className={styles.inlineLabel}>State:</div>
              <input className={styles.cellInput} {...register("jobsite_state")} />
            </div>

            <div className={styles.inlineCell}>
              <div className={styles.inlineLabel}>Zip Code:</div>
              <input className={styles.cellInput} {...register("jobsite_zip")} />
            </div>
          </div>

          <div className={styles.nextSectionRow}>
            <div className={styles.nextSectionCell} style={{ gridColumn: "1 / span 2" }}>
              <div className={styles.inlineLabel}>County/Parish:</div>
              <input className={styles.cellInput} {...register("county_parish")} />
            </div>
          </div>
        </div>

        {/* SPECIAL BILLING REQUIREMENTS */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>SPECIAL BILLING REQUIREMENTS</div>

          <div className={styles.twoColGrid}>
            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Retention:</div>
              <select className={styles.cellInput} {...register("retention")}>
                <option value="">Select...</option>
                {retentionOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.retention?.message && <div className={styles.errText}>{errors.retention.message}</div>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>If Retention, what amount? (%):</div>
              <input
                className={styles.cellInput}
                type="number"
                step="0.01"
                disabled={retention !== "Yes"}
                {...register("retention_amount_pct")}
              />
              {errors.retention_amount_pct?.message && (
                <div className={styles.errText}>{errors.retention_amount_pct.message}</div>
              )}
            </div>
          </div>

          <div className={styles.twoColGrid} style={{ marginTop: 10 }}>
            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Call Out:</div>
              <select className={styles.cellInput} {...register("call_out")}>
                <option value="">Select...</option>
                {callOutOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.call_out?.message && <div className={styles.errText}>{errors.call_out.message}</div>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Asbestos Related?</div>
              <select className={styles.cellInput} {...register("asbestos_related")}>
                <option value="">Select...</option>
                {asbestosOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.asbestos_related?.message && (
                <div className={styles.errText}>{errors.asbestos_related.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* AP / INVOICE / PAYMENT */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Accounts Payable Information</div>

          <div className={styles.twoColGrid}>
            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Accounts Payable Contact:</div>
              <input className={styles.cellInput} {...register("ap_contact")} />
              {errors.ap_contact?.message && <div className={styles.errText}>{errors.ap_contact.message}</div>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Accounts Payable Phone:</div>
              <input className={styles.cellInput} {...register("ap_phone")} />
              {errors.ap_phone?.message && <div className={styles.errText}>{errors.ap_phone.message}</div>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Accounts Payable Email:</div>
              <input className={styles.cellInput} {...register("ap_email")} />
              {errors.ap_email?.message && <div className={styles.errText}>{errors.ap_email.message}</div>}
            </div>
          </div>

          <div className={styles.sectionTitle} style={{ marginTop: 12 }}>
            Invoice submission through E-mail or Portal
          </div>

          <div className={styles.twoColGrid}>
            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Submission Method:</div>
              <select className={styles.cellInput} {...register("invoice_submission_method")}>
                <option value="">Select...</option>
                {invoiceSubmissionMethods.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.invoice_submission_method?.message && (
                <div className={styles.errText}>{errors.invoice_submission_method.message}</div>
              )}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Portal Name:</div>
              <input className={styles.cellInput} disabled={invoiceMethod !== "Portal"} {...register("portal_name")} />
              {errors.portal_name?.message && <div className={styles.errText}>{errors.portal_name.message}</div>}
            </div>
          </div>

          <div className={styles.sectionTitle} style={{ marginTop: 12 }}>
            Payment Method
          </div>

          <div className={styles.twoColGrid}>
            <div className={styles.fieldRow}>
              <div className={styles.inlineLabel}>Method:</div>
              <select className={styles.cellInput} {...register("payment_method")}>
                <option value="">Select...</option>
                {paymentMethods.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.payment_method?.message && (
                <div className={styles.errText}>{errors.payment_method.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className={styles.attachments}>
          <div className={styles.attachTitle}>Required Attachments</div>

          <input
            ref={poRef}
            type="file"
            hidden
            onChange={(e) => setPoName(e.target.files?.[0]?.name ?? "")}
          />
          <input
            ref={estRef}
            type="file"
            hidden
            onChange={(e) => setProposalName(e.target.files?.[0]?.name ?? "")}
          />

          <div className={styles.attachRow}>
            <div className={styles.attachLabel}>Approved PO</div>
            <button type="button" className={styles.attachBtn} onClick={() => poRef.current?.click()}>
              Select File
            </button>
            <div className={styles.attachFile}>{poName || "No file selected"}</div>
          </div>

          <div className={styles.attachRow}>
            <div className={styles.attachLabel}>Proposal</div>
            <button type="button" className={styles.attachBtn} onClick={() => estRef.current?.click()}>
              Select File
            </button>
            <div className={styles.attachFile}>{proposalName || "No file selected"}</div>
          </div>
        </div>

        {/* Required comments box */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>Comments</div>

          <div className={styles.fieldRow}>
            <div className={styles.inlineLabel}>
              Please give job details/justification for proposal not being signed.
            </div>

            <textarea
              className={styles.cellInput}
              style={{ minHeight: 90 }}
              {...register("proposal_not_signed_justification")}
            />

            {errors.proposal_not_signed_justification?.message && (
              <div className={styles.errText}>{errors.proposal_not_signed_justification.message}</div>
            )}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? "Submitting..." : "Submit Job Setup Request"}
        </button>
      </form>
    </main>
  );
}

/* ---------- Components ---------- */

function TopCell({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.topCell}>
      <div className={styles.topLabel}>{label}</div>
      <div className={styles.topValue}>{value}</div>
    </div>
  );
}

function TopInputCell({
  label,
  input,
  error,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <div className={styles.topCell}>
      <div className={styles.topLabel}>{label}</div>
      {input}
      {error && <div className={styles.errText}>{error}</div>}
    </div>
  );
}

function SheetRow({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className={styles.sheetRow}>
      <div className={styles.sheetLabel}>{label}</div>
      <div className={styles.sheetValue}>
        {children}
        {error && <div className={styles.errText}>{error}</div>}
      </div>
    </div>
  );
}

function SheetRowInline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.inlineCell}>
      <div className={styles.inlineLabel}>{label}</div>
      {children}
    </div>
  );
}

