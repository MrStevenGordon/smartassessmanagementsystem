import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { activateStudent } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending activation",
  active: "Active",
  withdrawn: "Withdrawn",
  graduated: "Graduated",
  transferred: "Transferred",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, student_number, status, date_of_birth, sex, address, previous_school, profiles(full_name, email), enrollments(status, classes(name, grade_levels(name)))"
    )
    .eq("id", id)
    .single();

  if (!student) {
    notFound();
  }

  const { data: guardianLinks } = await supabase
    .from("student_guardians")
    .select("relationship, is_primary_contact, profiles(full_name, email, phone)")
    .eq("student_id", id);

  const profile = student.profiles as unknown as {
    full_name: string;
    email: string;
  } | null;

  const enrollment = (
    student.enrollments as unknown as {
      status: string;
      classes: { name: string; grade_levels: { name: string } } | null;
    }[]
  )?.find((e) => e.status === "active");

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">
            {profile?.full_name}
          </h1>
          <p className="text-sm text-zinc-500">
            {student.student_number} · {enrollment?.classes?.grade_levels?.name}{" "}
            {enrollment?.classes?.name}
          </p>
        </div>
        <span className="text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-600">
          {STATUS_LABELS[student.status] ?? student.status}
        </span>
      </div>

      {student.status === "pending" && (
        <form action={activateStudent} className="mb-6">
          <input type="hidden" name="student_id" value={student.id} />
          <button
            type="submit"
            className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm"
          >
            Activate login
          </button>
          <p className="text-xs text-zinc-500 mt-2">
            Login: {profile?.email} — the student can sign in once activated.
          </p>
        </form>
      )}

      <div className="border border-zinc-200 rounded-md p-4 mb-6 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-zinc-500">Date of birth</span>
          <span className="text-zinc-900">{student.date_of_birth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Sex</span>
          <span className="text-zinc-900">{student.sex ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Address</span>
          <span className="text-zinc-900">{student.address ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Previous school</span>
          <span className="text-zinc-900">
            {student.previous_school ?? "—"}
          </span>
        </div>
      </div>

      <h2 className="text-sm font-medium text-zinc-700 mb-2">
        Parents / guardians
      </h2>
      <div className="space-y-2">
        {(guardianLinks ?? []).map((g, i) => {
          const gp = g.profiles as unknown as {
            full_name: string;
            email: string;
            phone: string | null;
          } | null;
          return (
            <div
              key={i}
              className="border border-zinc-200 rounded-md p-3 text-sm flex justify-between"
            >
              <div>
                <p className="text-zinc-900">
                  {gp?.full_name}{" "}
                  {g.is_primary_contact && (
                    <span className="text-xs text-zinc-500">(primary)</span>
                  )}
                </p>
                <p className="text-zinc-500">{g.relationship}</p>
              </div>
              <div className="text-right text-zinc-500">
                <p>{gp?.email}</p>
                <p>{gp?.phone}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
