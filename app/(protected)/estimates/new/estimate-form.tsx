"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp, Plus, Save, Trash2, UserRoundPlus } from "lucide-react";
import { createEstimate, updateEstimate } from "../actions";

type CustomerOption = { id: string; first_name: string; last_name: string; email: string | null; project_address: string | null; city: string | null; state: string | null; postal_code: string | null };
type BusinessProfile = { company_name: string; phone: string | null; email: string | null; license_number: string | null; logo_url: string | null; default_terms: string | null; estimate_contract_template?: string | null };
type EstimateItem = { id: string; title: string; description: string; quantity: number; unitPrice: number };
type PaymentScheduleItem = { id: string; title: string; percentage: number | "" };
type InitialEstimate = { id: string; estimateNumber: string; customerId: string; title: string; expiresAt: string; taxRate: number; notes: string; terms: string; showQuantity?: boolean; showRate?: boolean; items: EstimateItem[]; paymentSchedule?: PaymentScheduleItem[]; poNumber?: string; markupType?: "percentage" | "fixed"; markupValue?: number; discountType?: "percentage" | "fixed"; discountValue?: number };
type EstimateFormProps = { customers: CustomerOption[]; business: BusinessProfile | null; initialEstimate?: InitialEstimate };

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function today() {
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).format(new Date());
}

export default function EstimateForm({ customers, business, initialEstimate }: EstimateFormProps) {
  const [customerId, setCustomerId] = useState(initialEstimate?.customerId ?? "");
  const [title, setTitle] = useState(initialEstimate?.title ?? "");
  const [expiresAt, setExpiresAt] = useState(initialEstimate?.expiresAt ?? "");
  const [taxRate, setTaxRate] = useState(initialEstimate?.taxRate ?? 0);
  const [notes, setNotes] = useState(initialEstimate?.notes ?? "");
  const [terms, setTerms] = useState(
    initialEstimate?.terms ??
      business?.estimate_contract_template ??
      business?.default_terms ??
      "",
  );
  const [showQuantity, setShowQuantity] = useState(initialEstimate?.showQuantity ?? false);
  const [showRate, setShowRate] = useState(initialEstimate?.showRate ?? false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(initialEstimate?.items?.[0]?.id ?? "initial-item");
  const [items, setItems] = useState<EstimateItem[]>(initialEstimate?.items?.length ? initialEstimate.items : [{ id: "initial-item", title: "", description: "", quantity: 1, unitPrice: 0 }]);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [poNumber, setPoNumber] = useState(initialEstimate?.poNumber ?? "");
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">(initialEstimate?.markupType ?? "percentage");
  const [markupValue, setMarkupValue] = useState(initialEstimate?.markupValue ?? 0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(initialEstimate?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(initialEstimate?.discountValue ?? 0);
  const [markupExpanded, setMarkupExpanded] = useState(false);
  const [discountExpanded, setDiscountExpanded] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    initialEstimate?.paymentSchedule?.length
      ? initialEstimate.paymentSchedule
      : [{ id: "payment-1", title: "1st Payment", percentage: "" }],
  );

  const selectedCustomer = customers.find((customer) => customer.id === customerId);
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0), [items]);
  const markupAmount = markupType === "percentage" ? subtotal * (Number(markupValue) / 100) : Number(markupValue);
  const discountAmount = discountType === "percentage" ? subtotal * (Number(discountValue) / 100) : Number(discountValue);
  const adjustedSubtotal = subtotal + markupAmount - discountAmount;
  const taxAmount = adjustedSubtotal * (taxRate / 100);
  const total = adjustedSubtotal + taxAmount;
  const formAction = initialEstimate ? updateEstimate.bind(null, initialEstimate.id) : createEstimate;
  const cancelHref = initialEstimate ? `/estimates/${initialEstimate.id}` : "/estimates";
  const scheduleRemaining = 100 - paymentSchedule.reduce((sum, s) => sum + Number(s.percentage || 0), 0);

  function updateItem(id: string, field: "title" | "description" | "quantity" | "unitPrice", value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "title" || field === "description" ? value : Number(value) } : item));
  }

  function addItem() {
    const id = `item-${Date.now()}`;
    setItems((current) => [...current, { id, title: "", description: "", quantity: 1, unitPrice: 0 }]);
    setExpandedItemId(id);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems((current) => current.filter((item) => item.id !== id));
    setExpandedItemId((current) => current === id ? null : current);
  }

  function updateSchedule(id: string, field: "title" | "percentage", value: string) {
    setPaymentSchedule((current) =>
      current.map((s) => s.id === id ? { ...s, [field]: field === "percentage" ? (value === "" ? "" : Number(value)) : value } : s),
    );
  }

  function addSchedule() {
    setPaymentSchedule((current) => [...current, { id: `schedule-${Date.now()}`, title: `${current.length + 1}${["st", "nd", "rd"][current.length] ?? "th"} Payment`, percentage: "" }]);
  }

  function removeSchedule(id: string) {
    setPaymentSchedule((current) => current.length === 1 ? current : current.filter((s) => s.id !== id));
  }

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <form action={formAction} className="-mx-4 sm:-mx-6 lg:-mx-8">
      <input type="hidden" name="items" value={JSON.stringify(items.map(({ title, description, quantity, unitPrice }) => ({ title, description, quantity, unitPrice })))} />
      <input type="hidden" name="paymentSchedule" value={JSON.stringify(paymentSchedule.map(({ title, percentage }) => ({ title, percentage: Number(percentage) || 0 })))} />
      <input type="hidden" name="poNumber" value={poNumber} />
      <input type="hidden" name="markupType" value={markupType} />
      <input type="hidden" name="markupValue" value={markupValue} />
      <input type="hidden" name="discountType" value={discountType} />
      <input type="hidden" name="discountValue" value={discountValue} />
      <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-500">{initialEstimate ? "Edit estimate" : "New estimate"}</p>
          <h1 className="text-2xl font-bold text-slate-950">Estimate #{initialEstimate?.estimateNumber ?? "New"}</h1>
        </div>
        <div className="flex gap-3">
          <Link href={cancelHref} className="flex-1 rounded-full bg-slate-100 px-7 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-200 sm:flex-none">Cancel</Link>
          <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-2.5 font-semibold text-white hover:bg-emerald-700 sm:flex-none"><Save size={18} /> Save</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-7 lg:px-8">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-start gap-4">
                {business?.logo_url ? (
                  <div role="img" aria-label={`${business.company_name} logo`} className="size-16 shrink-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${business.logo_url}")` }} />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Building2 size={28} /></div>
                )}
                <div className="min-w-0 pt-1 text-xs leading-5 text-slate-500">
                  <p className="text-sm font-bold text-slate-900">{business?.company_name ?? "ServiceAxiom Contractor"}</p>
                  {business?.phone ? <p>{business.phone}</p> : null}
                  {business?.email ? <p>{business.email}</p> : null}
                  {business?.license_number ? <p>License #{business.license_number}</p> : null}
                </div>
              </div>

              <label htmlFor="title" className="mt-6 block text-sm font-semibold text-slate-700">
                Project title *
                <input id="title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project title" className={`${inputClass} mt-2`} />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Client *</label>
                <div className="rounded-lg border-2 border-emerald-500 p-4">
                  <div className="flex items-center gap-3 text-emerald-700"><UserRoundPlus size={24} /><span className="font-semibold">{selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : "Add client"}</span></div>
                  <select id="customerId" name="customerId" required value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600">
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.first_name} {customer.last_name}</option>)}
                  </select>
                  {selectedCustomer ? <p className="mt-2 text-xs leading-5 text-slate-500">{selectedCustomer.project_address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ""}{selectedCustomer.state ? `, ${selectedCustomer.state}` : ""}</p> : null}
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-600">
                Estimate #
                <input readOnly value={initialEstimate?.estimateNumber ?? "Assigned when saved"} className={`${inputClass} mt-1 bg-slate-50 text-sm text-slate-500`} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Date
                <input readOnly value={today()} className={`${inputClass} mt-1 bg-slate-50 text-sm`} />
              </label>
                            <label htmlFor="expiresAt" className="block text-xs font-semibold text-slate-600">
                Expiration date
                <input id="expiresAt" name="expiresAt" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={`${inputClass} mt-1 text-sm`} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                PO Number
                <input value={poNumber} onChange={(event) => setPoNumber(event.target.value)} className={`${inputClass} mt-1 text-sm`} />
              </label>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(280px,1fr)_140px_120px_140px_44px] gap-3 border-b border-slate-300 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Description</span><span className="text-right">Rate</span><span className="text-right">Quantity</span><span className="text-right">Total</span><span />
          </div>
          <div className="divide-y divide-slate-200">
            {items.map((item, index) => {
              const expanded = expandedItemId === item.id;
              return (
                <article key={item.id} className="p-5">
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(280px,1fr)_140px_120px_140px_44px]">
                    <label className="text-xs font-semibold text-slate-500 lg:text-transparent">Description<input required value={item.title} onChange={(event) => updateItem(item.id, "title", event.target.value)} onFocus={() => setExpandedItemId(item.id)} placeholder={`Line item ${index + 1}`} className={`${inputClass} mt-1 text-base font-normal text-slate-950`} /></label>
                    <label className="text-xs font-semibold text-slate-500 lg:text-transparent">Rate<div className="relative mt-1"><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">$</span><input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} className={`${inputClass} pl-7 text-right font-normal text-slate-950`} /></div></label>
                    <label className="text-xs font-semibold text-slate-500 lg:text-transparent">Quantity<input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} className={`${inputClass} mt-1 text-right font-normal text-slate-950`} /></label>
                    <p className="text-right text-lg font-bold text-slate-950"><span className="mr-2 text-xs font-semibold text-slate-500 lg:hidden">Total</span>{money(item.quantity * item.unitPrice)}</p>
                    <button type="button" onClick={() => setExpandedItemId(expanded ? null : item.id)} aria-label={expanded ? "Collapse line item" : "Expand line item"} className="justify-self-end rounded-lg p-2 text-slate-500 hover:bg-slate-100">{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                  </div>
                  {expanded ? (
                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3"><label htmlFor={`item-scope-${item.id}`} className="text-sm font-semibold text-slate-700">Scope of work *</label><button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 disabled:opacity-30"><Trash2 size={16} /> Remove</button></div>
                      <textarea id={`item-scope-${item.id}`} required rows={7} value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} placeholder="Describe the labor, materials, preparation, installation, cleanup, and exclusions included in this line item." className={`${inputClass} mt-2 min-h-44 resize-y whitespace-pre-wrap`} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <button type="button" onClick={addItem} className="m-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 px-5 py-4 font-semibold text-emerald-700 hover:bg-emerald-50"><Plus size={19} /> Add Line Item</button>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Display options</h2>
              <p className="mt-1 text-sm text-slate-500">Choose which pricing details customers see on the estimate and PDF.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4"><input name="showQuantity" type="checkbox" checked={showQuantity} onChange={(event) => setShowQuantity(event.target.checked)} className="size-4 accent-emerald-600" /><span className="font-semibold text-slate-700">Show quantity</span></label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4"><input name="showRate" type="checkbox" checked={showRate} onChange={(event) => setShowRate(event.target.checked)} className="size-4 accent-emerald-600" /><span className="font-semibold text-slate-700">Show rate</span></label>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Notes</h2><textarea name="notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Type your note here" className={`${inputClass} mt-3 resize-y`} /></section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Contract</h2><textarea name="terms" rows={7} value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="Terms and conditions" className={`${inputClass} mt-3 resize-y`} /></section>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
            <dl className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4"><dt className="font-semibold text-slate-600">Subtotal</dt><dd className="font-bold text-slate-950">{money(subtotal)}</dd></div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <dt className="font-semibold text-slate-600">Markup</dt>
                <dd className="flex items-center gap-3">
                  {markupAmount > 0 ? <span className="font-semibold text-slate-700">{money(markupAmount)}</span> : null}
                  <button type="button" onClick={() => setMarkupExpanded(true)} className="font-semibold text-emerald-700 hover:underline">{markupAmount > 0 ? "Edit" : "Add"}</button>
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <dt className="font-semibold text-slate-600">Discount</dt>
                <dd className="flex items-center gap-3">
                  {discountAmount > 0 ? <span className="font-semibold text-slate-700">-{money(discountAmount)}</span> : null}
                  <button type="button" onClick={() => setDiscountExpanded(true)} className="font-semibold text-emerald-700 hover:underline">{discountAmount > 0 ? "Edit" : "Add"}</button>
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4"><dt className="font-semibold text-slate-600">Payment Schedule</dt><dd><button type="button" onClick={() => setScheduleExpanded(true)} className="font-semibold text-emerald-700 hover:underline">Add</button></dd></div>
              <div className="flex items-center justify-between gap-5 border-b border-slate-100 pb-4"><dt><label htmlFor="taxRate" className="font-semibold text-slate-600">Tax</label></dt><dd className="flex items-center gap-3"><div className="relative w-24"><input id="taxRate" name="taxRate" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} className={`${inputClass} pr-7 text-right`} /><span className="pointer-events-none absolute right-3 top-2.5 text-slate-400">%</span></div><span className="w-24 text-right font-semibold text-slate-700">{money(taxAmount)}</span></dd></div>
              <div className="flex items-center justify-between pt-1 text-xl"><dt className="font-bold text-slate-950">Total (USD)</dt><dd className="font-bold text-slate-950">{money(total)}</dd></div>
            </dl>
          </aside>
        </div>
        {markupExpanded ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-950">Markup</h2>
              </div>
              <div className="px-6 py-5">
                <div className="mb-4 flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="markupTypeChoice" checked={markupType === "percentage"} onChange={() => setMarkupType("percentage")} className="accent-emerald-600" />
                    %
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="markupTypeChoice" checked={markupType === "fixed"} onChange={() => setMarkupType("fixed")} className="accent-emerald-600" />
                    $
                  </label>
                </div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Markup amount</label>
                <input type="number" min="0" step="0.01" value={markupValue} onChange={(e) => setMarkupValue(Number(e.target.value))} className={inputClass} />
                <p className="mt-3 text-sm text-slate-600">Adds {money(markupAmount)} to the subtotal.</p>
              </div>
              <div className="flex justify-end gap-4 border-t border-slate-200 px-6 py-4">
                <button type="button" onClick={() => { setMarkupValue(0); setMarkupExpanded(false); }} className="font-semibold text-slate-600 hover:underline">Clear</button>
                <button type="button" onClick={() => setMarkupExpanded(false)} className="font-semibold text-emerald-700 hover:underline">Done</button>
              </div>
            </div>
          </div>
        ) : null}

        {discountExpanded ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-950">Discount</h2>
              </div>
              <div className="px-6 py-5">
                <div className="mb-4 flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="discountTypeChoice" checked={discountType === "percentage"} onChange={() => setDiscountType("percentage")} className="accent-emerald-600" />
                    %
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="discountTypeChoice" checked={discountType === "fixed"} onChange={() => setDiscountType("fixed")} className="accent-emerald-600" />
                    $
                  </label>
                </div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Discount amount</label>
                <input type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className={inputClass} />
                <p className="mt-3 text-sm text-slate-600">Subtracts {money(discountAmount)} from the subtotal.</p>
              </div>
              <div className="flex justify-end gap-4 border-t border-slate-200 px-6 py-4">
                <button type="button" onClick={() => { setDiscountValue(0); setDiscountExpanded(false); }} className="font-semibold text-slate-600 hover:underline">Clear</button>
                <button type="button" onClick={() => setDiscountExpanded(false)} className="font-semibold text-emerald-700 hover:underline">Done</button>
              </div>
            </div>
          </div>
        ) : null}

        {scheduleExpanded ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-950">Payment Schedule</h2>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  {paymentSchedule.map((schedule) => (
                    <div key={schedule.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Payment Name</label>
                        <input value={schedule.title} onChange={(e) => updateSchedule(schedule.id, "title", e.target.value)} className={inputClass} />
                      </div>
                      <div className="w-32">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Payment Amount %</label>
                        <input type="number" min="0" max="100" step="0.01" value={schedule.percentage} onChange={(e) => updateSchedule(schedule.id, "percentage", e.target.value)} className={`${inputClass} text-right`} />
                      </div>
                      <button type="button" onClick={() => removeSchedule(schedule.id)} disabled={paymentSchedule.length === 1} aria-label="Remove payment" className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addSchedule} className="mt-5 flex items-center gap-2 font-semibold text-emerald-700 hover:underline">
                  <Plus size={18} /> Add Payment
                </button>

                <p className={`mt-4 font-semibold ${Math.abs(scheduleRemaining) < 0.001 ? "text-emerald-700" : "text-slate-700"}`}>
                  {scheduleRemaining.toFixed(2)}% Remaining
                </p>
              </div>

              <div className="flex justify-end gap-4 border-t border-slate-200 px-6 py-4">
                <button type="button" onClick={() => setScheduleExpanded(false)} className="font-semibold text-slate-600 hover:underline">Cancel</button>
                <button
                  type="button"
                  onClick={() => setScheduleExpanded(false)}
                  disabled={Math.abs(scheduleRemaining) > 0.001}
                  className="font-semibold text-emerald-700 hover:underline disabled:opacity-40"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pb-8"><Link href={cancelHref} className="rounded-full bg-slate-100 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</Link><button type="submit" className="flex items-center gap-2 rounded-full bg-emerald-600 px-9 py-3 font-semibold text-white hover:bg-emerald-700"><Save size={18} /> Save estimate</button></div>
      </div>
    </form>
  );
}
