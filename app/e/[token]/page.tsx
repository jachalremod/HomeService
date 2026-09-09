/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function date(value: string | null) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export default async function PublicEstimatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: estimate } = await admin.from("estimates")
    .select("*, customers(*), estimate_items(*)")
    .eq("public_token", token).is("deleted_at", null).single();
  if (!estimate) notFound();
  const { data: business } = await admin.from("business_profiles").select("*").eq("organization_id", estimate.organization_id).maybeSingle();
  const customer = estimate.customers;
  const items = [...(estimate.estimate_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const terms = estimate.terms || business?.default_terms;

  return <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 print:bg-white print:p-0"><article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg print:max-w-none print:border-0 print:shadow-none">
    <header className="grid gap-8 bg-slate-950 p-8 text-white sm:grid-cols-2"><div className="flex items-start gap-4">{business?.logo_url ? <><img src={business.logo_url} alt={`${business.company_name} logo`} className="size-16 rounded-xl bg-white object-contain" /></> : <div className="flex size-14 items-center justify-center rounded-xl bg-blue-600"><Building2 /></div>}<div><h1 className="text-xl font-bold">{business?.company_name ?? "ServiceAxiom Contractor"}</h1>{business?.phone ? <p className="mt-2 flex items-center gap-2 text-sm text-slate-300"><Phone size={14} />{business.phone}</p> : null}{business?.email ? <p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Mail size={14} />{business.email}</p> : null}</div></div><div className="sm:text-right"><p className="text-sm font-bold uppercase tracking-widest text-blue-300">Estimate</p><p className="mt-2 text-3xl font-bold">#{estimate.estimate_number}</p><p className="mt-2 text-sm text-slate-300">Valid until {date(estimate.expires_at)}</p></div></header>
    <div className="p-6 sm:p-10"><section className="grid gap-6 border-b border-slate-200 pb-7 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Prepared for</p><h2 className="mt-2 text-lg font-bold text-slate-950">{customer?.first_name} {customer?.last_name}</h2>{customer?.email ? <p className="mt-2 text-sm text-slate-600">{customer.email}</p> : null}</div><div className="sm:text-right"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Service address</p><p className="mt-2 flex items-start gap-2 text-sm text-slate-700 sm:justify-end"><MapPin className="mt-0.5 shrink-0" size={15} /><span>{customer?.project_address}{customer?.city ? `, ${customer.city}` : ""}{customer?.state ? `, ${customer.state}` : ""}{customer?.postal_code ? ` ${customer.postal_code}` : ""}</span></p></div></section>
    <h2 className="mt-7 text-2xl font-bold text-slate-950">{estimate.title}</h2>
    <div className="mt-7 overflow-x-auto"><table className="w-full table-fixed"><thead><tr className="border-b-2 border-slate-900 text-left text-xs uppercase text-slate-500"><th className="w-auto pb-3">Line item / scope of work</th>{estimate.show_quantity ? <th className="w-20 pb-3 text-right">Qty</th> : null}{estimate.show_rate ? <th className="w-28 pb-3 text-right">Rate</th> : null}<th className="w-28 pb-3 text-right">Amount</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-100 align-top"><td className="break-words py-4 pr-4"><p className="font-bold text-slate-950">{item.title}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.description}</p></td>{estimate.show_quantity ? <td className="py-4 text-right text-slate-600">{Number(item.quantity)}</td> : null}{estimate.show_rate ? <td className="py-4 text-right text-slate-600">{money(Number(item.unit_price))}</td> : null}<td className="py-4 text-right font-semibold">{money(Number(item.amount))}</td></tr>)}</tbody></table></div>
    <dl className="ml-auto mt-7 max-w-sm space-y-3 border-t border-slate-200 pt-5"><div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{money(Number(estimate.subtotal))}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd className="font-semibold">{money(Number(estimate.tax_amount))}</dd></div><div className="flex justify-between border-t pt-4 text-xl"><dt className="font-bold">Total</dt><dd className="font-bold">{money(Number(estimate.total))}</dd></div></dl>
    {estimate.notes ? <section className="mt-8 border-t pt-6"><h3 className="font-bold">Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{estimate.notes}</p></section> : null}{terms ? <section className="mt-8 border-t pt-6"><h3 className="font-bold">Contract and terms</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{terms}</p></section> : null}
    <div className="mt-8 print:hidden"><p className="text-center text-xs text-slate-500">Estimate provided securely by {business?.company_name ?? "your contractor"}.</p></div>
    </div></article></main>;
}
