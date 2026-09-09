"use client";

import { useState } from "react";
import { Building2, ChevronDown, ChevronUp, MapPin, Plus, Save, Trash2, UserRound } from "lucide-react";

export type ClientContact = { id: string; title: string; firstName: string; lastName: string; companyName: string; role: string; phone: string; email: string; notes: string };
export type ClientAddress = { id: string; label: string; street1: string; street2: string; city: string; state: string; postalCode: string; country: string; taxRate: number | ""; propertyDetails: string; contactIds: string[] };
export type InitialClient = { id: string; title: string; firstName: string; lastName: string; companyName: string; phone: string; email: string; leadSource: string; notes: string; communicationEmail: boolean; communicationPhone: boolean; communicationSms: boolean; billingSameAsProperty: boolean; billingStreet1: string; billingStreet2: string; billingCity: string; billingState: string; billingPostalCode: string; billingCountry: string; contacts: ClientContact[]; addresses: ClientAddress[] };

type Props = { action: (data: FormData) => void | Promise<void>; initialClient?: InitialClient };
const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950";
const countries = ["United States", "Canada", "Mexico", "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bahamas", "Bangladesh", "Belgium", "Brazil", "Chile", "China", "Colombia", "Costa Rica", "Cuba", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "France", "Germany", "Ghana", "Greece", "Guatemala", "Haiti", "Honduras", "Hong Kong", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Kenya", "Malaysia", "Netherlands", "New Zealand", "Nicaragua", "Nigeria", "Norway", "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "Venezuela", "Vietnam"];
const titles = ["", "Mr.", "Ms.", "Mrs.", "Miss", "Dr."];
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const blankContact = (): ClientContact => ({ id: uid("contact"), title: "", firstName: "", lastName: "", companyName: "", role: "", phone: "", email: "", notes: "" });
const blankAddress = (): ClientAddress => ({ id: uid("address"), label: "Primary property", street1: "", street2: "", city: "", state: "", postalCode: "", country: "United States", taxRate: "", propertyDetails: "", contactIds: [] });

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}{required ? " *" : ""}</span>{children}</label>;
}

export default function CustomerForm({ action, initialClient }: Props) {
  const initial = initialClient ?? { id: "", title: "", firstName: "", lastName: "", companyName: "", phone: "", email: "", leadSource: "", notes: "", communicationEmail: true, communicationPhone: true, communicationSms: false, billingSameAsProperty: true, billingStreet1: "", billingStreet2: "", billingCity: "", billingState: "", billingPostalCode: "", billingCountry: "United States", contacts: [], addresses: [blankAddress()] };
  const [contacts, setContacts] = useState(initial.contacts);
  const [addresses, setAddresses] = useState(initial.addresses.length ? initial.addresses : [blankAddress()]);
  const [openDetails, setOpenDetails] = useState(Boolean(initial.notes));
  const [openContacts, setOpenContacts] = useState(initial.contacts.length > 0);
  const [billingSameAsProperty, setBillingSameAsProperty] = useState(initial.billingSameAsProperty);

  const updateContact = (id: string, key: keyof ClientContact, value: string) => setContacts((all) => all.map((c) => c.id === id ? { ...c, [key]: value } : c));
  const updateAddress = (id: string, key: keyof ClientAddress, value: string | number | string[]) => setAddresses((all) => all.map((a) => a.id === id ? { ...a, [key]: value } : a));

  return <form action={action} className="space-y-6">
    <input type="hidden" name="customerId" value={initial.id} />
    <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />
    <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3"><UserRound className="mt-0.5 text-blue-600" /><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Primary contact details</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Provide the main point of contact for reliable client records.</p></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Title"><select name="title" defaultValue={initial.title} className={input}>{titles.map((x) => <option key={x} value={x}>{x || "No title"}</option>)}</select></Field>
        <Field label="Company name"><input name="companyName" defaultValue={initial.companyName} className={input} /></Field>
        <Field label="First name" required><input name="firstName" required defaultValue={initial.firstName} className={input} /></Field>
        <Field label="Last name" required><input name="lastName" required defaultValue={initial.lastName} className={input} /></Field>
      </div>

      <h3 className="mt-8 border-t border-slate-200 pt-6 font-bold text-slate-950 dark:border-slate-800 dark:text-white">Communication</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Phone number"><input name="phone" type="tel" defaultValue={initial.phone} className={input} /></Field><Field label="Email"><input name="email" type="email" defaultValue={initial.email} className={input} /></Field></div>

      <h3 className="mt-8 border-t border-slate-200 pt-6 font-bold text-slate-950 dark:border-slate-800 dark:text-white">Communication settings</h3>
      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-700 dark:text-slate-300">
        <label className="flex items-center gap-2"><input name="communicationEmail" type="checkbox" defaultChecked={initial.communicationEmail} /> Email</label>
        <label className="flex items-center gap-2"><input name="communicationPhone" type="checkbox" defaultChecked={initial.communicationPhone} /> Phone calls</label>
        <label className="flex items-center gap-2"><input name="communicationSms" type="checkbox" defaultChecked={initial.communicationSms} /> Text messages</label>
      </div>

      <h3 className="mt-8 border-t border-slate-200 pt-6 font-bold text-slate-950 dark:border-slate-800 dark:text-white">Lead information</h3>
      <div className="mt-4 max-w-xl"><Field label="Lead source"><select name="leadSource" defaultValue={initial.leadSource} className={input}><option value="">Select a lead source</option>{["Referral", "Repeat client", "Website", "Google", "Social media", "Home services marketplace", "Yard sign", "Other"].map((v) => <option key={v}>{v}</option>)}</select></Field></div>

      <button type="button" onClick={() => setOpenDetails(!openDetails)} className="mt-7 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200"><span>Additional client details</span>{openDetails ? <ChevronUp /> : <ChevronDown />}</button>
      {openDetails ? <div className="mt-4"><Field label="Client notes"><textarea name="notes" rows={4} defaultValue={initial.notes} className={input} /></Field></div> : <input type="hidden" name="notes" value={initial.notes} />}

      <button type="button" onClick={() => setOpenContacts(!openContacts)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-200"><span>Additional contacts ({contacts.length})</span>{openContacts ? <ChevronUp /> : <ChevronDown />}</button>
      {openContacts ? <div className="mt-4 space-y-4">{contacts.map((c, i) => <div key={c.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-4 flex items-center justify-between"><h4 className="font-bold dark:text-white">Contact {i + 1}</h4><button type="button" aria-label="Remove contact" onClick={() => setContacts((all) => all.filter((x) => x.id !== c.id))} className="text-red-600"><Trash2 size={18} /></button></div><div className="grid gap-3 md:grid-cols-3"><select value={c.title} onChange={(e) => updateContact(c.id, "title", e.target.value)} className={input}>{titles.map((x) => <option key={x} value={x}>{x || "No title"}</option>)}</select><input required placeholder="First name *" value={c.firstName} onChange={(e) => updateContact(c.id, "firstName", e.target.value)} className={input} /><input placeholder="Last name" value={c.lastName} onChange={(e) => updateContact(c.id, "lastName", e.target.value)} className={input} /><input placeholder="Role" value={c.role} onChange={(e) => updateContact(c.id, "role", e.target.value)} className={input} /><input placeholder="Phone" value={c.phone} onChange={(e) => updateContact(c.id, "phone", e.target.value)} className={input} /><input type="email" placeholder="Email" value={c.email} onChange={(e) => updateContact(c.id, "email", e.target.value)} className={input} /></div></div>)}<button type="button" onClick={() => setContacts((all) => [...all, blankContact()])} className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400"><Plus size={18} /> Add contact</button></div> : null}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3"><MapPin className="mt-0.5 text-blue-600" /><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Billing address</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose whether invoices use the primary property or a separate billing address.</p></div></div>
      <label className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <input name="billingSameAsProperty" type="checkbox" checked={billingSameAsProperty} onChange={(event) => setBillingSameAsProperty(event.target.checked)} className="size-4" />
        Billing address is the same as the primary property address
      </label>
      {billingSameAsProperty ? (
        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">The primary property address above will also be used as the billing address.</div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Street 1" required><input name="billingStreet1" required defaultValue={initial.billingStreet1} className={input} /></Field>
          <Field label="Street 2"><input name="billingStreet2" defaultValue={initial.billingStreet2} className={input} /></Field>
          <Field label="City" required><input name="billingCity" required defaultValue={initial.billingCity} className={input} /></Field>
          <Field label="State / province" required><input name="billingState" required defaultValue={initial.billingState} className={input} /></Field>
          <Field label="ZIP / postal code" required><input name="billingPostalCode" required defaultValue={initial.billingPostalCode} className={input} /></Field>
          <Field label="Country" required><select name="billingCountry" required defaultValue={initial.billingCountry} className={input}>{countries.map((country) => <option key={country}>{country}</option>)}</select></Field>
        </div>
      )}
      {billingSameAsProperty ? <><input type="hidden" name="billingStreet1" value="" /><input type="hidden" name="billingStreet2" value="" /><input type="hidden" name="billingCity" value="" /><input type="hidden" name="billingState" value="" /><input type="hidden" name="billingPostalCode" value="" /><input type="hidden" name="billingCountry" value="United States" /></> : null}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><MapPin className="mt-0.5 text-blue-600" /><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Property addresses</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">The first address is used as the primary estimate service address.</p></div></div><button type="button" onClick={() => setAddresses((all) => [...all, { ...blankAddress(), label: `Property ${all.length + 1}` }])} className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:text-blue-400"><Plus size={17} /> Add another address</button></div>
      <div className="mt-6 space-y-6">{addresses.map((a, index) => <article key={a.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Building2 size={19} className="text-slate-500" /><h3 className="font-bold text-slate-950 dark:text-white">{index === 0 ? "Primary property" : `Additional property ${index}`}</h3></div>{addresses.length > 1 ? <button type="button" onClick={() => setAddresses((all) => all.filter((x) => x.id !== a.id))} className="text-red-600"><Trash2 size={18} /></button> : null}</div><div className="grid gap-4 md:grid-cols-2">
        <Field label="Address label"><input required value={a.label} onChange={(e) => updateAddress(a.id, "label", e.target.value)} className={input} /></Field><Field label="Street 1" required><input required value={a.street1} onChange={(e) => updateAddress(a.id, "street1", e.target.value)} className={input} /></Field><Field label="Street 2"><input value={a.street2} onChange={(e) => updateAddress(a.id, "street2", e.target.value)} className={input} /></Field><Field label="City" required><input required value={a.city} onChange={(e) => updateAddress(a.id, "city", e.target.value)} className={input} /></Field><Field label="State / province" required><input required value={a.state} onChange={(e) => updateAddress(a.id, "state", e.target.value)} className={input} /></Field><Field label="ZIP / postal code" required><input required value={a.postalCode} onChange={(e) => updateAddress(a.id, "postalCode", e.target.value)} className={input} /></Field><Field label="Country" required><select required value={a.country} onChange={(e) => updateAddress(a.id, "country", e.target.value)} className={input}>{countries.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Tax rate"><input type="number" min="0" max="100" step="0.01" placeholder="No tax rate" value={a.taxRate} onChange={(e) => updateAddress(a.id, "taxRate", e.target.value)} className={input} /></Field>
      </div><div className="mt-4"><Field label="Property details"><textarea rows={3} value={a.propertyDetails} onChange={(e) => updateAddress(a.id, "propertyDetails", e.target.value)} placeholder="Access notes, unit details, gate code, or other property information" className={input} /></Field></div>{contacts.length ? <div className="mt-5"><p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Property contacts</p><div className="flex flex-wrap gap-4">{contacts.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={a.contactIds.includes(c.id)} onChange={(e) => updateAddress(a.id, "contactIds", e.target.checked ? [...a.contactIds, c.id] : a.contactIds.filter((x) => x !== c.id))} /> {c.firstName || "Unnamed contact"} {c.lastName}</label>)}</div></div> : null}</article>)}</div>
    </section>
    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white hover:bg-blue-700"><Save size={20} /> {initialClient ? "Save client changes" : "Create client"}</button>
  </form>;
}
