import Link from "next/link";
import FindSchoolForm from "./find-school-form";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <p className="text-xs font-medium text-zinc-400 tracking-wide mb-2">
          SAMS
        </p>
        <h1 className="text-2xl font-medium text-zinc-900 mb-2">
          Smart Assess Management System
        </h1>
        <p className="text-sm text-zinc-500 mb-10">
          Student records, registration, attendance, and grades, in one
          place.
        </p>

        <div className="mb-10">
          <Link
            href="/login"
            className="block text-center bg-zinc-900 text-white rounded-md py-2.5 text-sm font-medium"
          >
            Log in
          </Link>
        </div>

        <div className="border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-700 mb-3">
            Registering a child? Find your school:
          </p>
          <FindSchoolForm />
        </div>
      </div>
    </div>
  );
}
