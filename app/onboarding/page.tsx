import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { completeCompanyOnboarding } from "./actions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?message=Log+in+to+finish+company+setup");
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const [{ data: organization }, { data: profile }] = await Promise.all([
    supabase.from("organizations").select("name, onboarding_completed").eq("id", organizationId).single(),
    supabase.from("business_profiles").select("*").eq("organization_id", organizationId).maybeSingle(),
  ]);
  if (organization?.onboarding_completed) redirect("/dashboard");
  const inputClass = "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  return <main className="min-h-screen bg-slate-100 px-4 py-10"><section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
    <div className="mb-8 flex items-start gap-4"><div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white"><Building2 /></div><div><h1 className="text-3xl font-bold text-slate-950">Set up your company</h1><p className="mt-2 text-slate-600">This information will appear on estimates and invoices.</p></div></div>
    {message ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{message}</div> : null}
    <form action={completeCompanyOnboarding} className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Company name<input name="companyName" required defaultValue={profile?.company_name ?? organization?.name ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Owner name<input name="ownerName" required defaultValue={profile?.owner_name ?? String(user.user_metadata.full_name ?? "")} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Business email<input name="email" type="email" required defaultValue={profile?.email ?? user.email ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Business phone<input name="phone" required defaultValue={profile?.phone ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Website (optional)<input name="website" defaultValue={profile?.website ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Street address<input name="address" required defaultValue={profile?.address ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">City<input name="city" required defaultValue={profile?.city ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">State<input name="state" required defaultValue={profile?.state ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Postal code<input name="postalCode" required defaultValue={profile?.postal_code ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <label className="text-sm font-semibold text-slate-700">Contractor license number<input name="licenseNumber" required defaultValue={profile?.license_number ?? ""} className={`mt-2 ${inputClass}`} /></label>
      <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 sm:col-span-2">Finish company setup</button>
    </form>
  </section></main>;
}

