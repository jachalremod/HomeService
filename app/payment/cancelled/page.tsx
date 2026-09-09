import { CircleX } from "lucide-react";

export default function PaymentCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <CircleX className="mx-auto text-slate-400" size={54} />

        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Payment cancelled
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          No payment was processed. You may close this page and use the
          payment link again when ready.
        </p>
      </section>
    </main>
  );
}
