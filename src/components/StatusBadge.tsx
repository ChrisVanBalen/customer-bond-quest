import { cn } from "@/lib/utils";
import { readSettings, type OptionColor } from "@/lib/store";

const colorStyles: Record<OptionColor, string> = {
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  pink: "bg-pink-50 text-pink-700 ring-pink-600/20",
};

const statusStyles: Record<string, string> = {
  available: colorStyles.green,
  assigned: colorStyles.blue,
  decommissioned: colorStyles.gray,
  open: colorStyles.amber,
  in_progress: colorStyles.blue,
  resolved: colorStyles.green,
  billing: colorStyles.purple,
  closed: colorStyles.gray,
  low: colorStyles.gray,
  medium: colorStyles.amber,
  high: colorStyles.orange,
  critical: colorStyles.red,
  draft: colorStyles.gray,
  quoting: colorStyles.violet,
  sent: colorStyles.sky,
  accepted: colorStyles.green,
  executed: colorStyles.blue,
  expired: colorStyles.red,
  cancelled: colorStyles.gray,
  expiring_soon: colorStyles.amber,
};

const labels: Record<string, string> = {
  in_progress: "In Progress",
  expiring_soon: "Expiring Soon",
};

/** Looks up a configured option (from App Settings) matching this value. */
function findOption(value: string) {
  const settings = readSettings();
  for (const list of Object.values(settings)) {
    const match = list.find(o => o.value === value);
    if (match) return match;
  }
  return null;
}

export function StatusBadge({ status }: { status: string }) {
  const option = findOption(status);
  const style = option ? colorStyles[option.color] : statusStyles[status];
  const label = option?.label ?? labels[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
        style ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
