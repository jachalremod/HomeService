"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function openCustomerCheckout(formData: FormData) {
  const result = z
    .object({
      token: z.uuid(),
      scheduleId: z.uuid(),
    })
    .safeParse({
      token: formData.get("token"),
      scheduleId: formData.get("scheduleId"),
    });

  if (!result.success) {
    redirect("/payment/cancelled");
  }

  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select(
      "id, user_id, organization_id, invoice_number, public_token, customers(first_name, last_name, email)",
    )
    .eq("public_token", result.data.token)
    .single();

  if (!invoice) {
    redirect("/payment/cancelled");
  }

  const { data: schedule } = await admin
    .from("payment_schedules")
    .select(
      "id, title, amount, stripe_checkout_url, stripe_checkout_expires_at",
    )
    .eq("id", result.data.scheduleId)
    .eq("invoice_id", invoice.id)
    .single();

  if (!schedule) {
    redirect(`/p/${result.data.token}?message=Payment+schedule+not+found`);
  }

  const { data: business } = await admin
    .from("business_profiles")
    .select("pass_processing_fee_to_customer, processing_fee_percentage")
    .eq("organization_id", invoice.organization_id)
    .maybeSingle();

  const { data: previousPayments } = await admin
    .from("payments")
    .select("amount")
    .eq("payment_schedule_id", schedule.id);

  const alreadyPaid = (previousPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const remainingAmount =
    Math.round((Number(schedule.amount) - alreadyPaid) * 100) / 100;

  if (remainingAmount <= 0) {
    redirect(`/p/${result.data.token}?message=This+payment+is+already+paid`);
  }

  const feePercentage = business?.pass_processing_fee_to_customer
    ? Number(business.processing_fee_percentage) || 0
    : 0;
  const feeAmount =
    feePercentage > 0
      ? Math.round(remainingAmount * (feePercentage / 100) * 100) / 100
      : 0;
  const chargeAmount = remainingAmount + feeAmount;

  const existingLinkIsValid =
    schedule.stripe_checkout_url &&
    schedule.stripe_checkout_expires_at &&
    new Date(schedule.stripe_checkout_expires_at).getTime() >
      Date.now() + 60000;

  if (existingLinkIsValid && schedule.stripe_checkout_url) {
    redirect(schedule.stripe_checkout_url);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const customer = invoice.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Customer";

  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description: string };
    };
  }> = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(remainingAmount * 100),
        product_data: {
          name: `${invoice.invoice_number} - ${schedule.title}`,
          description: `Scheduled payment for ${customerName}`,
        },
      },
    },
  ];

  if (feeAmount > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(feeAmount * 100),
        product_data: {
          name: "Card processing fee",
          description: `${feePercentage}% processing fee`,
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customer?.email ?? undefined,
    line_items: lineItems,
    metadata: {
      invoice_id: invoice.id,
      schedule_id: schedule.id,
      user_id: invoice.user_id,
      organization_id: invoice.organization_id,
      base_amount: String(remainingAmount),
      fee_amount: String(feeAmount),
    },
    payment_intent_data: {
      metadata: {
        invoice_id: invoice.id,
        schedule_id: schedule.id,
        user_id: invoice.user_id,
        organization_id: invoice.organization_id,
        base_amount: String(remainingAmount),
        fee_amount: String(feeAmount),
      },
    },
    success_url: `${appUrl}/p/${invoice.public_token}?payment=success`,
    cancel_url: `${appUrl}/p/${invoice.public_token}?payment=cancelled`,
  });

  if (!session.url) {
    redirect(
      `/p/${result.data.token}?message=Unable+to+open+the+payment+page`,
    );
  }

  await admin
    .from("payment_schedules")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
      stripe_checkout_expires_at: new Date(
        session.expires_at * 1000,
      ).toISOString(),
    })
    .eq("id", schedule.id);

  redirect(session.url);
}