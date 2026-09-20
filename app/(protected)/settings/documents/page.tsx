import Link from "next/link";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveDocumentSettings } from "./actions";
import PaymentScheduleTiersEditor from "./payment-schedule-tiers-editor";
import SettingsTile from "./settings-tile";

type DocumentSettingsPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function DocumentSettingsPage({
  searchParams,
}: DocumentSettingsPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select(
      "estimate_contract_template, default_terms, payment_instructions, payment_schedule_tiers, auto_generate_invoice_on_approval, estimate_email_subject, estimate_email_body, invoice_email_subject, invoice_email_body",
    )
    .maybeSingle();

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  return (
    <>
      <div className="mb-8">
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to settings
        </Link>

        <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <FileText size={24} />
        </div>

        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Document settings
        </h1>
        <p className="mt-2 text-slate-600">
          Manage defaults used when creating customer documents.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <form action={saveDocumentSettings} className="space-y-6">
        <SettingsTile
          title="Estimate contract template"
          description="Automatically placed into every new estimate. Can still be edited per estimate."
        >
          <label
            htmlFor="estimateContractTemplate"
            className="block text-sm font-semibold text-slate-700"
          >
            Default estimate contract
          </label>
          <textarea
            id="estimateContractTemplate"
            name="estimateContractTemplate"
            rows={14}
            defaultValue={profile?.estimate_contract_template ?? ""}
            placeholder="Enter the contract terms that should appear on every new estimate"
            className={`mt-2 min-h-80 resize-y whitespace-pre-wrap ${inputClass}`}
          />
          <p className="mt-2 text-xs text-slate-500">
            Updates apply only to new estimates. Existing estimates retain
            their saved contract.
          </p>
        </SettingsTile>

        <SettingsTile
          title="Invoice defaults"
          description="Terms, payment instructions, and auto-invoice behavior for new invoices."
        >
          <label
            htmlFor="defaultTerms"
            className="block text-sm font-semibold text-slate-700"
          >
            Default terms and conditions
          </label>
          <textarea
            id="defaultTerms"
            name="defaultTerms"
            rows={6}
            defaultValue={profile?.default_terms ?? ""}
            placeholder="Default invoice terms and conditions"
            className={`mt-2 resize-y whitespace-pre-wrap ${inputClass}`}
          />

          <label
            htmlFor="paymentInstructions"
            className="mt-5 block text-sm font-semibold text-slate-700"
          >
            Payment instructions
          </label>
          <textarea
            id="paymentInstructions"
            name="paymentInstructions"
            rows={5}
            defaultValue={profile?.payment_instructions ?? ""}
            placeholder="Explain how and where customers should submit payment"
            className={`mt-2 resize-y whitespace-pre-wrap ${inputClass}`}
          />

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              name="autoGenerateInvoiceOnApproval"
              defaultChecked={profile?.auto_generate_invoice_on_approval ?? false}
              className="mt-0.5 size-4 accent-blue-600"
            />
            <span>
              <span className="block font-semibold text-slate-800">
                Auto-create and send an invoice on approval
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Uses the estimate's payment schedule and emails the customer a payment link right away.
              </span>
            </span>
          </label>
        </SettingsTile>

        <SettingsTile
          title="Payment schedule tiers"
          description="Automatically apply a different payment schedule based on the estimate's total."
        >
          <PaymentScheduleTiersEditor
            initialTiers={profile?.payment_schedule_tiers ?? []}
          />
        </SettingsTile>

        <SettingsTile
          title="Email message templates"
          description="Customize the subject and message sent when estimates and invoices go to customers."
        >
          <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Available placeholders: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">{"{{customerName}}"}</code>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">{"{{companyName}}"}</code>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">{"{{documentNumber}}"}</code>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">{"{{link}}"}</code>
          </div>

          <h3 className="text-sm font-bold text-slate-900">Estimate email</h3>
          <label htmlFor="estimateEmailSubject" className="mt-3 block text-sm font-semibold text-slate-700">
            Subject
          </label>
          <input
            id="estimateEmailSubject"
            name="estimateEmailSubject"
            defaultValue={profile?.estimate_email_subject ?? ""}
            placeholder="Estimate {{documentNumber}} from {{companyName}}"
            className={`mt-2 ${inputClass}`}
          />
          <label htmlFor="estimateEmailBody" className="mt-4 block text-sm font-semibold text-slate-700">
            Message
          </label>
          <textarea
            id="estimateEmailBody"
            name="estimateEmailBody"
            rows={6}
            defaultValue={profile?.estimate_email_body ?? ""}
            placeholder={"Hello {{customerName}},\n\nPlease review your estimate:\n{{link}}\n\nThank you."}
            className={`mt-2 resize-y whitespace-pre-wrap ${inputClass}`}
          />

          <h3 className="mt-6 text-sm font-bold text-slate-900">Invoice email</h3>
          <label htmlFor="invoiceEmailSubject" className="mt-3 block text-sm font-semibold text-slate-700">
            Subject
          </label>
          <input
            id="invoiceEmailSubject"
            name="invoiceEmailSubject"
            defaultValue={profile?.invoice_email_subject ?? ""}
            placeholder="Invoice {{documentNumber}} from {{companyName}}"
            className={`mt-2 ${inputClass}`}
          />
          <label htmlFor="invoiceEmailBody" className="mt-4 block text-sm font-semibold text-slate-700">
            Message
          </label>
          <textarea
            id="invoiceEmailBody"
            name="invoiceEmailBody"
            rows={6}
            defaultValue={profile?.invoice_email_body ?? ""}
            placeholder={"Hello {{customerName}},\n\nThank you for approving your estimate. Your invoice and payment options are ready:\n{{link}}\n\nThank you."}
            className={`mt-2 resize-y whitespace-pre-wrap ${inputClass}`}
          />
        </SettingsTile>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <Save size={18} />
          Save document settings
        </button>
      </form>
    </>
  );
}