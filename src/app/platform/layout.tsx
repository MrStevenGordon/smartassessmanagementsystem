import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function PlatformLayout({
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

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!platformAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900">
          Platform admin
        </span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
