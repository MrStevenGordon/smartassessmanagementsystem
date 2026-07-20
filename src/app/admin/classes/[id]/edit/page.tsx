import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditClassForm from "./form";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, grade_levels(name)")
    .eq("id", id)
    .single();

  if (!cls) {
    notFound();
  }

  const gradeLevel = cls.grade_levels as unknown as { name: string } | null;

  return (
    <EditClassForm
      id={cls.id}
      name={cls.name}
      gradeLevelName={gradeLevel?.name ?? ""}
    />
  );
}
