import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomerForm from "../customer-form";
import { createCustomer } from "../actions";

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <><Link href="/customers" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400"><ArrowLeft size={17} /> Back to customers</Link><div className="mb-8"><h1 className="text-3xl font-bold text-slate-950 dark:text-white">New client</h1><p className="mt-2 text-slate-600 dark:text-slate-400">Create the client, contacts, communication preferences, and service properties.</p></div>{message ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{message}</div> : null}<CustomerForm action={createCustomer} /></>;
}
