import Link from "next/link";

import { logoutAction } from "@/app/auth/actions";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AdminShell({ children, title, subtitle }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Admin Demo
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
            >
              Torna alla dashboard
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:border-rose-400 hover:bg-rose-100"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
