"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { sendEstimateEmail } from "../actions";

type SendEstimateButtonsProps = {
  estimateId: string;
  customerEmail: string | null;
  estimateNumber: string;
  publicToken: string;
};

export default function SendEstimateButtons({
  estimateId,
  customerEmail,
}: SendEstimateButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  function emailEstimate() {
    setResult(null);
    startTransition(async () => {
      const response = await sendEstimateEmail(estimateId);
      setResult(response.success ? { success: true } : { success: false, message: response.message });
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={emailEstimate}
          disabled={!customerEmail || isPending}
          title={customerEmail ? `Email ${customerEmail}` : "Add an email address to this client first"}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
        >
          <Mail size={18} />
          {isPending ? "Sending…" : "Email client"}
        </button>
      </div>

      {result?.success ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">Email sent successfully.</p>
      ) : null}
      {result?.success === false ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{result.message}</p>
      ) : null}
    </div>
  );
}