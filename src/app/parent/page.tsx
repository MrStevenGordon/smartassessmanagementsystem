import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Under review",
  approved: "Approved",
  declined: "Declined",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-amber-700 border-amber-200 bg-amber-50",
  approved: "text-emerald-700 border-emerald-200 bg-emerald-50",
  declined: "text-red-700 border-red-200 bg-red-50",
};

export default async function ParentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = await supabase
    .from("registration_submissions")
    .select("id, first_name, last_name, status, decline_reason, created_at")
    .eq("submitted_by", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-900">My applications</h1>
        <Link
          href="/parent/apply/new"
          className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2"
        >
          New application
        </Link>
      </div>

      {!submissions || submissions.length === 0 ? (
        <p className="text-sm text-zinc-500">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="border border-zinc-200 rounded-md p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {s.first_name} {s.last_name}
                </p>
                <p className="text-xs text-zinc-500">
                  Submitted {new Date(s.created_at).toLocaleDateString()}
                </p>
                {s.status === "declined" && s.decline_reason && (
                  <p className="text-xs text-red-600 mt-1">
                    {s.decline_reason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs border rounded px-2 py-1 ${STATUS_COLORS[s.status]}`}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
                {s.status === "declined" && (
                  <Link
                    href={`/parent/apply/${s.id}/edit`}
                    className="text-sm underline text-zinc-700"
                  >
                    Edit & resubmit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
