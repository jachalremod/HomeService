import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { openSubscriptionPortal, startSubscriptionCheckout } from "./actions";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ message?: string; checkout?: string }> }) {
  const { message, checkout } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: organization } = await supabase.from("organizations")
    .select("name, subscription_status, trial_ends_at, stripe_customer_id, subscription_cancel_at_period_end")
    .eq("id", organizationId).single();
  if (!organization) redirect("/signup?message=Company+workspace+not+found");
  const daysRemaining = Math.max(0, Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / 86400000));
  const active = organization.subscription_status === "active";

  return <main className="min-h-screen bg-slate-100 px-4 py-12"><section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
    <div className="flex items-start gap-4"><div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white"><CreditCard /></div><div><h1 className="text-3xl font-bold text-slate-950">ServiceAxiom subscription</h1><p className="mt-2 text-slate-600">Billing for {organization.name}</p></div></div>
    {message ? <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</div> : null}
    {checkout === "success" ? <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">Subscription checkout completed. Stripe is confirming your account.</div> : null}
    <div className="mt-8 rounded-2xl border border-slate-200 p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-slate-500">ServiceAxiom</p><p className="mt-2 text-3xl font-bold text-slate-950">$29.99 <span className="text-base font-medium text-slate-500">/ month</span></p></div>{active ? <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">Active</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{daysRemaining ? `${daysRemaining} trial days left` : "Trial expired"}</span>}</div>
      <ul className="mt-6 space-y-3 text-sm text-slate-700">{["Customers, estimates, invoices and jobs", "Company branding and secure client portals", "Online payments and payment schedules", "Cancel through the Stripe billing portal"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={18} className="shrink-0 text-green-600" />{item}</li>)}</ul>
      <div className="mt-7">{active || organization.stripe_customer_id ? <form action={openSubscriptionPortal}><button className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Manage subscription</button></form> : <form action={startSubscriptionCheckout}><button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Subscribe for $29.99/month</button></form>}</div>
    </div>
  </section></main>;
}
