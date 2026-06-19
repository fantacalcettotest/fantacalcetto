type StatusBadgeProps = {
  status: string;
};

function getStatusClasses(status: string) {
  if (
    [
      "CALCULATED",
      "COMPLETED",
      "SV",
      "VOTES_COMPLETED",
      "SCORES_CALCULATED",
      "PUBLISHED"
    ].includes(status)
  ) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  if (
    [
      "PENDING",
      "SCHEDULED",
      "VOTES_PENDING",
      "LINEUPS_OPEN",
      "LINEUPS_LOCKED"
    ].includes(status)
  ) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (["IGNORED", "LOCKED"].includes(status)) {
    return "bg-slate-200 text-slate-700 border-slate-300";
  }

  return "bg-white text-slate-700 border-slate-300";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}
