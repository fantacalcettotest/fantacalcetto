import Link from "next/link";

const userSteps = [
  {
    description:
      "Sfoglia le leghe pubbliche disponibili e scegli quella giusta per entrare come partecipante.",
    title: "Entra in una lega"
  },
  {
    description:
      "Crea la tua squadra fantasy e completa una rosa da 8 giocatori rispettando i vincoli minimi.",
    title: "Crea la tua rosa"
  },
  {
    description:
      "Quando la giornata e aperta, scegli 5 titolari e 3 panchinari ordinati per le sostituzioni automatiche.",
    title: "Schiera la formazione"
  },
  {
    description:
      "Segui risultati pubblicati, scontri diretti e classifica della lega direttamente dalle pagine pubbliche.",
    title: "Segui risultati e classifica"
  }
] as const;

const featureCards = [
  {
    cta: "Apri le leghe",
    description:
      "Consulta leghe, calendario, giornate pubblicate e classifica in un unico punto di accesso.",
    href: "/leagues",
    title: "Dashboard lega"
  },
  {
    cta: "Vai alla tua area",
    description:
      "Dall'area personale puoi gestire rosa e formazione per le giornate aperte della tua squadra.",
    href: "/me",
    title: "Schiera formazione"
  },
  {
    cta: "Apri area admin",
    description:
      "Gli admin possono inserire voti, calcolare punteggi, generare calendario e pubblicare i risultati.",
    href: "/admin",
    title: "Admin pagelle"
  },
  {
    cta: "Vedi classifica",
    description:
      "Le classifiche pubbliche mostrano punti, differenza reti, fantapunti totali e miglior punteggio.",
    href: "/leagues",
    title: "Classifica"
  }
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-br from-pitch via-emerald-800 to-emerald-700 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
                Fantacalcetto MVP
              </p>
              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
                Fantasy calcetto per leghe private, risultati pubblici e gestione
                completa della giornata.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50 sm:text-base">
                Fantacalcetto unisce area pubblica, area utente e strumenti admin:
                entri in una lega, costruisci la rosa, schieri la formazione e segui
                punteggi, scontri diretti e classifica.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/leagues"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
                >
                  Vedi leghe
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/40 bg-transparent px-5 py-3 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
                >
                  Accedi
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border border-emerald-200 bg-emerald-500/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500/30"
                >
                  Registrati
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-sm">
                <h2 className="text-lg font-semibold">Per i partecipanti</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Accesso rapido a leghe pubbliche, area personale, gestione rosa e
                  schieramento formazione per le giornate aperte.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                <h2 className="text-lg font-semibold">Per gli admin</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Crea leghe, genera calendario, inserisci voti, calcola punteggi e
                  pubblica risultati e classifica della giornata.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  Come funziona
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  Flusso semplice, dal join alla classifica
                </h2>
              </div>
              <Link
                href="/leagues"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Esplora le leghe
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {userSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm font-semibold text-emerald-700">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Per gli admin
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Strumenti operativi per gestire l'intera lega
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                L&apos;area admin consente di creare leghe, generare il calendario,
                aprire e chiudere le formazioni, inserire i voti, calcolare i
                punteggi squadra e pubblicare risultati e classifica senza
                interventi manuali sul database.
              </p>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
                <p className="mt-5 text-sm font-medium text-emerald-700 transition group-hover:text-emerald-800">
                  {card.cta}
                </p>
              </Link>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
