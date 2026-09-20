"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSettingsSchema = z.object({
  estimateContractTemplate: z.string().trim(),
  defaultTerms: z.string().trim(),
  paymentInstructions: z.string().trim(),
  paymentScheduleTiers: z.string().trim(),
  autoGenerateInvoiceOnApproval: z.boolean(),
  estimateEmailSubject: z.string().trim(),
  estimateEmailBody: z.string().trim(),
  invoiceEmailSubject: z.string().trim(),
  invoiceEmailBody: z.string().trim(),
});

export async function saveDocumentSettings(formData: FormData) {
  const result = documentSettingsSchema.safeParse({
    estimateContractTemplate: formData.get("estimateContractTemplate"),
    defaultTerms: formData.get("defaultTerms"),
    paymentInstructions: formData.get("paymentInstructions"),
    paymentScheduleTiers: formData.get("paymentScheduleTiers"),
    autoGenerateInvoiceOnApproval: formData.get("autoGenerateInvoiceOnApproval") === "on",
    estimateEmailSubject: formData.get("estimateEmailSubject"),
    estimateEmailBody: formData.get("estimateEmailBody"),
    invoiceEmailSubject: formData.get("invoiceEmailSubject"),
    invoiceEmailBody: formData.get("invoiceEmailBody"),
  });

  if (!result.success) {
    redirect("/settings/documents?message=Unable+to+save+document+settings");
  }

  let parsedTiers: unknown = [];
  try {
    parsedTiers = JSON.parse(result.data.paymentScheduleTiers || "[]");
  } catch {}

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organizationId } = await supabase.rpc("current_organization_id");

  const { error } = await supabase
    .from("business_profiles")
    .update({
      estimate_contract_template:
        result.data.estimateContractTemplate || null,
      default_terms: result.data.defaultTerms || null,
      payment_instructions:
        result.data.paymentInstructions || null,
      payment_schedule_tiers: Array.isArray(parsedTiers) && parsedTiers.length > 0 ? parsedTiers : null,
      auto_generate_invoice_on_approval: result.data.autoGenerateInvoiceOnApproval,
      estimate_email_subject: result.data.estimateEmailSubject || null,
      estimate_email_body: result.data.estimateEmailBody || null,
      invoice_email_subject: result.data.invoiceEmailSubject || null,
      invoice_email_body: result.data.invoiceEmailBody || null,
    })
    .eq("organization_id", organizationId);

  if (error) {
    redirect(
      `/settings/documents?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/settings/documents");
  revalidatePath("/estimates/new");
  revalidatePath("/invoices");

  redirect(
    "/settings/documents?message=Document+settings+saved",
  );
}