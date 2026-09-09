import { Mail, MapPin, Phone, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "./actions";

type CustomersPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Customers</h1>
        <p className="mt-2 text-slate-600">
          Add a customer before creating an estimate.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error.message}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">New customer</h2>
              <p className="text-sm text-slate-500">
                Required fields are marked with *
              </p>
            </div>
          </div>

          <form action={createCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="firstName"
                required
                placeholder="First name *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <input
                name="lastName"
                required
                placeholder="Last name *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <input
              name="projectAddress"
              placeholder="Project address"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <div className="grid grid-cols-[1fr_80px_100px] gap-3">
              <input
                name="city"
                placeholder="City"
                className="min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <input
                name="state"
                maxLength={2}
                placeholder="State"
                className="min-w-0 rounded-xl border border-slate-300 px-3 py-3 uppercase text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <input
                name="postalCode"
                placeholder="ZIP"
                className="min-w-0 rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">
              Create customer
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Users size={20} />
              Customer list
            </h2>

            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
              {customers?.length ?? 0}
            </span>
          </div>

          {!customers?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Users className="mx-auto text-slate-400" size={34} />
              <h3 className="mt-4 font-bold text-slate-950">
                No customers yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Use the form to create your first customer.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {customers.map((customer) => (
                <article
                  key={customer.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-slate-950">
                    {customer.first_name} {customer.last_name}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {customer.email ? (
                      <p className="flex items-center gap-2">
                        <Mail size={16} />
                        {customer.email}
                      </p>
                    ) : null}

                    {customer.phone ? (
                      <p className="flex items-center gap-2">
                        <Phone size={16} />
                        {customer.phone}
                      </p>
                    ) : null}

                    {customer.project_address ? (
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 shrink-0" size={16} />
                        <span>
                          {customer.project_address}
                          {customer.city ? `, ${customer.city}` : ""}
                          {customer.state ? `, ${customer.state}` : ""}
                          {customer.postal_code
                            ? ` ${customer.postal_code}`
                            : ""}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
