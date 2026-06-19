import { redirect } from "next/navigation";

import { loginAction, logoutAction } from "@/app/auth/actions";
import { getAuthenticatedAdminContext } from "@/lib/auth/admin.ts";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
};

function Feedback({
  error,
  notice
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {error ?? notice}
    </div>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, notice } = await searchParams;
  const authContext = await getAuthenticatedAdminContext();

  if (authContext?.appUser?.role === "ADMIN") {
    redirect("/admin");
  }

  const hasAuthenticatedButUnauthorizedUser = Boolean(authContext?.authUser);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            Fantacalcetto
          </p>
          <h1 className="mt-3 text-3xl font-bold">Login admin</h1>
          <p className="mt-3 text-sm text-slate-300">
            Accedi con Supabase Auth. L&apos;area admin è disponibile solo per
            utenti collegati a un record applicativo con ruolo ADMIN.
          </p>
        </section>

        <Feedback error={error} notice={notice} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={loginAction} className="space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Accedi
            </button>
          </form>

          {hasAuthenticatedButUnauthorizedUser ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>
                Esiste una sessione autenticata, ma l&apos;utente non è collegato
                a un admin applicativo.
              </p>
              <form action={logoutAction} className="mt-3">
                <button
                  type="submit"
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 font-medium text-amber-800 transition hover:border-amber-400"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
