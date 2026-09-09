"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentSettingsSchema = z.object({
  estimateContractTemplate: z.string().trim(),
  defaultTerms: z.string().trim(),
  paymentInstructions: z.string().trim(),
});

export async function saveDocumentSettings(formData: FormData) {
  const result = documentSettingsSchema.safeParse({
    estimateContractTemplate: formData.get("estimateContractTemplate"),
    defaultTerms: formData.get("defaultTerms"),
    paymentInstructions: formData.get("paymentInstructions"),
  });

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

  const { error } = await supabase
    .from("business_profiles")
    .update({
      estimate_contract_template:
        result.data.estimateContractTemplate || null,
      default_terms: result.data.defaultTerms || null,
      payment_instructions:
        result.data.paymentInstructions || null,
    });

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
