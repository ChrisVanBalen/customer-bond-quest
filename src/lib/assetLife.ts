import { Asset } from "@/lib/store";

export type LifeStage = "unknown" | "healthy" | "aging" | "nearing" | "expired";

export interface AssetLife {
  ageYears: number;
  eolYears: number | null;
  pct: number; // 0-100+ percent of life consumed
  stage: LifeStage;
  eolDate: string | null;
  remainingYears: number | null;
  label: string;
}

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export function getAssetLife(asset: Asset): AssetLife {
  const start = new Date(asset.createdAt).getTime();
  const end = asset.decommissionedAt ? new Date(asset.decommissionedAt).getTime() : Date.now();
  const ageYears = Number.isNaN(start) ? 0 : Math.max(0, (end - start) / MS_PER_YEAR);
  const eolYears = asset.eolYears ?? null;

  if (!eolYears || eolYears <= 0) {
    return {
      ageYears,
      eolYears: null,
      pct: 0,
      stage: "unknown",
      eolDate: null,
      remainingYears: null,
      label: "No EOL set",
    };
  }

  const pct = (ageYears / eolYears) * 100;
  const remainingYears = eolYears - ageYears;
  const eolDateObj = new Date(start + eolYears * MS_PER_YEAR);
  const eolDate = eolDateObj.toISOString().split("T")[0];

  let stage: LifeStage = "healthy";
  if (pct >= 100) stage = "expired";
  else if (pct >= 85) stage = "nearing";
  else if (pct >= 60) stage = "aging";

  const label =
    stage === "expired"
      ? `Past EOL by ${Math.abs(remainingYears).toFixed(1)} yr`
      : `${remainingYears.toFixed(1)} yr remaining`;

  return { ageYears, eolYears, pct, stage, eolDate, remainingYears, label };
}

export const stageMeta: Record<LifeStage, { label: string; bar: string; text: string; dot: string }> = {
  unknown: { label: "Unknown", bar: "bg-muted-foreground/30", text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  healthy: { label: "Healthy", bar: "bg-success", text: "text-success", dot: "bg-success" },
  aging: { label: "Aging", bar: "bg-warning", text: "text-warning", dot: "bg-warning" },
  nearing: { label: "Nearing EOL", bar: "bg-warning", text: "text-warning", dot: "bg-warning" },
  expired: { label: "Past EOL", bar: "bg-destructive", text: "text-destructive", dot: "bg-destructive" },
};
