import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending activation",
  active: "Active",
  withdrawn: "Withdrawn",
  graduated: "Graduated",
  transferred: "Transferred",
};

export default async function RegistrarStudentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, student_number, status, profiles(full_name), enrollments(status, classes(name))"
    )
    .eq("school_id", profile?.school_id)
    .order("student_number");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Students</h1>
        <Link
          href="/registrar/submissions"
          className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2"
        >
          Review submissions
        </Link>
      </div>

      {!students || students.length === 0 ? (
        <p className="text-sm text-zinc-500">No students registered yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 font-normal">Number</th>
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Class</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const p = s.profiles as unknown as { full_name: string } | null;
              const enrollment = (
                s.enrollments as unknown as {
                  status: string;
                  classes: { name: string } | null;
                }[]
              )?.find((e) => e.status === "active");

              return (
                <tr key={s.id} className="border-b border-zinc-100">
                  <td className="py-2 text-zinc-500">{s.student_number}</td>
                  <td className="py-2 text-zinc-900">
                    <Link
                      href={`/registrar/${s.id}`}
                      className="hover:underline"
                    >
                      {p?.full_name}
                    </Link>
                  </td>
                  <td className="py-2 text-zinc-500">
                    {enrollment?.classes?.name ?? "—"}
                  </td>
                  <td className="py-2 text-zinc-500">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
