"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalEmail = z.union([z.literal(""), z.email()]);
const contactSchema = z.object({
  id: z.string(), title: z.string(), firstName: z.string().trim().min(1),
  lastName: z.string().trim(), companyName: z.string().trim(), role: z.string().trim(),
  phone: z.string().trim(), email: optionalEmail, notes: z.string().trim(),
});
const addressSchema = z.object({
  id: z.string(), label: z.string().trim().min(1), street1: z.string().trim().min(1),
  street2: z.string().trim(), city: z.string().trim().min(1), state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1), country: z.string().trim().min(1),
  taxRate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  propertyDetails: z.string().trim(), contactIds: z.array(z.string()),
});
const customerSchema = z.object({
  customerId: z.union([z.literal(""), z.uuid()]), title: z.string(),
  firstName: z.string().trim().min(1), lastName: z.string().trim().min(1),
  companyName: z.string().trim(), phone: z.string().trim(), email: optionalEmail,
  leadSource: z.string().trim(), notes: z.string().trim(),
  communicationEmail: z.boolean(), communicationPhone: z.boolean(), communicationSms: z.boolean(),
  billingSameAsProperty: z.boolean(), billingStreet1: z.string().trim(), billingStreet2: z.string().trim(),
  billingCity: z.string().trim(), billingState: z.string().trim(), billingPostalCode: z.string().trim(),
  billingCountry: z.string().trim(),
  contacts: z.array(contactSchema), addresses: z.array(addressSchema).min(1),
});

function parseJson(value: FormDataEntryValue | null) {
  try { return JSON.parse(String(value ?? "[]")); } catch { return null; }
}

async function saveCustomer(formData: FormData, editing: boolean) {
  const result = customerSchema.safeParse({
    customerId: formData.get("customerId") ?? "", title: String(formData.get("title") ?? ""),
    firstName: formData.get("firstName"), lastName: formData.get("lastName"),
    companyName: formData.get("companyName"), phone: formData.get("phone"),
    email: formData.get("email"), leadSource: formData.get("leadSource"), notes: formData.get("notes"),
    communicationEmail: formData.get("communicationEmail") === "on",
    communicationPhone: formData.get("communicationPhone") === "on",
    communicationSms: formData.get("communicationSms") === "on",
    billingSameAsProperty: formData.get("billingSameAsProperty") === "on",
    billingStreet1: formData.get("billingStreet1"), billingStreet2: formData.get("billingStreet2"),
    billingCity: formData.get("billingCity"), billingState: formData.get("billingState"),
    billingPostalCode: formData.get("billingPostalCode"), billingCountry: formData.get("billingCountry"),
    contacts: parseJson(formData.get("contacts")), addresses: parseJson(formData.get("addresses")),
  });
  const fallback = editing && result.success ? `/customers/${result.data.customerId}/edit` : "/customers/new";
  if (!result.success) redirect(`${fallback}?message=Complete+all+required+client+and+address+fields`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const v = result.data;
  const primary = v.addresses[0];
  if (!v.billingSameAsProperty && (!v.billingStreet1 || !v.billingCity || !v.billingState || !v.billingPostalCode || !v.billingCountry)) {
    redirect(`${fallback}?message=Complete+all+required+billing+address+fields`);
  }
  const customerValues = {
    user_id: user.id, title: v.title || null, first_name: v.firstName, last_name: v.lastName,
    company_name: v.companyName || null, phone: v.phone || null, email: v.email || null,
    lead_source: v.leadSource || null, notes: v.notes || null,
    communication_email: v.communicationEmail, communication_phone: v.communicationPhone,
    communication_sms: v.communicationSms, project_address: primary.street1,
    city: primary.city, state: primary.state, postal_code: primary.postalCode,
    billing_same_as_property: v.billingSameAsProperty,
    billing_address: v.billingSameAsProperty ? primary.street1 : v.billingStreet1,
    billing_street_2: v.billingSameAsProperty ? primary.street2 || null : v.billingStreet2 || null,
    billing_city: v.billingSameAsProperty ? primary.city : v.billingCity,
    billing_state: v.billingSameAsProperty ? primary.state : v.billingState,
    billing_postal_code: v.billingSameAsProperty ? primary.postalCode : v.billingPostalCode,
    billing_country: v.billingSameAsProperty ? primary.country : v.billingCountry,
  };

  let customerId = v.customerId;
  if (editing) {
    const { error } = await supabase.from("customers").update(customerValues)
      .eq("id", customerId);
    if (error) redirect(`${fallback}?message=${encodeURIComponent(error.message)}`);
    const { error: addressDeleteError } = await supabase.from("customer_addresses").delete().eq("customer_id", customerId);
    const { error: contactDeleteError } = await supabase.from("customer_contacts").delete().eq("customer_id", customerId);
    if (addressDeleteError || contactDeleteError) redirect(`${fallback}?message=${encodeURIComponent((addressDeleteError ?? contactDeleteError)!.message)}`);
  } else {
    const { data, error } = await supabase.from("customers").insert(customerValues).select("id").single();
    if (error || !data) redirect(`/customers/new?message=${encodeURIComponent(error?.message ?? "Unable to create client")}`);
    customerId = data.id;
  }

  const contactIdMap = new Map<string, string>();
  if (v.contacts.length) {
    const { data, error } = await supabase.from("customer_contacts").insert(v.contacts.map((c) => ({
      user_id: user.id, customer_id: customerId, title: c.title || null, first_name: c.firstName,
      last_name: c.lastName, company_name: c.companyName || null, role: c.role || null,
      phone: c.phone || null, email: c.email || null, notes: c.notes || null,
    }))).select("id");
    if (error || !data) redirect(`${fallback}?message=${encodeURIComponent(error?.message ?? "Unable to save contacts")}`);
    v.contacts.forEach((contact, index) => contactIdMap.set(contact.id, data[index].id));
  }

  const { data: savedAddresses, error: addressError } = await supabase.from("customer_addresses")
    .insert(v.addresses.map((a, index) => ({ user_id: user.id, customer_id: customerId,
      label: a.label, street_1: a.street1, street_2: a.street2 || null, city: a.city,
      state: a.state, postal_code: a.postalCode, country: a.country,
      tax_rate: a.taxRate === "" ? null : a.taxRate, property_details: a.propertyDetails || null,
      is_primary: index === 0,
    }))).select("id");
  if (addressError || !savedAddresses) redirect(`${fallback}?message=${encodeURIComponent(addressError?.message ?? "Unable to save addresses")}`);

  const links = v.addresses.flatMap((address, addressIndex) => address.contactIds.flatMap((tempId) => {
    const contactId = contactIdMap.get(tempId);
    return contactId ? [{ user_id: user.id, address_id: savedAddresses[addressIndex].id, contact_id: contactId }] : [];
  }));
  if (links.length) {
    const { error } = await supabase.from("customer_address_contacts").insert(links);
    if (error) redirect(`${fallback}?message=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/customers");
  redirect(`/customers?message=Client+${editing ? "updated" : "created"}+successfully`);
}

export async function createCustomer(formData: FormData) { return saveCustomer(formData, false); }
export async function updateCustomer(formData: FormData) { return saveCustomer(formData, true); }
