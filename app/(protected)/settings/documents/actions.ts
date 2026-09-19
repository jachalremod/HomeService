"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSettingsSchema = z.object({
  estimateContractTemplate: z.string().trim(),
  defaultTerms: z.string().trim(),
  paymentInstructions: z.string().trim(),
  defaultPaymentSchedule: z.string().trim(),
});

export async function saveDocumentSettings(formData: FormData) {
    const result = documentSettingsSchema.safeParse({
    estimateContractTemplate: formData.get("estimateContractTemplate"),
    defaultTerms: formData.get("defaultTerms"),
    paymentInstructions: formData.get("paymentInstructions"),
    defaultPaymentSchedule: formData.get("defaultPaymentSchedule"),
  });

  let parsedSchedule: unknown = [];
  try {
    parsedSchedule = JSON.parse(result.data?.defaultPaymentSchedule || "[]");
  } catch {}

  if (!result.success) {
    redirect("/settings/documents?message=Unable+to+save+document+settings");
  }

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
      default_payment_schedule: Array.isArray(parsedSchedule) && parsedSchedule.length > 0 ? parsedSchedule : null,
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
