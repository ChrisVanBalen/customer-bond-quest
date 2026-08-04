import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  assigned: "bg-blue-50 text-blue-700 ring-blue-600/20",
  decommissioned: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
  open: "bg-amber-50 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  billing: "bg-purple-50 text-purple-700 ring-purple-600/20",
  closed: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
  low: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  quoting: "bg-violet-50 text-violet-700 ring-violet-600/20",
  sent: "bg-sky-50 text-sky-700 ring-sky-600/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  executed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  expired: "bg-red-50 text-red-700 ring-red-600/20",
  cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
  expiring_soon: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const labels: Record<string, string> = {
  in_progress: "In Progress",
  expiring_soon: "Expiring Soon",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
