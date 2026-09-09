import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook configuration is missing" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const scheduleId = session.metadata?.schedule_id;
  const invoiceId = session.metadata?.invoice_id;

  if (!scheduleId || !invoiceId || !session.amount_total) {
    return NextResponse.json(
      { error: "Stripe payment metadata is incomplete" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({
      received: true,
      duplicate: true,
    });
  }

  const { data: schedule, error: scheduleError } = await admin
    .from("payment_schedules")
    .select("id, user_id, organization_id, invoice_id, amount")
    .eq("id", scheduleId)
    .eq("invoice_id", invoiceId)
    .single();

  if (scheduleError || !schedule) {
    return NextResponse.json(
      { error: "Payment schedule was not found" },
      { status: 404 },
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const paidAmount = session.amount_total / 100;

  const { error: insertError } = await admin.from("payments").insert({
    user_id: schedule.user_id,
    organization_id: schedule.organization_id,
    invoice_id: schedule.invoice_id,
    payment_schedule_id: schedule.id,
    amount: paidAmount,
    payment_method: "card",
    provider: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    reference_number: paymentIntentId,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  const { data: schedulePayments } = await admin
    .from("payments")
    .select("amount")
    .eq("payment_schedule_id", schedule.id);

  const schedulePaid = (schedulePayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  await admin
    .from("payment_schedules")
    .update({
      status:
        schedulePaid >= Number(schedule.amount) - 0.001
          ? "paid"
          : "partially_paid",
    })
    .eq("id", schedule.id);

  const { data: invoice } = await admin
    .from("invoices")
    .select("total")
    .eq("id", schedule.invoice_id)
    .single();

  const { data: invoicePayments } = await admin
    .from("payments")
    .select("amount")
    .eq("invoice_id", schedule.invoice_id);

  const invoicePaid = (invoicePayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  await admin
    .from("invoices")
    .update({
      status:
        invoice && invoicePaid >= Number(invoice.total) - 0.001
          ? "paid"
          : "partially_paid",
    })
    .eq("id", schedule.invoice_id);

  return NextResponse.json({ received: true });
}
