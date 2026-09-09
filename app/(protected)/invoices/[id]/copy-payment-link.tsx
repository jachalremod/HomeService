"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyPaymentLinkProps = {
  url: string;
};

export default function CopyPaymentLink({
  url,
}: CopyPaymentLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-700"
    >
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "Copied" : "Copy payment link"}
    </button>
  );
}
