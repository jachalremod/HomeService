import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EstimateForm from "./estimate-form";

type NewEstimatePageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function NewEstimatePage({
  searchParams,
}: NewEstimatePageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: business }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, first_name, last_name, email, project_address, city, state, postal_code",
      )
      .order("last_name"),
    supabase
      .from("business_profiles")
      .select(
        "company_name, phone, email, license_number, logo_url, default_terms",
      )
      .maybeSingle(),
  ]);

  return (
    <>
      {message ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {message}
        </div>
      ) : null}

      {!customers?.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-950">
            Create a customer before creating an estimate.
          </p>
          <Link
            href="/customers"
            className="mt-4 inline-block rounded-xl bg-amber-900 px-4 py-2 font-semibold text-white"
          >
            Go to customers
          </Link>
        </div>
      ) : (
        <EstimateForm customers={customers} business={business} />
      )}
    </>
  );
}
