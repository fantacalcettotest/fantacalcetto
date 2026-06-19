import Link from "next/link";

import { updatePasswordAction } from "@/app/auth/actions";
import { getSafeNextPath } from "@/lib/auth/app-user";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
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

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const { error, next, notice } = await searchParams;
  const nextPath = getSafeNextPath(next, "/me");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            Fantacalcetto
          </p>
          <h1 className="mt-3 text-3xl font-bold">Nuova password</h1>
          <p className="mt-3 text-sm text-slate-300">
            Imposta una nuova password per il tuo account.
          </p>
        </section>

        <Feedback error={error} notice={notice} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!user ? (
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                Sessione di recupero non disponibile. Apri il link ricevuto via email
                oppure richiedi un nuovo reset password.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
                >
                  Richiedi nuovo link
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Torna al login
                </Link>
              </div>
            </div>
          ) : (
            <form action={updatePasswordAction} className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Account: <strong>{user.email ?? "utente autenticato"}</strong>
              </div>

              <label className="block space-y-2 text-sm text-slate-700">
                <span className="font-medium">Nuova password</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-700">
                <span className="font-medium">Conferma nuova password</span>
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
                Aggiorna password
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
