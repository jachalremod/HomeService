"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const approveSchema = z.object({
  token: z.string().min(1),
  signature: z.string().min(1),
  signedName: z.string().trim().min(1),
});

async function autoGenerateInvoice(
  admin: ReturnType<typeof createAdminClient>,
  estimateId: string,
) {
  const { data: estimate } = await admin
    .from("estimates")
    .select(
      "id, user_id, organization_id, customer_id, title, description, total, payment_schedule, customers(first_name, email)",
    )
    .eq("id", estimateId)
    .single();

  if (!estimate) return false;

  const { data: business } = await admin
    .from("business_profiles")
    .select("company_name, email")
    .eq("organization_id", estimate.organization_id)
    .maybeSingle();

  const { data: existingInvoice } = await admin
    .from("invoices")
    .select("id")
    .eq("estimate_id", estimate.id)
    .maybeSingle();

  if (existingInvoice) return false;

  const { data: nextInvoiceNumber } = await admin.rpc(
    "next_document_number_for_org",
    {
      p_user_id: estimate.user_id,
      p_organization_id: estimate.organization_id,
      p_document_type: "invoice",
    },
  );

  if (nextInvoiceNumber === null || nextInvoiceNumber === undefined) return false;

  const invoiceNumber = String(nextInvoiceNumber);

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .insert({
      user_id: estimate.user_id,
      organization_id: estimate.organization_id,
      customer_id: estimate.customer_id,
      estimate_id: estimate.id,
      invoice_number: invoiceNumber,
      status: "sent",
      issued_at: new Date().toISOString(),
      subtotal: estimate.total,
      tax_amount: 0,
      total: estimate.total,
    })
    .select("id, public_token")
    .single();

  if (invoiceError || !invoice) return false;

  const invoiceTotal = Number(estimate.total);
  const schedule =
    Array.isArray(estimate.payment_schedule) && estimate.payment_schedule.length > 0
      ? estimate.payment_schedule
      : [{ title: "Full payment", percentage: 100 }];

  let allocatedAmount = 0;
  const scheduleRows = schedule.map(
    (item: { title: string; percentage: number }, index: number, all: unknown[]) => {
      const isLast = index === all.length - 1;
      const calculatedAmount =
        Math.round(invoiceTotal * (item.percentage / 100) * 100) / 100;
      const amount = isLast
        ? Math.round((invoiceTotal - allocatedAmount) * 100) / 100
        : calculatedAmount;
      allocatedAmount += amount;

      return {
        user_id: estimate.user_id,
        organization_id: estimate.organization_id,
        invoice_id: invoice.id,
        title: item.title,
        sequence: index + 1,
        percentage: item.percentage,
        amount,
        status: index === 0 ? ("due" as const) : ("upcoming" as const),
      };
    },
  );

  await admin.from("payment_schedules").insert(scheduleRows);

  const jobNumber = `JOB-${randomUUID().slice(0, 8).toUpperCase()}`;
  await admin.from("jobs").insert({
    user_id: estimate.user_id,
    organization_id: estimate.organization_id,
    customer_id: estimate.customer_id,
    estimate_id: estimate.id,
    invoice_id: invoice.id,
    job_number: jobNumber,
    title: estimate.title,
    description: estimate.description,
    status: "scheduled",
  });

  const customerEmail = estimate.customers?.email;
  if (customerEmail && invoice.public_token) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const companyName = business?.company_name ?? "your contractor";
    const link = `${appUrl}/p/${invoice.public_token}`;

    try {
      const { resend } = await import("@/lib/resend");
      await resend.emails.send({
        from: `${companyName} <onboarding@resend.dev>`,
        to: customerEmail,
        replyTo: business?.email || undefined,
        subject: `Invoice ${invoiceNumber} from ${companyName}`,
        html: `<p>Hello ${estimate.customers?.first_name ?? ""},</p><p>Thank you for approving your estimate. Your invoice and payment options are ready:</p><p><a href="${link}">${link}</a></p><p>Thank you.</p>`,
      });
    } catch {}
  }

  return true;
}

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
    .select("id, organization_id, status")
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

  const { data: business } = await admin
    .from("business_profiles")
    .select("auto_generate_invoice_on_approval")
    .eq("organization_id", estimate.organization_id)
    .maybeSingle();

  let invoiceCreated = false;
  if (business?.auto_generate_invoice_on_approval) {
    invoiceCreated = await autoGenerateInvoice(admin, estimate.id);
  }

  revalidatePath(`/e/${result.data.token}`);

  const message = invoiceCreated
    ? "Thank you for your approval! You will receive your invoice along with payment options shortly."
    : "Estimate approved. Thank you!";

  redirect(`/e/${result.data.token}?message=${encodeURIComponent(message)}`);
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