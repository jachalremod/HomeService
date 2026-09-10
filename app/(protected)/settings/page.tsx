import Link from "next/link";
import {
  Building2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Settings,
  Users,
} from "lucide-react";
const settingSections = [
  {
    title: "Company settings",
    description:
      "Company name, logo, contact information, address, and contractor license.",
    href: "/settings/company",
    icon: Building2,
    available: true,
  },
  {
    title: "Team members",
    description:
      "People with access to your workspace and their roles.",
    href: "/settings/team",
    icon: Users,
    available: true,
  },
  {
    title: "Document settings",
    description:
      "Estimate contract templates, document defaults, and customer documents.",
    href: "/settings/documents",
    icon: FileText,
    available: true,
  },
  {
    title: "Payment settings",
    description:
      "Stripe payments, accepted payment methods, and payment instructions.",
    href: "#",
    icon: CircleDollarSign,
    available: false,
  },
];
export default function SettingsPage() {
  return (
    <>
      <div className="mb-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Settings size={24} />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Settings
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your ServiceAxiom business and document preferences.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {settingSections.map((section) => {
          const Icon = section.icon;

          if (!section.available) {
            return (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 opacity-60 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon size={21} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">
                        {section.title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                        Coming soon
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          }

          return (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={21} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-950">
                      {section.title}
                    </h2>
                    <ChevronRight
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
                      size={20}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
