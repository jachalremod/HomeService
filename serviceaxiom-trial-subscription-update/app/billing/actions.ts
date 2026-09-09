"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function startSubscriptionCheckout() {
  const priceId = process.env.STRIPE_SERVICEAXIOM_PRICE_ID;
  if (!priceId) redirect("/billing?message=Subscription+price+is+not+configured");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: isAdmin } = await supabase.rpc("is_organization_admin", { p_organization_id: organizationId });
  if (!isAdmin) redirect("/billing?message=Only+an+owner+or+administrator+can+manage+billing");
  const { data: organization } = await supabase.from("organizations")
    .select("name, stripe_customer_id, subscription_status").eq("id", organizationId).single();
  if (!organization) redirect("/billing?message=Company+workspace+not+found");
  if (organization.subscription_status === "active") redirect("/billing?message=Subscription+is+already+active");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(organization.stripe_customer_id
      ? { customer: organization.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { organization_id: organizationId } },
    metadata: { organization_id: organizationId },
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=cancelled`,
  });
  if (!session.url) redirect("/billing?message=Stripe+did+not+return+a+checkout+page");
  redirect(session.url);
}

export async function openSubscriptionPortal() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: isAdmin } = await supabase.rpc("is_organization_admin", { p_organization_id: organizationId });
  if (!isAdmin) redirect("/billing?message=Only+an+owner+or+administrator+can+manage+billing");
  const { data: organization } = await supabase.from("organizations")
    .select("stripe_customer_id").eq("id", organizationId).single();
  if (!organization?.stripe_customer_id) redirect("/billing?message=Subscribe+before+opening+the+billing+portal");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });
  redirect(portal.url);
}

