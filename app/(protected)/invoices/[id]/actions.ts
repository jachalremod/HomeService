"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const idSchema = z.uuid();

export async function markInvoiceSent(formData: FormData) {
  const invoiceId = idSchema.safeParse(formData.get("invoiceId"));

  if (!invoiceId.success) {
    redirect("/invoices?message=Invalid+invoice");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "sent",
      issued_at: new Date().toISOString(),
    })
    .eq("id", invoiceId.data)
    .eq("status", "draft");

  if (error) {
    redirect(
      `/invoices/${invoiceId.data}?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/invoices/${invoiceId.data}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId.data}?message=Invoice+marked+as+sent`);
}

export async function recordPayment(formData: FormData) {
  const result = z
    .object({
      invoiceId: z.uuid(),
      scheduleId: z.uuid(),
      amount: z.coerce.number().positive(),
      paymentMethod: z.string().trim(),
      referenceNumber: z.string().trim(),
    })
    .safeParse({
      invoiceId: formData.get("invoiceId"),
      scheduleId: formData.get("scheduleId"),
      amount: formData.get("amount"),
      paymentMethod: formData.get("paymentMethod"),
      referenceNumber: formData.get("referenceNumber"),
    });

  if (!result.success) {
    redirect("/invoices?message=Invalid+payment");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("payment_schedules")
    .select("id, invoice_id, amount, status")
    .eq("id", result.data.scheduleId)
    .eq("invoice_id", result.data.invoiceId)
    .single();

  if (scheduleError || !schedule) {
    redirect(
      `/invoices/${result.data.invoiceId}?message=Payment+schedule+not+found`,
    );
  }

  const { data: previousSchedulePayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("payment_schedule_id", schedule.id);

  const previouslyPaid = (previousSchedulePayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const remainingForSchedule =
    Math.round((Number(schedule.amount) - previouslyPaid) * 100) / 100;

  if (result.data.amount > remainingForSchedule + 0.001) {
    redirect(
      `/invoices/${result.data.invoiceId}?message=Payment+exceeds+the+scheduled+balance`,
    );
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: user.id,
    invoice_id: result.data.invoiceId,
    payment_schedule_id: schedule.id,
    amount: result.data.amount,
    payment_method: result.data.paymentMethod || null,
    reference_number: result.data.referenceNumber || null,
  });

  if (paymentError) {
    redirect(
      `/invoices/${result.data.invoiceId}?message=${encodeURIComponent(
        paymentError.message,
      )}`,
    );
  }

  const newSchedulePaid = previouslyPaid + result.data.amount;
  const scheduleIsPaid =
    newSchedulePaid >= Number(schedule.amount) - 0.001;

  await supabase
    .from("payment_schedules")
    .update({
      status: scheduleIsPaid ? "paid" : "partially_paid",
    })
    .eq("id", schedule.id);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("total")
    .eq("id", result.data.invoiceId)
    .single();

  const { data: allPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", result.data.invoiceId);

  const totalPaid = (allPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const invoiceIsPaid =
    invoice && totalPaid >= Number(invoice.total) - 0.001;

  await supabase
    .from("invoices")
    .update({
      status: invoiceIsPaid ? "paid" : "partially_paid",
    })
    .eq("id", result.data.invoiceId);

  revalidatePath(`/invoices/${result.data.invoiceId}`);
  revalidatePath("/invoices");

  redirect(
    `/invoices/${result.data.invoiceId}?message=Payment+recorded+successfully`,
  );
}


export async function createJob(formData: FormData) {
  const invoiceId = idSchema.safeParse(formData.get("invoiceId"));

  if (!invoiceId.success) {
    redirect("/invoices?message=Invalid+invoice");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, customer_id, estimate_id, estimates(title, description)",
    )
    .eq("id", invoiceId.data)
    .single();

  if (!invoice) {
    redirect("/invoices?message=Invoice+not+found");
  }

  const { data: firstSchedule } = await supabase
    .from("payment_schedules")
    .select("status")
    .eq("invoice_id", invoice.id)
    .order("sequence", { ascending: true })
    .limit(1)
    .single();

  if (!firstSchedule || firstSchedule.status !== "paid") {
    redirect(
      `/invoices/${invoice.id}?message=The+first+scheduled+payment+must+be+paid+before+creating+a+job`,
    );
  }

  const { data: existingJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("invoice_id", invoice.id)
    .maybeSingle();

  if (existingJob) {
    redirect(`/jobs/${existingJob.id}`);
  }

  const jobNumber = `JOB-${randomUUID().slice(0, 8).toUpperCase()}`;

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      customer_id: invoice.customer_id,
      estimate_id: invoice.estimate_id,
      invoice_id: invoice.id,
      job_number: jobNumber,
      title: invoice.estimates.title,
      description: invoice.estimates.description,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !job) {
    redirect(
      `/invoices/${invoice.id}?message=${encodeURIComponent(
        error?.message ?? "Unable to create job",
      )}`,
    );
  }

  revalidatePath("/jobs");
  revalidatePath(`/invoices/${invoice.id}`);
  redirect(`/jobs/${job.id}?message=Job+created+successfully`);
}


export async function createStripeCheckout(formData: FormData) {
  const result = z
    .object({
      invoiceId: z.uuid(),
      scheduleId: z.uuid(),
    })
    .safeParse({
      invoiceId: formData.get("invoiceId"),
      scheduleId: formData.get("scheduleId"),
    });

  if (!result.success) {
    redirect("/invoices?message=Invalid+payment+schedule");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: schedule } = await supabase
    .from("payment_schedules")
    .select(
      "id, organization_id, invoice_id, title, amount, status, invoices(invoice_number, customers(first_name, last_name, email))",
    )
    .eq("id", result.data.scheduleId)
    .eq("invoice_id", result.data.invoiceId)
    .single();

  if (!schedule) {
    redirect(
      `/invoices/${result.data.invoiceId}?message=Payment+schedule+not+found`,
    );
  }

  const { data: previousPayments } = await supabase
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
    redirect(
      `/invoices/${schedule.invoice_id}?message=This+installment+is+already+paid`,
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const customer = schedule.invoices.customers;
  const customerName = customer
    ? `${customer.first_name} ${customer.last_name}`
    : "Customer";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customer?.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(remainingAmount * 100),
          product_data: {
            name: `${schedule.invoices.invoice_number} - ${schedule.title}`,
            description: `Scheduled payment for ${customerName}`,
          },
        },
      },
    ],
    metadata: {
      invoice_id: schedule.invoice_id,
      schedule_id: schedule.id,
      user_id: user.id,
      organization_id: schedule.organization_id,
    },
    payment_intent_data: {
      metadata: {
        invoice_id: schedule.invoice_id,
        schedule_id: schedule.id,
        user_id: user.id,
        organization_id: schedule.organization_id,
      },
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/payment/cancelled`,
  });

  if (!session.url) {
    redirect(
      `/invoices/${schedule.invoice_id}?message=Stripe+did+not+return+a+payment+link`,
    );
  }

  const { error } = await supabase
    .from("payment_schedules")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
      stripe_checkout_expires_at: new Date(
        session.expires_at * 1000,
      ).toISOString(),
    })
    .eq("id", schedule.id);

  if (error) {
    redirect(
      `/invoices/${schedule.invoice_id}?message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/invoices/${schedule.invoice_id}`);

  redirect(
    `/invoices/${schedule.invoice_id}?message=Secure+Stripe+payment+link+created`,
  );
}
