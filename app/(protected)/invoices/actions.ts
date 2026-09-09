"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const invoiceSchema = z.object({
  estimateId: z.uuid(),
  schedules: z.array(
    z.object({
      title: z.string().trim().min(1),
      percentage: z.coerce.number().positive().max(100),
      dueEvent: z.string().trim(),
    }),
  ).min(1),
});

export async function createInvoice(formData: FormData) {
  let schedules: unknown;

  try {
    schedules = JSON.parse(String(formData.get("schedules") ?? "[]"));
  } catch {
    redirect("/invoices?message=Invalid+payment+schedule");
  }

  const result = invoiceSchema.safeParse({
    estimateId: formData.get("estimateId"),
    schedules,
  });

  if (!result.success) {
    redirect("/invoices?message=Complete+the+payment+schedule");
  }

  const percentageTotal = result.data.schedules.reduce(
    (sum, schedule) => sum + schedule.percentage,
    0,
  );

  if (Math.abs(percentageTotal - 100) > 0.001) {
    redirect("/invoices?message=Payment+schedule+must+equal+100+percent");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", result.data.estimateId)
    .eq("status", "approved")
    .single();

  if (estimateError || !estimate) {
    redirect("/invoices?message=Only+approved+estimates+can+be+invoiced");
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("estimate_id", estimate.id)
    .maybeSingle();

  if (existingInvoice) {
    redirect("/invoices?message=This+estimate+already+has+an+invoice");
  }

  const {
    data: nextInvoiceNumber,
    error: invoiceNumberError,
  } = await supabase.rpc("next_document_number", {
    p_document_type: "invoice",
  });

  if (
    invoiceNumberError ||
    nextInvoiceNumber === null
  ) {
    redirect(
      `/invoices?message=${encodeURIComponent(
        invoiceNumberError?.message ??
          "Unable to assign invoice number",
      )}`,
    );
  }

  const invoiceNumber = String(nextInvoiceNumber);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      customer_id: estimate.customer_id,
      estimate_id: estimate.id,
      invoice_number: invoiceNumber,
      status: "draft",
      subtotal: estimate.subtotal,
      tax_amount: estimate.tax_amount,
      total: estimate.total,
      notes: estimate.notes,
      terms: estimate.terms,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    redirect(
      `/invoices?message=${encodeURIComponent(
        invoiceError?.message ?? "Unable to create invoice",
      )}`,
    );
  }

  const invoiceTotal = Number(estimate.total);
  let allocatedAmount = 0;

  const scheduleRows = result.data.schedules.map((schedule, index, all) => {
    const isLast = index === all.length - 1;
    const calculatedAmount =
      Math.round(invoiceTotal * (schedule.percentage / 100) * 100) / 100;

    const amount = isLast
      ? Math.round((invoiceTotal - allocatedAmount) * 100) / 100
      : calculatedAmount;

    allocatedAmount += amount;

    return {
      user_id: user.id,
      invoice_id: invoice.id,
      title: schedule.title,
      sequence: index + 1,
      percentage: schedule.percentage,
      amount,
      due_event: schedule.dueEvent || null,
      status: index === 0 ? ("due" as const) : ("upcoming" as const),
    };
  });

  const { error: scheduleError } = await supabase
    .from("payment_schedules")
    .insert(scheduleRows);

  if (scheduleError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);

    redirect(
      `/invoices?message=${encodeURIComponent(scheduleError.message)}`,
    );
  }

  redirect("/invoices?message=Invoice+and+payment+schedule+created");
}


