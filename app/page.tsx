import Link from "next/link";

import { PlaceholderCard } from "@/components/home/placeholder-card";
import { homeSections } from "@/lib/home-sections";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pitch to-emerald-800 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white/10 p-8 text-white backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
            MVP
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Fantacalcetto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
            Base iniziale della web app fantasy calcetto per leghe private da 5
            giocatori, costruita con Next.js, TypeScript e Tailwind CSS.
          </p>
          <div className="mt-6">
            <Link
              href="/leagues"
              className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
            >
              Vedi leghe
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {homeSections.map((section) => (
            <PlaceholderCard
              key={section.title}
              title={section.title}
              description={section.description}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
