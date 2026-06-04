import {
  GCP_RESOURCE_ICONS,
  GCP_RESOURCE_LABELS,
} from "../../assets/gcpIcons";
import type { ResourceKind } from "../../types";

export const PALETTE_DRAG_MIME = "application/diagloud.resource";

/**
 * Categorias alinhadas ao menu do console GCP (All products / Ver todos os produtos).
 * @see https://console.cloud.google.com/products
 * @see https://cloud.google.com/docs/product-list
 */
export type PaletteCategoryId =
  | "networking"
  | "compute"
  | "storage"
  | "databases";

export type PaletteCategoryConfig = {
  id: PaletteCategoryId;
  /** Rótulo exibido na paleta (equivalente PT do console). */
  label: string;
};

export type PaletteItemConfig = {
  kind: ResourceKind;
  category: PaletteCategoryId;
  label: string;
  description: string;
  icon: string;
};

/** Ordem do painel lateral do console: Networking → Compute → Storage → Databases. */
export const PALETTE_CATEGORIES: PaletteCategoryConfig[] = [
  { id: "networking", label: "Rede (Networking)" },
  { id: "compute", label: "Computação (Compute)" },
  { id: "storage", label: "Armazenamento (Storage)" },
  { id: "databases", label: "Bancos de dados (Databases)" },
];

export function isPaletteResourceKind(value: string): value is ResourceKind {
  return (
    value === "vpc" ||
    value === "subnet" ||
    value === "vm" ||
    value === "storage" ||
    value === "sql" ||
    value === "gke"
  );
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    kind: "vpc",
    category: "networking",
    label: GCP_RESOURCE_LABELS.vpc,
    description: "Rede virtual privada",
    icon: GCP_RESOURCE_ICONS.vpc,
  },
  {
    kind: "subnet",
    category: "networking",
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
    kind: "gke",
    category: "compute",
    label: GCP_RESOURCE_LABELS.gke,
    description: "Cluster Kubernetes gerenciado",
    icon: GCP_RESOURCE_ICONS.gke,
  },
  {
    kind: "storage",
    category: "storage",
    label: GCP_RESOURCE_LABELS.storage,
    description: "Bucket de objetos",
    icon: GCP_RESOURCE_ICONS.storage,
  },
  {
    kind: "sql",
    category: "databases",
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
