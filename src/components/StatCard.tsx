import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-accent-foreground" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
      {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
    </div>
  );
}
