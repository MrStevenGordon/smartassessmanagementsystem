import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (!role) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", profile?.school_id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-zinc-900">
            {school?.name}
          </span>
          <span className="text-sm text-zinc-400 ml-2">Parent</span>
        </div>
        <nav className="flex gap-4 text-sm text-zinc-600 items-center">
          <Link href="/parent">My applications</Link>
          <form action={signOut}>
            <button type="submit" className="hover:text-zinc-900">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
