import { Asset } from "@/lib/store";
import { getAssetLife, stageMeta } from "@/lib/assetLife";
import { cn } from "@/lib/utils";

interface Props {
  asset: Asset;
  /** compact = inline table bar, full = detailed card bar */
  variant?: "compact" | "full";
  className?: string;
}

export function AssetLifeBar({ asset, variant = "compact", className }: Props) {
  const life = getAssetLife(asset);
  const meta = stageMeta[life.stage];

  if (life.stage === "unknown") {
    return <span className={cn("text-xs text-muted-foreground", className)}>No EOL set</span>;
  }

  const width = Math.min(100, Math.max(2, life.pct));

  if (variant === "compact") {
    return (
      <div className={cn("min-w-[120px]", className)}>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="tabular-nums text-muted-foreground">
            {life.ageYears.toFixed(1)} / {life.eolYears} yr
          </span>
          <span className={cn("font-medium", meta.text)}>{Math.round(life.pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", meta.bar)} style={{ width: `${width}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {life.ageYears.toFixed(1)} of {life.eolYears} years
        </span>
        <span className={cn("text-xs font-semibold", meta.text)}>{meta.label}</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden relative">
        <div className={cn("h-full rounded-full transition-all", meta.bar)} style={{ width: `${width}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>In service {asset.createdAt}</span>
        <span className={cn(life.stage === "expired" && meta.text)}>{life.label}</span>
      </div>
      {life.eolDate && (
        <p className="text-xs text-muted-foreground">
          Projected end of life: <span className="tabular-nums text-foreground">{life.eolDate}</span>
        </p>
      )}
    </div>
  );
}
