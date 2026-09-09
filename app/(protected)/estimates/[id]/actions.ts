"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

export async function markEstimateSent(formData: FormData) {
  const result = idSchema.safeParse(formData.get("estimateId"));

  if (!result.success) {
    redirect("/estimates?message=Invalid+estimate");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("estimates")
    .update({ status: "sent" })
    .eq("id", result.data)
    .in("status", ["draft", "sent"]);

  if (error) {
    redirect(
      `/estimates/${result.data}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/estimates/${result.data}`);
  revalidatePath("/estimates");
  redirect(`/estimates/${result.data}?message=Estimate+marked+as+sent`);
}

export async function approveEstimate(formData: FormData) {
  const result = idSchema.safeParse(formData.get("estimateId"));

  if (!result.success) {
    redirect("/estimates?message=Invalid+estimate");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("estimates")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", result.data)
    .in("status", ["draft", "sent"]);

  if (error) {
    redirect(
      `/estimates/${result.data}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/estimates/${result.data}`);
  revalidatePath("/estimates");

  redirect(
    `/estimates/${result.data}?message=Estimate+approved.+It+is+ready+for+invoicing.`,
  );
}

export async function duplicateEstimate(formData: FormData) {
  const result = idSchema.safeParse(
    formData.get("estimateId"),
  );

  if (!result.success) {
    redirect("/estimates?message=Invalid+estimate");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: original, error: originalError } =
    await supabase
      .from("estimates")
      .select("*, estimate_items(*)")
      .eq("id", result.data)
      .is("deleted_at", null)
      .order("sort_order", {
        referencedTable: "estimate_items",
        ascending: true,
      })
      .single();

  if (originalError || !original) {
    redirect(
      `/estimates/${result.data}?message=Unable+to+duplicate+estimate`,
    );
  }

  const { data: nextNumber, error: numberError } =
    await supabase.rpc("next_document_number", {
      p_document_type: "estimate",
    });

  if (numberError || nextNumber === null) {
    redirect(
      `/estimates/${result.data}?message=${encodeURIComponent(
        numberError?.message ??
          "Unable to assign estimate number",
      )}`,
    );
  }

  const { data: duplicate, error: duplicateError } =
    await supabase
      .from("estimates")
      .insert({
        user_id: user.id,
        customer_id: original.customer_id,
        estimate_number: String(nextNumber),
        title: `${original.title} (Copy)`,
        description: null,
        status: "draft",
        expires_at: original.expires_at,
        subtotal: original.subtotal,
        tax_rate: original.tax_rate,
        tax_amount: original.tax_amount,
        total: original.total,
        notes: original.notes,
        terms: original.terms,
        approved_at: null,
        deleted_at: null,
      })
      .select("id")
      .single();

  if (duplicateError || !duplicate) {
    redirect(
      `/estimates/${result.data}?message=${encodeURIComponent(
        duplicateError?.message ??
          "Unable to duplicate estimate",
      )}`,
    );
  }

  const originalItems = original.estimate_items ?? [];

  if (originalItems.length) {
    const { error: itemsError } = await supabase
      .from("estimate_items")
      .insert(
        originalItems.map((item, index) => ({
          user_id: user.id,
          estimate_id: duplicate.id,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: index,
        })),
      );

    if (itemsError) {
      await supabase
        .from("estimates")
        .delete()
        .eq("id", duplicate.id);

      redirect(
        `/estimates/${result.data}?message=${encodeURIComponent(
          itemsError.message,
        )}`,
      );
    }
  }

  revalidatePath("/estimates");

  redirect(
    `/estimates/${duplicate.id}?message=Estimate+duplicated+as+a+new+draft`,
  );
}

export async function updateEstimateDisplayOptions(
  formData: FormData,
) {
  const estimateId = idSchema.safeParse(
    formData.get("estimateId"),
  );

  if (!estimateId.success) {
    redirect("/estimates?message=Invalid+estimate");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("estimates")
    .update({
      show_quantity:
        formData.get("showQuantity") === "on",
      show_rate:
        formData.get("showRate") === "on",
    })
    .eq("id", estimateId.data)
    .is("deleted_at", null);

  if (error) {
    redirect(
      `/estimates/${estimateId.data}?message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/estimates/${estimateId.data}`);

  redirect(
    `/estimates/${estimateId.data}?message=Document+display+options+updated`,
  );
}