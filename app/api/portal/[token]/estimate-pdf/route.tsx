import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import EstimatePdfDocument, {
  type EstimatePdfData,
} from "@/lib/pdf/estimate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function safeFilename(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const { token } = await context.params;
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select(
      "organization_id, estimates(*, estimate_items(*)), customers(*)",
    )
    .eq("public_token", token)
    .single();

  if (
    !invoice ||
    !invoice.estimates ||
    !invoice.customers
  ) {
    return new Response("PDF not found", { status: 404 });
  }

  const estimate = invoice.estimates;
  const customer = invoice.customers;

  const { data: business } = await admin
    .from("business_profiles")
    .select("*")
    .eq("organization_id", invoice.organization_id)
    .maybeSingle();

  const customerName =
    `${customer.first_name} ${customer.last_name}`.trim();

  const items = [...(estimate.estimate_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const pdfData: EstimatePdfData = {
    company: {
      name:
        business?.company_name ??
        "ServiceAxiom Contractor",
      phone: business?.phone ?? "",
      email: business?.email ?? "",
      licenseNumber: business?.license_number ?? "",
      address: [
        business?.address,
        [
          business?.city,
          business?.state,
          business?.postal_code,
        ]
          .filter(Boolean)
          .join(", "),
      ].filter((value): value is string => Boolean(value)),
      logoUrl: business?.logo_url ?? null,
    },
    customer: {
      name: customerName,
      email: customer.email ?? "",
      address: [
        customer.project_address,
        [
          customer.city,
          customer.state,
          customer.postal_code,
        ]
          .filter(Boolean)
          .join(", "),
      ].filter((value): value is string => Boolean(value)),
    },
    estimate: {
      number: estimate.estimate_number,
      title: estimate.title,
      status: estimate.status,
      createdAt: estimate.created_at,
      expiresAt: estimate.expires_at,
      subtotal: Number(estimate.subtotal),
      taxRate: Number(estimate.tax_rate),
      taxAmount: Number(estimate.tax_amount),
      total: Number(estimate.total),
      notes: estimate.notes ?? "",
      terms:
        estimate.terms ??
        business?.default_terms ??
        "",
      showQuantity: estimate.show_quantity,
      showRate: estimate.show_rate,
      paymentSchedule: estimate.payment_schedule ?? [],
    },
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      scope: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      amount: Number(item.amount),
    })),
  };

  const pdfBuffer = await renderToBuffer(
    <EstimatePdfDocument data={pdfData} />,
  );

  const url = new URL(request.url);
  const disposition =
    url.searchParams.get("download") === "1"
      ? "attachment"
      : "inline";

  const filename = [
    "Estimate",
    safeFilename(estimate.estimate_number),
    safeFilename(customerName),
  ]
    .filter(Boolean)
    .join("-");

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `${disposition}; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
