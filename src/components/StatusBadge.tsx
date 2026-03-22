import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  assigned: "bg-blue-50 text-blue-700 ring-blue-600/20",
  decommissioned: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
  open: "bg-amber-50 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  closed: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
  low: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

const labels: Record<string, string> = {
  in_progress: "In Progress",
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
