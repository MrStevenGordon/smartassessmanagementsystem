import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformPage() {
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Schools</h1>
        <Link
          href="/platform/new"
          className="text-sm bg-zinc-900 text-white rounded-md px-4 py-2"
        >
          New school
        </Link>
      </div>

      {!schools || schools.length === 0 ? (
        <p className="text-sm text-zinc-500">No schools yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Slug</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal">Created</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100">
                <td className="py-2 text-zinc-900">{s.name}</td>
                <td className="py-2 text-zinc-500">{s.slug}</td>
                <td className="py-2 text-zinc-500">
                  {s.is_active ? "Active" : "Inactive"}
                </td>
                <td className="py-2 text-zinc-500">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
