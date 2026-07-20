import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  school_admin: "School Administrator",
  registrar: "Registrar",
  teacher: "Teacher",
  principal: "Principal",
  grade_supervisor: "Grade Supervisor",
};

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user!.id)
    .single();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role, grade_level_id, profiles(id, full_name, email, is_active)")
    .eq("school_id", profile?.school_id)
    .in("role", [
      "school_admin",
      "registrar",
      "teacher",
      "principal",
      "grade_supervisor",
    ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Staff accounts</h1>
        <Link
          href="/admin/staff/new"
          className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2"
        >
          New staff account
        </Link>
      </div>

      {!roles || roles.length === 0 ? (
        <p className="text-sm text-zinc-500">No staff accounts yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Email</th>
              <th className="py-2 font-normal">Role</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, i) => {
              const p = r.profiles as unknown as {
                id: string;
                full_name: string;
                email: string;
                is_active: boolean;
              } | null;
              return (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="py-2 text-zinc-900">{p?.full_name}</td>
                  <td className="py-2 text-zinc-500">{p?.email}</td>
                  <td className="py-2 text-zinc-500">
                    {ROLE_LABELS[r.role] ?? r.role}
                  </td>
                  <td className="py-2 text-zinc-500">
                    {p?.is_active ? "Active" : "Inactive"}
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
