import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Awaiting review",
  approved: "Approved",
  declined: "Declined",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status ?? "submitted";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: submissions } = await supabase
    .from("registration_submissions")
    .select("id, first_name, last_name, created_at, status")
    .eq("school_id", profile?.school_id)
    .eq("status", activeStatus)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-medium text-zinc-900 mb-6">
        Registration submissions
      </h1>

      <div className="flex gap-4 border-b border-zinc-200 mb-6">
        {["submitted", "approved", "declined"].map((s) => (
          <Link
            key={s}
            href={`/registrar/submissions?status=${s}`}
            className={`text-sm pb-2 -mb-px border-b-2 ${
              activeStatus === s
                ? "border-zinc-900 text-zinc-900 font-medium"
                : "border-transparent text-zinc-500"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {!submissions || submissions.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/registrar/submissions/${s.id}`}
              className="block border border-zinc-200 rounded-md p-3 text-sm hover:border-zinc-400"
            >
              <p className="text-zinc-900">
                {s.first_name} {s.last_name}
              </p>
              <p className="text-zinc-500 text-xs">
                Submitted {new Date(s.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
