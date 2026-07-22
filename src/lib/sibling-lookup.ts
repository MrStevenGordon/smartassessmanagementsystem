"use server";

import { createClient } from "@/lib/supabase/server";

export type SiblingLookupResult = {
  found: boolean;
  studentId?: string;
  fullName?: string;
  status?: string;
};

export async function lookupSibling(
  studentNumber: string
): Promise<SiblingLookupResult> {
  const trimmed = studentNumber.trim();
  if (!trimmed) {
    return { found: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { found: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { found: false };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, status, profiles(full_name)")
    .eq("school_id", profile.school_id)
    .eq("student_number", trimmed)
    .in("status", ["active", "graduated"])
    .maybeSingle();

  if (!student) {
    return { found: false };
  }

  const studentProfile = student.profiles as unknown as {
    full_name: string;
  } | null;

  return {
    found: true,
    studentId: student.id,
    fullName: studentProfile?.full_name,
    status: student.status,
  };
}
