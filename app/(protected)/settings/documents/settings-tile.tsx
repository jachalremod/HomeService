"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SettingsTile({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {open ? (
          <ChevronUp className="shrink-0 text-slate-400" size={20} />
        ) : (
          <ChevronDown className="shrink-0 text-slate-400" size={20} />
        )}
      </button>

      <div className={open ? "block px-6 pb-6" : "hidden"}>
        {children}
      </div>
    </section>
  );
}