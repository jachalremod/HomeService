import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <CheckCircle2
          className="mx-auto text-emerald-600"
          size={54}
        />

        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Payment received
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          Thank you. Your secure payment was submitted successfully.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Close
        </Link>
      </section>
    </main>
  );
}
