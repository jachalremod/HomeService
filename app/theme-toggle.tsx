"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/theme-provider";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Use light mode" : "Use dark mode"}
      title={dark ? "Use light mode" : "Use dark mode"}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:bg-slate-100 ${
        compact ? "p-2" : "w-full px-4 py-3 text-sm"
      }`}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
      {compact ? null : dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
