"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const estimateSchema = z.object({
  customerId: z.uuid(),
  title: z.string().trim().min(1),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim(),
  terms: z.string().trim(),
  expiresAt: z.union([z.literal(""), z.iso.date()]),
  showQuantity: z.boolean(),
  showRate: z.boolean(),
});

const itemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
});

export async function createEstimate(formData: FormData) {
  const estimateResult = estimateSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    taxRate: formData.get("taxRate"),
    notes: formData.get("notes"),
    terms: formData.get("terms"),
    expiresAt: formData.get("expiresAt"),
    showQuantity: formData.get("showQuantity") === "on",
    showRate: formData.get("showRate") === "on",
  });

  let rawItems: unknown;

  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    redirect("/estimates/new?message=The+estimate+items+are+invalid");
  }

  const itemsResult = z.array(itemSchema).min(1).safeParse(rawItems);

  if (!estimateResult.success || !itemsResult.success) {
    redirect("/estimates/new?message=Complete+all+required+estimate+fields");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = itemsResult.data.map((item, index) => ({
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
    sortOrder: index,
  }));

  const subtotal =
    Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  const taxRate = estimateResult.data.taxRate;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const {
    data: nextEstimateNumber,
    error: estimateNumberError,
  } = await supabase.rpc("next_document_number", {
    p_document_type: "estimate",
  });

  if (
    estimateNumberError ||
    nextEstimateNumber === null
  ) {
    redirect(
      `/estimates/new?message=${encodeURIComponent(
        estimateNumberError?.message ??
          "Unable to assign estimate number",
      )}`,
    );
  }

  const estimateNumber = String(nextEstimateNumber);

  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .insert({
      user_id: user.id,
      customer_id: estimateResult.data.customerId,
      estimate_number: estimateNumber,
      title: estimateResult.data.title,
      description: null,
      tax_rate: taxRate,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes: estimateResult.data.notes || null,
      terms: estimateResult.data.terms || null,
      expires_at: estimateResult.data.expiresAt || null,
      show_quantity: estimateResult.data.showQuantity,
      show_rate: estimateResult.data.showRate,
      status: "draft",
    })
    .select("id")
    .single();

  if (estimateError || !estimate) {
    redirect(
      `/estimates/new?message=${encodeURIComponent(
        estimateError?.message ?? "Unable to create estimate",
      )}`,
    );
  }

  const { error: itemsError } = await supabase.from("estimate_items").insert(
    items.map((item) => ({
      user_id: user.id,
      estimate_id: estimate.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.amount,
      sort_order: item.sortOrder,
    })),
  );

  if (itemsError) {
    await supabase.from("estimates").delete().eq("id", estimate.id);

    redirect(
      `/estimates/new?message=${encodeURIComponent(itemsError.message)}`,
    );
  }

  redirect("/estimates?message=Estimate+created+successfully");
}

export async function deleteEstimate(estimateId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingInvoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .select("id")
      .eq("estimate_id", estimateId)
      .maybeSingle();

  if (invoiceError) {
    redirect(
      `/estimates?message=${encodeURIComponent(
        invoiceError.message,
      )}`,
    );
  }

  if (existingInvoice) {
    redirect(
      "/estimates?message=This+estimate+cannot+be+deleted+because+it+has+an+invoice",
    );
  }

  const { error } = await supabase
    .from("estimates")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", estimateId)
    .is("deleted_at", null);

  if (error) {
    redirect(
      `/estimates?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/estimates");

  redirect(
    "/estimates/deleted?message=Estimate+moved+to+Deleted",
  );
}

export async function restoreEstimate(estimateId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: estimate, error } = await supabase
    .from("estimates")
    .update({
      deleted_at: null,
    })
    .eq("id", estimateId)
    .not("deleted_at", "is", null)
    .select("status, expires_at")
    .single();

  if (error || !estimate) {
    redirect(
      `/estimates/deleted?message=${encodeURIComponent(
        error?.message ?? "Unable to restore estimate",
      )}`,
    );
  }

  let destination: string = estimate.status;

  if (estimate.status === "approved") {
    destination = "accepted";
  }

  if (
    (estimate.status === "draft" ||
      estimate.status === "sent") &&
    estimate.expires_at &&
    estimate.expires_at <
      new Date().toISOString().slice(0, 10)
  ) {
    destination = "expired";
  }

  revalidatePath("/estimates");

  redirect(
    `/estimates/${destination}?message=Estimate+restored`,
  );
}

export async function updateEstimate(
  estimateId: string,
  formData: FormData,
) {
  const idResult = z.uuid().safeParse(estimateId);

  const estimateResult = estimateSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    taxRate: formData.get("taxRate"),
    notes: formData.get("notes"),
    terms: formData.get("terms"),
    expiresAt: formData.get("expiresAt"),
    showQuantity: formData.get("showQuantity") === "on",
    showRate: formData.get("showRate") === "on",
  });

  let rawItems: unknown;

  try {
    rawItems = JSON.parse(
      String(formData.get("items") ?? "[]"),
    );
  } catch {
    redirect(
      `/estimates/${estimateId}/edit?message=The+estimate+items+are+invalid`,
    );
  }

  const itemsResult = z
    .array(itemSchema)
    .min(1)
    .safeParse(rawItems);

  if (
    !idResult.success ||
    !estimateResult.success ||
    !itemsResult.success
  ) {
    redirect(
      `/estimates/${estimateId}/edit?message=Complete+all+required+estimate+fields`,
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = itemsResult.data.map((item, index) => ({
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount:
      Math.round(item.quantity * item.unitPrice * 100) /
      100,
    sortOrder: index,
  }));

  const subtotal =
    Math.round(
      items.reduce(
        (sum, item) => sum + item.amount,
        0,
      ) * 100,
    ) / 100;

  const taxRate = estimateResult.data.taxRate;
  const taxAmount =
    Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total =
    Math.round((subtotal + taxAmount) * 100) / 100;

  const { data: updatedEstimate, error: estimateError } =
    await supabase
      .from("estimates")
      .update({
        customer_id: estimateResult.data.customerId,
        title: estimateResult.data.title,
        description: null,
        expires_at:
          estimateResult.data.expiresAt || null,
        tax_rate: taxRate,
        subtotal,
        tax_amount: taxAmount,
        total,
        notes: estimateResult.data.notes || null,
        terms: estimateResult.data.terms || null,
        show_quantity: estimateResult.data.showQuantity,
        show_rate: estimateResult.data.showRate,
        status: "draft",
      })
      .eq("id", idResult.data)
      .in("status", ["draft", "sent"])
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

  if (estimateError || !updatedEstimate) {
    redirect(
      `/estimates/${idResult.data}/edit?message=${encodeURIComponent(
        estimateError?.message ??
          "Only active draft or sent estimates can be edited",
      )}`,
    );
  }

  const { error: deleteItemsError } = await supabase
    .from("estimate_items")
    .delete()
    .eq("estimate_id", idResult.data);

  if (deleteItemsError) {
    redirect(
      `/estimates/${idResult.data}/edit?message=${encodeURIComponent(
        deleteItemsError.message,
      )}`,
    );
  }

  const { error: itemsError } = await supabase
    .from("estimate_items")
    .insert(
      items.map((item) => ({
        user_id: user.id,
        estimate_id: idResult.data,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount,
        sort_order: item.sortOrder,
      })),
    );

  if (itemsError) {
    redirect(
      `/estimates/${idResult.data}/edit?message=${encodeURIComponent(
        itemsError.message,
      )}`,
    );
  }

  revalidatePath(`/estimates/${idResult.data}`);
  revalidatePath("/estimates");

  redirect(
    `/estimates/${idResult.data}?message=Estimate+updated`,
  );
}
