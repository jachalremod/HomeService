/* eslint-disable react-hooks/purity -- server-rendered subscription expiry check */
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./dashboard/actions";
import ThemeToggle from "@/app/theme-toggle";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Estimates", href: "/estimates", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: CircleDollarSign },
  { label: "Jobs", href: "/jobs", icon: Wrench },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organizationId } = await supabase.rpc("current_organization_id");
  if (!organizationId) redirect("/signup?message=Company+workspace+not+found");
  const { data: organization } = await supabase.from("organizations")
    .select("onboarding_completed, subscription_status, trial_ends_at").eq("id", organizationId).single();
  if (!organization?.onboarding_completed) redirect("/onboarding");
  const trialActive = organization.subscription_status === "trialing" &&
    new Date(organization.trial_ends_at).getTime() > Date.now();
  if (organization.subscription_status !== "active" && !trialActive) redirect("/billing");
  const trialDaysRemaining = organization.subscription_status === "trialing"
    ? Math.max(0, Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const { data: business } = await supabase
    .from("business_profiles")
    .select("company_name, logo_url")
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            {business?.logo_url ? (
              <div
                role="img"
                aria-label={`${business.company_name || "Company"} logo`}
                className="size-10 rounded-xl bg-white bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url("${business.logo_url}")`,
                }}
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Building2 size={21} />
              </div>
            )}

            <span className="font-bold text-slate-950">
              {business?.company_name || "ServiceAxiom"}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <form action={logout}>
              <button
                type="submit"
                aria-label="Log out"
                className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600"
              >
                <LogOut size={19} />
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white text-slate-950 lg:flex lg:flex-col print:hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          {business?.logo_url ? (
            <div
              role="img"
              aria-label={`${business.company_name || "Company"} logo`}
              className="size-11 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url("${business.logo_url}")`,
              }}
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
              <Building2 size={23} />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-bold">
              {business?.company_name || "ServiceAxiom"}
            </p>
            <p className="text-xs text-slate-500">Contractor workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <ThemeToggle />

          <p className="mb-3 mt-3 truncate px-3 text-xs text-slate-500">
            {user.email}
          </p>

          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
              <LogOut size={19} />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="lg:pl-64 print:pl-0">
        {trialDaysRemaining !== null ? <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900 print:hidden">Your free trial has {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} remaining. <Link href="/billing" className="underline">Subscribe for $29.99/month</Link></div> : null}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
