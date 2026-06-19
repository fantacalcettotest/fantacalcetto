import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction, signupAction } from "@/app/auth/actions";
import {
  getAuthenticatedAppUserContext,
  getSafeNextPath
} from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
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

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, next, notice } = await searchParams;
  const authContext = await getAuthenticatedAppUserContext();
  const nextPath = getSafeNextPath(next, "/me");

  if (authContext?.appUser) {
    redirect(nextPath);
  }

  const hasAuthenticatedButUnauthorizedUser = Boolean(authContext?.authUser);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            Fantacalcetto
          </p>
          <h1 className="mt-3 text-3xl font-bold">Registrazione</h1>
          <p className="mt-3 text-sm text-slate-300">
            Crea un account utente normale. Il ruolo applicativo resta sempre USER.
          </p>
        </section>

        <Feedback error={error} notice={notice} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={signupAction} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />

            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">Nome visualizzato</span>
              <input
                type="text"
                name="displayName"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

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
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">Conferma password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Registrati
            </button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-slate-600">
            <p>
              Hai gia un account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-slate-900 underline"
              >
                Accedi
              </Link>
            </p>
            <p>
              Hai dimenticato la password?{" "}
              <Link
                href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-slate-900 underline"
              >
                Recuperala
              </Link>
            </p>
          </div>

          {hasAuthenticatedButUnauthorizedUser ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>
                Esiste una sessione autenticata, ma l&apos;utente non e collegato
                correttamente a un profilo applicativo utilizzabile.
              </p>
              {authContext?.error ? <p className="mt-2">{authContext.error}</p> : null}
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
