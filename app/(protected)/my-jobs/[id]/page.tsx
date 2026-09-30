import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, MapPin, StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateMyJobNotes, updateMyJobStatus, uploadJobPhoto } from "./actions";

type MyJobPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

export default async function MyJobPage({ params, searchParams }: MyJobPageProps) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("job_photos")
    .select("id, storage_path, created_at")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const photoUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(photo.storage_path, 3600);
      return { id: photo.id, url: data?.signedUrl ?? null, created_at: photo.created_at };
    }),
  );

  return (
    <>
      <Link
        href="/my-jobs"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to my jobs
      </Link>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-sm font-bold text-blue-700">{job.job_number}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">{job.title}</h1>
        <p className="mt-2 text-slate-600">
          {job.customers?.first_name} {job.customers?.last_name}
        </p>
        {job.customers?.project_address ? (
          <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 shrink-0" size={16} />
            <span>
              {job.customers.project_address}
              {job.customers.city ? `, ${job.customers.city}` : ""}
              {job.customers.state ? `, ${job.customers.state}` : ""}
            </span>
          </p>
        ) : null}
      </div>

      {job.description ? (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Job description</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Status</h2>
        <form action={updateMyJobStatus} className="mt-4 space-y-3">
          <input type="hidden" name="jobId" value={job.id} />
          <select
            name="status"
            defaultValue={job.status}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 capitalize text-slate-950"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            Update status
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold text-slate-950">
          <StickyNote size={18} />
          Field notes
        </h2>
        <form action={updateMyJobNotes} className="mt-4 space-y-3">
          <input type="hidden" name="jobId" value={job.id} />
          <textarea
            name="notes"
            rows={4}
            defaultValue={job.notes ?? ""}
            placeholder="Add notes about the work..."
            className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-slate-950"
          />
          <button className="w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
            Save notes
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold text-slate-950">
          <Camera size={18} />
          Photos
        </h2>

        <form action={uploadJobPhoto} className="mt-4">
          <input type="hidden" name="jobId" value={job.id} />
          <input
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950"
          />
          <button className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            Upload photo
          </button>
        </form>

        {photoUrls.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoUrls.map((photo) =>
              photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Job photo"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : null,
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No photos yet.</p>
        )}
      </section>
    </>
  );
}