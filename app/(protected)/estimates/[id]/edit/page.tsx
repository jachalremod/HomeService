import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EstimateForm from "../../new/estimate-form";

type EditEstimatePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function EditEstimatePage({
  params,
  searchParams,
}: EditEstimatePageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const [
    { data: estimate },
    { data: customers },
    { data: business },
  ] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, estimate_items(*)")
      .eq("id", id)
      .order("sort_order", {
        referencedTable: "estimate_items",
        ascending: true,
      })
      .single(),
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

  if (!estimate) {
    notFound();
  }

  if (
    estimate.deleted_at ||
    !["draft", "sent"].includes(estimate.status)
  ) {
    redirect(
      `/estimates/${id}?message=Only+active+draft+or+sent+estimates+can+be+edited`,
    );
  }

  return (
    <>
      {message ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {message}
        </div>
      ) : null}

      <EstimateForm
        customers={customers ?? []}
        business={business}
        initialEstimate={{
          id: estimate.id,
          estimateNumber: estimate.estimate_number,
          customerId: estimate.customer_id,
          title: estimate.title,
          expiresAt: estimate.expires_at ?? "",
          taxRate: Number(estimate.tax_rate),
          notes: estimate.notes ?? "",
          terms: estimate.terms ?? "",
          showQuantity: estimate.show_quantity,
          showRate: estimate.show_rate,
          items: (estimate.estimate_items ?? []).map(
            (item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unit_price),
            }),
          ),
        }}
      />
    </>
  );
}
