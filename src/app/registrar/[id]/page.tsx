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

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

const MEDICAL_CONDITION_LABELS: Record<string, string> = {
  hay_fever: "Hay fever",
  asthma: "Asthma",
  diabetes: "Diabetes",
  sickle_cell: "Sickle cell",
  heart_disease: "Heart disease",
  epilepsy: "Epilepsy",
  liver_kidney_disease: "Liver/kidney disease",
  anemia: "Anemia",
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
      `id, student_number, status, first_name, middle_name, last_name,
       date_of_birth, sex, place_of_birth, address, city_or_town, parish,
       address_while_attending,
       distance_from_school, entry_type, previous_school, on_path_programme,
       path_family_number, national_student_registration_number,
       family_doctor_name, medical_conditions, medical_conditions_other,
       profiles(email),
       enrollments(status, classes(name, grade_levels(name)))`
    )
    .eq("id", id)
    .single();

  if (!student) {
    notFound();
  }

  const { data: guardians } = await supabase
    .from("student_guardians")
    .select(
      "relationship_type, full_name, address, occupation, phone1, phone2, email, is_primary_contact"
    )
    .eq("student_id", id);

  const { data: authorizedContacts } = await supabase
    .from("authorized_contacts")
    .select("name, relationship, address, phone")
    .eq("student_id", id);

  const { data: siblingLinksAsStudent } = await supabase
    .from("student_siblings")
    .select("sibling_student_id, students!student_siblings_sibling_student_id_fkey(student_number, profiles(full_name))")
    .eq("student_id", id);

  const { data: siblingLinksAsSibling } = await supabase
    .from("student_siblings")
    .select("student_id, students!student_siblings_student_id_fkey(student_number, profiles(full_name))")
    .eq("sibling_student_id", id);

  const profile = student.profiles as unknown as { email: string } | null;

  const enrollment = (
    student.enrollments as unknown as {
      status: string;
      classes: { name: string; grade_levels: { name: string } } | null;
    }[]
  )?.find((e) => e.status === "active");

  const fullName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">{fullName}</h1>
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
        <form action={activateStudent}>
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

      <div>
        <h2 className="text-sm font-medium text-zinc-700 mb-2">
          Student information
        </h2>
        <div className="border border-zinc-200 rounded-md p-4 text-sm space-y-2">
          <Row label="Date of birth" value={student.date_of_birth} />
          <Row label="Gender" value={student.sex ?? "—"} />
          <Row label="Place of birth" value={student.place_of_birth ?? "—"} />
          <Row label="Address" value={student.address ?? "—"} />
          <Row label="Town/city" value={student.city_or_town ?? "—"} />
          <Row label="Parish" value={student.parish ?? "—"} />
          <Row
            label="Address while attending"
            value={student.address_while_attending ?? "—"}
          />
          <Row
            label="Distance from school"
            value={student.distance_from_school ?? "—"}
          />
          <Row label="Entry type" value={student.entry_type ?? "—"} />
          <Row
            label="Previous school"
            value={student.previous_school ?? "—"}
          />
          <Row
            label="PATH programme"
            value={student.on_path_programme ? "Yes" : "No"}
          />
          {student.on_path_programme && (
            <Row
              label="PATH family number"
              value={student.path_family_number ?? "—"}
            />
          )}
          <Row
            label="National student registration number"
            value={student.national_student_registration_number ?? "—"}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-700 mb-2">
          Parents / guardians
        </h2>
        <div className="space-y-2">
          {(guardians ?? []).map((g, i) => (
            <div
              key={i}
              className="border border-zinc-200 rounded-md p-3 text-sm"
            >
              <div className="flex justify-between mb-1">
                <p className="text-zinc-900 font-medium">
                  {RELATIONSHIP_LABELS[g.relationship_type]}: {g.full_name}
                  {g.is_primary_contact && (
                    <span className="text-xs text-zinc-500 font-normal ml-2">
                      (primary contact)
                    </span>
                  )}
                </p>
              </div>
              <p className="text-zinc-500">{g.address}</p>
              <p className="text-zinc-500">
                {g.occupation && `${g.occupation} · `}
                {g.phone1}
                {g.phone2 && ` / ${g.phone2}`}
              </p>
              <p className="text-zinc-500">{g.email}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-700 mb-2">
          Medical information
        </h2>
        <div className="border border-zinc-200 rounded-md p-4 text-sm space-y-2">
          <Row
            label="Family doctor"
            value={student.family_doctor_name ?? "—"}
          />
          <Row
            label="Conditions"
            value={
              (student.medical_conditions as string[])?.length
                ? (student.medical_conditions as string[])
                    .map((c) => MEDICAL_CONDITION_LABELS[c] ?? c)
                    .join(", ")
                : "None reported"
            }
          />
          {student.medical_conditions_other && (
            <Row label="Other" value={student.medical_conditions_other} />
          )}
        </div>
      </div>

      {authorizedContacts && authorizedContacts.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-700 mb-2">
            Authorized contacts
          </h2>
          <div className="space-y-2">
            {authorizedContacts.map((c, i) => (
              <div
                key={i}
                className="border border-zinc-200 rounded-md p-3 text-sm flex justify-between"
              >
                <div>
                  <p className="text-zinc-900">{c.name}</p>
                  <p className="text-zinc-500">{c.relationship}</p>
                </div>
                <div className="text-right text-zinc-500">
                  <p>{c.address}</p>
                  <p>{c.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const siblingRows = [
          ...(siblingLinksAsStudent ?? []).map((s) => {
            const sib = s.students as unknown as {
              student_number: string;
              profiles: { full_name: string } | null;
            } | null;
            return {
              name: sib?.profiles?.full_name,
              studentNumber: sib?.student_number,
            };
          }),
          ...(siblingLinksAsSibling ?? []).map((s) => {
            const sib = s.students as unknown as {
              student_number: string;
              profiles: { full_name: string } | null;
            } | null;
            return {
              name: sib?.profiles?.full_name,
              studentNumber: sib?.student_number,
            };
          }),
        ];

        if (siblingRows.length === 0) return null;

        return (
          <div>
            <h2 className="text-sm font-medium text-zinc-700 mb-2">
              Linked siblings
            </h2>
            <div className="space-y-2">
              {siblingRows.map((s, i) => (
                <div
                  key={i}
                  className="border border-zinc-200 rounded-md p-3 text-sm flex justify-between"
                >
                  <span className="text-zinc-900">{s.name}</span>
                  <span className="text-zinc-500">{s.studentNumber}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}
