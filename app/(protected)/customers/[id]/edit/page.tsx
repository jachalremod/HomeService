import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerForm, { type InitialClient } from "../../customer-form";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!customer) notFound();
  const [{ data: contactRows }, { data: addressRows }] = await Promise.all([
    supabase.from("customer_contacts").select("*").eq("customer_id", id).order("created_at"),
    supabase.from("customer_addresses").select("*, customer_address_contacts(contact_id)").eq("customer_id", id).order("is_primary", { ascending: false }).order("created_at"),
  ]);
  const initial: InitialClient = {
    id: customer.id, title: customer.title ?? "", firstName: customer.first_name, lastName: customer.last_name,
    companyName: customer.company_name ?? "", phone: customer.phone ?? "", email: customer.email ?? "",
    leadSource: customer.lead_source ?? "", notes: customer.notes ?? "",
    communicationEmail: customer.communication_email, communicationPhone: customer.communication_phone,
    communicationSms: customer.communication_sms,
    billingSameAsProperty: customer.billing_same_as_property,
    billingStreet1: customer.billing_address ?? "", billingStreet2: customer.billing_street_2 ?? "",
    billingCity: customer.billing_city ?? "", billingState: customer.billing_state ?? "",
    billingPostalCode: customer.billing_postal_code ?? "", billingCountry: customer.billing_country,
    contacts: (contactRows ?? []).map((c) => ({ id: c.id, title: c.title ?? "", firstName: c.first_name,
      lastName: c.last_name, companyName: c.company_name ?? "", role: c.role ?? "", phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" })),
    addresses: (addressRows?.length ? addressRows : [{ id: "legacy", label: "Primary property", street_1: customer.project_address ?? "", street_2: null, city: customer.city ?? "", state: customer.state ?? "", postal_code: customer.postal_code ?? "", country: "United States", tax_rate: null, property_details: null, customer_address_contacts: [] }]).map((a) => ({ id: a.id, label: a.label, street1: a.street_1, street2: a.street_2 ?? "", city: a.city, state: a.state, postalCode: a.postal_code, country: a.country, taxRate: a.tax_rate === null ? "" : Number(a.tax_rate), propertyDetails: a.property_details ?? "", contactIds: a.customer_address_contacts.map((x) => x.contact_id) })),
  };
  return <><Link href="/customers" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400"><ArrowLeft size={17} /> Back to customers</Link><div className="mb-8"><h1 className="text-3xl font-bold text-slate-950 dark:text-white">Edit client</h1><p className="mt-2 text-slate-600 dark:text-slate-400">Update contact, communication, and property information.</p></div>{message ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{message}</div> : null}<CustomerForm action={updateCustomer} initialClient={initial} /></>;
}
