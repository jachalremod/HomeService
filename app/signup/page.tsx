import Link from "next/link";
import { Building2, UserPlus } from "lucide-react";
import { registerContractor } from "./actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const inputClass = "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  return <main className="min-h-screen bg-slate-950 px-4 py-12">
    <section className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white"><Building2 size={28} /></div>
        <h1 className="text-3xl font-bold text-slate-950">Create your ServiceAxiom company</h1>
        <p className="mt-2 text-slate-600">Start a private workspace for your contracting business.</p>
      </div>
      {message ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{message}</div> : null}
      <form action={registerContractor} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">First name<input name="firstName" required autoComplete="given-name" className={`mt-2 ${inputClass}`} /></label>
          <label className="text-sm font-semibold text-slate-700">Last name<input name="lastName" required autoComplete="family-name" className={`mt-2 ${inputClass}`} /></label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Company name<input name="companyName" required autoComplete="organization" className={`mt-2 ${inputClass}`} /></label>
        <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" type="email" required autoComplete="email" className={`mt-2 ${inputClass}`} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Password<input name="password" type="password" minLength={8} required autoComplete="new-password" className={`mt-2 ${inputClass}`} /></label>
          <label className="text-sm font-semibold text-slate-700">Confirm password<input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className={`mt-2 ${inputClass}`} /></label>
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"><UserPlus size={18} />Create company account</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-blue-700">Log in</Link></p>
    </section>
  </main>;
}

