import {
  GCP_RESOURCE_ICONS,
  GCP_RESOURCE_LABELS,
} from "../../assets/gcpIcons";
import type { ResourceKind } from "../../types";

export const PALETTE_DRAG_MIME = "application/diagloud.resource";

export type PaletteItemConfig = {
  kind: ResourceKind;
  label: string;
  description: string;
  icon: string;
};

export function isPaletteResourceKind(value: string): value is ResourceKind {
  return value === "vpc" || value === "subnet" || value === "vm";
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    kind: "vpc",
    label: GCP_RESOURCE_LABELS.vpc,
    description: "Rede virtual privada",
    icon: GCP_RESOURCE_ICONS.vpc,
  },
  {
    kind: "subnet",
    label: GCP_RESOURCE_LABELS.subnet,
    description: "Segmento de IP na VPC",
    icon: GCP_RESOURCE_ICONS.subnet,
  },
  {
    kind: "vm",
    label: GCP_RESOURCE_LABELS.vm,
    description: "Máquina virtual Compute",
    icon: GCP_RESOURCE_ICONS.vm,
  },
];
