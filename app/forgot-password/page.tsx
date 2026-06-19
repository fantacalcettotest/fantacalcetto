import Link from "next/link";

import { forgotPasswordAction } from "@/app/auth/actions";
import { getSafeNextPath } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

type ForgotPasswordPageProps = {
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

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { error, next, notice } = await searchParams;
  const nextPath = getSafeNextPath(next, "/me");

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            Fantacalcetto
          </p>
          <h1 className="mt-3 text-3xl font-bold">Recupera password</h1>
          <p className="mt-3 text-sm text-slate-300">
            Inserisci l&apos;email. Se esiste, riceverai un link per impostare
            una nuova password.
          </p>
        </section>

        <Feedback error={error} notice={notice} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={forgotPasswordAction} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />

            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Invia istruzioni
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
              Non hai un account?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-slate-900 underline"
              >
                Registrati
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
