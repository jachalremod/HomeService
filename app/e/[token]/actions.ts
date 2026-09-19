"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const approveSchema = z.object({
  token: z.string().min(1),
  signature: z.string().min(1),
  signedName: z.string().trim().min(1),
});

export async function approveEstimateWithSignature(formData: FormData) {
  const result = approveSchema.safeParse({
    token: formData.get("token"),
    signature: formData.get("signature"),
    signedName: formData.get("signedName"),
  });

  if (!result.success) {
    redirect(
      `/e/${formData.get("token")}?message=Please+sign+before+approving`,
    );
  }

  const admin = createAdminClient();

  const { data: estimate } = await admin
    .from("estimates")
    .select("id, status")
    .eq("public_token", result.data.token)
    .is("deleted_at", null)
    .single();

  if (!estimate || (estimate.status !== "draft" && estimate.status !== "sent")) {
    redirect(
      `/e/${result.data.token}?message=This+estimate+can+no+longer+be+approved`,
    );
  }

  const { error } = await admin
    .from("estimates")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      customer_signature: result.data.signature,
      customer_signed_at: new Date().toISOString(),
      customer_signed_name: result.data.signedName,
    })
    .eq("id", estimate.id);

  if (error) {
    redirect(
      `/e/${result.data.token}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/e/${result.data.token}`);
  redirect(`/e/${result.data.token}?message=Estimate+approved.+Thank+you!`);
}

export async function declineEstimatePublic(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  const admin = createAdminClient();

  const { data: estimate } = await admin
    .from("estimates")
    .select("id, status")
    .eq("public_token", token)
    .is("deleted_at", null)
    .single();

  if (!estimate || (estimate.status !== "draft" && estimate.status !== "sent")) {
    redirect(`/e/${token}?message=This+estimate+can+no+longer+be+updated`);
  }

  const { error } = await admin
    .from("estimates")
    .update({ status: "declined" })
    .eq("id", estimate.id);

  if (error) {
    redirect(`/e/${token}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/e/${token}`);
  redirect(`/e/${token}?message=Estimate+declined`);
}