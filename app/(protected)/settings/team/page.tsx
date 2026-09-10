import Link from "next/link";
import { ArrowLeft, Mail, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, revokeInvitation } from "./actions";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-blue-100 text-blue-800",
  admin: "bg-violet-100 text-violet-800",
  office: "bg-amber-100 text-amber-800",
  field: "bg-slate-100 text-slate-700",
};

type TeamPageProps = {
  searchParams: Promise<{ message?: string; token?: string }>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const { message, token } = await searchParams;
  const supabase = await createClient();

  const { data: organizationId } = await supabase.rpc(
    "current_organization_id",
  );

  const { data: members, error } = await supabase.rpc(
    "get_organization_members",
    { p_organization_id: organizationId },
  );

  const { data: pendingInvitations } = await supabase
    .from("organization_invitations")
    .select("id, email, role, expires_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteLink = token ? `${appUrl}/signup?invite=${token}` : null;

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

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      {inviteLink ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <p className="font-semibold">Share this link with your invite:</p>
          <p className="mt-1 break-all font-mono text-xs">{inviteLink}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-slate-950">Active members</h2>
          </div>

          {error ? (
            <div className="p-6 text-red-900">{error.message}</div>
          ) : (
            (members ?? []).map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
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
            ))
          )}

          {pendingInvitations?.length ? (
            <>
              <div className="border-b border-t border-slate-100 bg-slate-50 px-6 py-3">
                <h3 className="text-xs font-bold uppercase text-slate-500">
                  Pending invitations
                </h3>
              </div>
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-950">
                        {invitation.email}
                      </p>
                      <p className="text-xs capitalize text-slate-500">
                        {invitation.role}, pending
                      </p>
                    </div>
                  </div>

                  <form action={revokeInvitation}>
                    <input
                      type="hidden"
                      name="invitationId"
                      value={invitation.id}
                    />
                    <button
                      type="submit"
                      aria-label="Revoke invitation"
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </form>
                </div>
              ))}
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">Invite a team member</h2>
          <p className="mt-1 text-sm text-slate-500">
            They'll get a link to join your workspace.
          </p>

          <form action={createInvitation} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="field"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 capitalize text-slate-950"
              >
                <option value="admin">Admin</option>
                <option value="office">Office</option>
                <option value="field">Field</option>
              </select>
            </div>

            <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
              Send invitation
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
