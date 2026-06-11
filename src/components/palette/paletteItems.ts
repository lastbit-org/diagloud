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
  | "integration"
  | "hybrid";

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
  { id: "hybrid", label: "Identidade e híbrido (Hybrid)" },
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
    value === "interconnect" ||
    value === "firewall" ||
    value === "artifact" ||
    value === "build" ||
    value === "kms" ||
    value === "internet" ||
    value === "run" ||
    value === "pubsub" ||
    value === "eventarc" ||
    value === "bigquery" ||
    value === "spanner" ||
    value === "firestore" ||
    value === "workbench" ||
    value === "zone" ||
    value === "folder" ||
    value === "project" ||
    value === "entra" ||
    value === "infocard" ||
    value === "pcuser" ||
    value === "onprem"
  );
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    kind: "zone",
    category: "organization",
    label: GCP_RESOURCE_LABELS.zone,
    description: "Agrupamento visual de recursos",
    icon: GCP_RESOURCE_ICONS.zone,
  },
  {
    kind: "folder",
    category: "organization",
    label: GCP_RESOURCE_LABELS.folder,
    description: "Pasta na hierarquia de recursos GCP",
    icon: GCP_RESOURCE_ICONS.folder,
  },
  {
    kind: "project",
    category: "organization",
    label: GCP_RESOURCE_LABELS.project,
    description: "Projeto GCP (container de recursos)",
    icon: GCP_RESOURCE_ICONS.project,
  },
  {
    kind: "infocard",
    category: "organization",
    label: GCP_RESOURCE_LABELS.infocard,
    description: "Legenda curta e título em destaque",
    icon: GCP_RESOURCE_ICONS.infocard,
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
    kind: "interconnect",
    category: "networking",
    label: GCP_RESOURCE_LABELS.interconnect,
    description: "Link dedicado de alta largura de banda com on-prem",
    icon: GCP_RESOURCE_ICONS.interconnect,
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
  {
    kind: "build",
    category: "devtools",
    label: GCP_RESOURCE_LABELS.build,
    description: "CI/CD — build e deploy de containers",
    icon: GCP_RESOURCE_ICONS.build,
  },
  {
    kind: "kms",
    category: "devtools",
    label: GCP_RESOURCE_LABELS.kms,
    description: "Chaves de criptografia gerenciadas (CMEK)",
    icon: GCP_RESOURCE_ICONS.kms,
  },
  {
    kind: "entra",
    category: "hybrid",
    label: GCP_RESOURCE_LABELS.entra,
    description: "Diretório de identidades Microsoft (Entra ID)",
    icon: GCP_RESOURCE_ICONS.entra,
  },
  {
    kind: "pcuser",
    category: "hybrid",
    label: GCP_RESOURCE_LABELS.pcuser,
    description: "Usuário em estação de trabalho",
    icon: GCP_RESOURCE_ICONS.pcuser,
  },
  {
    kind: "onprem",
    category: "hybrid",
    label: GCP_RESOURCE_LABELS.onprem,
    description: "Ambiente local / datacenter corporativo",
    icon: GCP_RESOURCE_ICONS.onprem,
  },
];

export function paletteItemsByCategory(
  categoryId: PaletteCategoryId,
): PaletteItemConfig[] {
  return PALETTE_ITEMS.filter((item) => item.category === categoryId);
}
