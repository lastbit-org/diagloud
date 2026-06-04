import {
  GCP_RESOURCE_ICONS,
  GCP_RESOURCE_LABELS,
} from "../../assets/gcpIcons";
import type { ResourceKind } from "../../types";

export const PALETTE_DRAG_MIME = "application/diagloud.resource";

export type PaletteCategoryId = "network" | "compute" | "data";

export type PaletteCategoryConfig = {
  id: PaletteCategoryId;
  label: string;
};

export type PaletteItemConfig = {
  kind: ResourceKind;
  category: PaletteCategoryId;
  label: string;
  description: string;
  icon: string;
};

export const PALETTE_CATEGORIES: PaletteCategoryConfig[] = [
  { id: "network", label: "Rede" },
  { id: "compute", label: "Computação" },
  { id: "data", label: "Armazenamento e dados" },
];

export function isPaletteResourceKind(value: string): value is ResourceKind {
  return (
    value === "vpc" ||
    value === "subnet" ||
    value === "vm" ||
    value === "storage" ||
    value === "sql"
  );
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    kind: "vpc",
    category: "network",
    label: GCP_RESOURCE_LABELS.vpc,
    description: "Rede virtual privada",
    icon: GCP_RESOURCE_ICONS.vpc,
  },
  {
    kind: "subnet",
    category: "network",
    label: GCP_RESOURCE_LABELS.subnet,
    description: "Segmento de IP na VPC",
    icon: GCP_RESOURCE_ICONS.subnet,
  },
  {
    kind: "vm",
    category: "compute",
    label: GCP_RESOURCE_LABELS.vm,
    description: "Máquina virtual Compute",
    icon: GCP_RESOURCE_ICONS.vm,
  },
  {
    kind: "storage",
    category: "data",
    label: GCP_RESOURCE_LABELS.storage,
    description: "Bucket de objetos",
    icon: GCP_RESOURCE_ICONS.storage,
  },
  {
    kind: "sql",
    category: "data",
    label: GCP_RESOURCE_LABELS.sql,
    description: "Banco gerenciado (MySQL / PostgreSQL)",
    icon: GCP_RESOURCE_ICONS.sql,
  },
];

export function paletteItemsByCategory(
  categoryId: PaletteCategoryId,
): PaletteItemConfig[] {
  return PALETTE_ITEMS.filter((item) => item.category === categoryId);
}
