type PlaceholderCardProps = {
  title: string;
  description: string;
};

export function PlaceholderCard({
  title,
  description
}: PlaceholderCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
