import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveBusinessProfile } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .maybeSingle();

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  return (
    <>
      <div className="mb-8">
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to settings
        </Link>

        <h1 className="text-3xl font-bold text-slate-950">
          Company settings
        </h1>
        <p className="mt-2 text-slate-600">
          This information appears on your customer documents.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <form action={saveBusinessProfile} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Company information
              </h2>
              <p className="text-sm text-slate-500">
                Your invoice header and contact details
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Company name *
              </label>
              <input
                id="companyName"
                name="companyName"
                required
                defaultValue={
                  profile?.company_name ?? "ServiceAxiom Contractor"
                }
                className={inputClass}
              />
            </div>



            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Business email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={profile?.email ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Business phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Website
              </label>
              <input
                id="website"
                name="website"
                defaultValue={profile?.website ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="licenseNumber"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Contractor license number
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                defaultValue={profile?.license_number ?? ""}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label
                  htmlFor="logoFile"
                  className="mb-4 block text-sm font-semibold text-slate-700"
                >
                  {profile?.logo_url
                    ? "Company logo"
                    : "Add company logo"}
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {profile?.logo_url ? (
                    <div
                      role="img"
                      aria-label={`${profile.company_name} logo`}
                      className="size-20 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url("${profile.logo_url}")`,
                      }}
                    />
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400">
                      <Building2 size={30} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {profile?.logo_url
                        ? "Current logo"
                        : "No logo uploaded"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {profile?.logo_url
                        ? "Choose a new image to replace the current logo."
                        : "Choose an image to add your company logo."}
                    </p>

                    <input
                      id="logoFile"
                      name="logoFile"
                      type="file"
                      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                      className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-700"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      PNG or JPEG, up to 5 MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-950">
            Business address
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="address"
              defaultValue={profile?.address ?? ""}
              placeholder="Street address"
              className={`md:col-span-2 ${inputClass}`}
            />

            <input
              name="city"
              defaultValue={profile?.city ?? ""}
              placeholder="City"
              className={inputClass}
            />

            <div className="grid grid-cols-[1fr_140px] gap-4">
              <input
                name="state"
                maxLength={2}
                defaultValue={profile?.state ?? ""}
                placeholder="State"
                className={inputClass}
              />

              <input
                name="postalCode"
                defaultValue={profile?.postal_code ?? ""}
                placeholder="ZIP"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
          <Save size={18} />
          Save business profile
        </button>
      </form>
    </>
  );
}
