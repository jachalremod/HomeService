import Link from "next/link";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveDocumentSettings } from "./actions";

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
      "estimate_contract_template, default_terms, payment_instructions",
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Estimate contract template
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This contract is automatically placed into every new estimate.
            It can still be edited before an individual estimate is saved.
          </p>

          <label
            htmlFor="estimateContractTemplate"
            className="mt-5 block text-sm font-semibold text-slate-700"
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
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Invoice defaults
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Set the terms and payment instructions used on new invoices.
          </p>

          <label
            htmlFor="defaultTerms"
            className="mt-5 block text-sm font-semibold text-slate-700"
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
        </section>

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
