"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function activateStudent(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") || "");
  if (!studentId) return;

  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("id", studentId);
  await supabase
    .from("students")
    .update({ status: "active" })
    .eq("id", studentId);

  revalidatePath(`/registrar/${studentId}`);
  revalidatePath("/registrar");
}
