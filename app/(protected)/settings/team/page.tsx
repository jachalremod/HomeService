import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-blue-100 text-blue-800",
  admin: "bg-violet-100 text-violet-800",
  office: "bg-amber-100 text-amber-800",
  field: "bg-slate-100 text-slate-700",
};

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: organizationId } = await supabase.rpc(
    "current_organization_id",
  );

  const { data: members, error } = await supabase.rpc(
    "get_organization_members",
    { p_organization_id: organizationId },
  );

  return (
    <>
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to settings
      </Link>

      <div className="mb-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Users size={24} />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Team members
        </h1>
        <p className="mt-2 text-slate-600">
          People with access to your ServiceAxiom workspace.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          {error.message}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {(members ?? []).map((member, index) => (
            <div
              key={member.user_id}
              className={`flex items-center justify-between gap-4 px-6 py-4 ${
                index !== 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <p className="font-semibold text-slate-950">{member.email}</p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  ROLE_STYLES[member.role] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}