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
  | "organization"
  | "networking"
  | "compute"
  | "storage"
  | "databases"
  | "ai"
  | "devtools"
  | "integration";

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

/** Ordem do painel lateral do console. */
export const PALETTE_CATEGORIES: PaletteCategoryConfig[] = [
  { id: "organization", label: "Organização (Diagrama)" },
  { id: "networking", label: "Rede (Networking)" },
  { id: "compute", label: "Computação (Compute)" },
  { id: "storage", label: "Armazenamento (Storage)" },
  { id: "databases", label: "Bancos de dados (Databases)" },
  { id: "ai", label: "IA (Artificial intelligence)" },
  { id: "integration", label: "Integração (Integration)" },
  { id: "devtools", label: "Ferramentas (Developer tools)" },
];

export function isPaletteResourceKind(value: string): value is ResourceKind {
  return (
    value === "vpc" ||
    value === "subnet" ||
    value === "vm" ||
    value === "storage" ||
    value === "sql" ||
    value === "gke" ||
    value === "nat" ||
    value === "peering" ||
    value === "vpn" ||
    value === "firewall" ||
    value === "artifact" ||
    value === "internet" ||
    value === "run" ||
    value === "pubsub" ||
    value === "eventarc" ||
    value === "bigquery" ||
    value === "spanner" ||
    value === "firestore" ||
    value === "workbench" ||
    value === "zone"
  );
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    kind: "zone",
    category: "organization",
    label: GCP_RESOURCE_LABELS.zone,
    description: "Projeto, área VPC ou perímetro",
    icon: GCP_RESOURCE_ICONS.zone,
  },
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
    kind: "internet",
    category: "networking",
    label: GCP_RESOURCE_LABELS.internet,
    description: "Rede pública externa",
    icon: GCP_RESOURCE_ICONS.internet,
  },
  {
    kind: "nat",
    category: "networking",
    label: GCP_RESOURCE_LABELS.nat,
    description: "Saída para internet sem IP público",
    icon: GCP_RESOURCE_ICONS.nat,
  },
  {
    kind: "peering",
    category: "networking",
    label: GCP_RESOURCE_LABELS.peering,
    description: "Conectividade privada entre duas VPCs",
    icon: GCP_RESOURCE_ICONS.peering,
  },
  {
    kind: "vpn",
    category: "networking",
    label: GCP_RESOURCE_LABELS.vpn,
    description: "Túnel IPsec híbrido com rede externa",
    icon: GCP_RESOURCE_ICONS.vpn,
  },
  {
    kind: "firewall",
    category: "networking",
    label: GCP_RESOURCE_LABELS.firewall,
    description: "Regra de firewall da VPC",
    icon: GCP_RESOURCE_ICONS.firewall,
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
    kind: "run",
    category: "compute",
    label: GCP_RESOURCE_LABELS.run,
    description: "Contêineres serverless gerenciados",
    icon: GCP_RESOURCE_ICONS.run,
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
  {
    kind: "bigquery",
    category: "databases",
    label: GCP_RESOURCE_LABELS.bigquery,
    description: "Data warehouse analítico",
    icon: GCP_RESOURCE_ICONS.bigquery,
  },
  {
    kind: "spanner",
    category: "databases",
    label: GCP_RESOURCE_LABELS.spanner,
    description: "Banco relacional globalmente distribuído",
    icon: GCP_RESOURCE_ICONS.spanner,
  },
  {
    kind: "firestore",
    category: "databases",
    label: GCP_RESOURCE_LABELS.firestore,
    description: "Banco de documentos NoSQL",
    icon: GCP_RESOURCE_ICONS.firestore,
  },
  {
    kind: "workbench",
    category: "ai",
    label: GCP_RESOURCE_LABELS.workbench,
    description: "Notebooks gerenciados na Vertex AI",
    icon: GCP_RESOURCE_ICONS.workbench,
  },
  {
    kind: "pubsub",
    category: "integration",
    label: GCP_RESOURCE_LABELS.pubsub,
    description: "Mensageria assíncrona (tópicos)",
    icon: GCP_RESOURCE_ICONS.pubsub,
  },
  {
    kind: "eventarc",
    category: "integration",
    label: GCP_RESOURCE_LABELS.eventarc,
    description: "Roteamento de eventos para destinos gerenciados",
    icon: GCP_RESOURCE_ICONS.eventarc,
  },
  {
    kind: "artifact",
    category: "devtools",
    label: GCP_RESOURCE_LABELS.artifact,
    description: "Repositório de imagens e pacotes",
    icon: GCP_RESOURCE_ICONS.artifact,
  },
];

export function paletteItemsByCategory(
  categoryId: PaletteCategoryId,
): PaletteItemConfig[] {
  return PALETTE_ITEMS.filter((item) => item.category === categoryId);
}
