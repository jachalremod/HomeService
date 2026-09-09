"use client";

import { Mail, MessageSquareText } from "lucide-react";

type SendEstimateButtonsProps = {
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string;
  estimateNumber: string;
  publicToken: string;
};

export default function SendEstimateButtons({
  customerEmail,
  customerPhone,
  customerName,
  estimateNumber,
  publicToken,
}: SendEstimateButtonsProps) {
  function estimateUrl() {
    return `${window.location.origin}/e/${publicToken}`;
  }

  function emailEstimate() {
    const subject = `Estimate ${estimateNumber}`;
    const body = `Hello ${customerName},\n\nPlease review estimate ${estimateNumber}:\n${estimateUrl()}\n\nThank you.`;
    window.location.href = `mailto:${customerEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function textEstimate() {
    const body = `Hello ${customerName}, please review estimate ${estimateNumber}: ${estimateUrl()}`;
    window.location.href = `sms:${customerPhone ?? ""}?body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={emailEstimate}
        disabled={!customerEmail}
        title={customerEmail ? `Email ${customerEmail}` : "Add an email address to this client first"}
        className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
      >
        <Mail size={18} />
        Email client
      </button>

      <button
        type="button"
        onClick={textEstimate}
        disabled={!customerPhone}
        title={customerPhone ? `Text ${customerPhone}` : "Add a phone number to this client first"}
        className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300"
      >
        <MessageSquareText size={18} />
        Text client
      </button>
    </>
  );
}
