import {
  GCP_RESOURCE_ICONS,
  GCP_RESOURCE_LABELS,
} from "../../assets/gcpIcons";
import type { ResourceKind } from "../../types";

export const PALETTE_DRAG_MIME = "application/diagloud.resource";

export type PaletteCategoryId =
  | "management"
  | "compute"
  | "storage"
  | "analytics"
  | "networking"
  | "serverless"
  | "databases"
  | "appdev"
  | "cicd"
  | "integration"
  | "ai"
  | "security"
  | "observability"
  | "other";

export type PaletteCategoryConfig = {
  id: PaletteCategoryId;
  label: string;
};

export type PaletteItemConfig = {
  paletteKey: string;
  kind?: ResourceKind;
  category: PaletteCategoryId;
  label: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
};

export const PALETTE_CATEGORIES: PaletteCategoryConfig[] = [
  { id: "management", label: "Management" },
  { id: "compute", label: "Compute" },
  { id: "storage", label: "Storage" },
  { id: "analytics", label: "Analytics" },
  { id: "networking", label: "Networking" },
  { id: "serverless", label: "Serverless" },
  { id: "databases", label: "Databases" },
  { id: "appdev", label: "App Development" },
  { id: "cicd", label: "CI/CD" },
  { id: "integration", label: "Integration Services" },
  { id: "ai", label: "Artificial Intelligence" },
  { id: "security", label: "Security" },
  { id: "observability", label: "Observability" },
  { id: "other", label: "Other" },
];

export function isPaletteResourceKind(value: string): value is ResourceKind {
  return (
    value === "vpc" ||
    value === "subnet" ||
    value === "vm" ||
    value === "instancegroup" ||
    value === "storage" ||
    value === "sql" ||
    value === "gke" ||
    value === "nat" ||
    value === "router" ||
    value === "peering" ||
    value === "vpn" ||
    value === "interconnect" ||
    value === "firewall" ||
    value === "dns" ||
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
    value === "spark" ||
    value === "airflow" ||
    value === "dataflow" ||
    value === "modelregistry" ||
    value === "tuning" ||
    value === "evaluation" ||
    value === "endpoints" ||
    value === "batchinference" ||
    value === "featurestore" ||
    value === "experiments" ||
    value === "training" ||
    value === "pipelines" ||
    value === "mlmonitoring" ||
    value === "zone" ||
    value === "folder" ||
    value === "project" ||
    value === "entra" ||
    value === "infocard" ||
    value === "pcuser" ||
    value === "onprem" ||
    value === "github" ||
    value === "iam" ||
    value === "bigtable" ||
    value === "memorystore" ||
    value === "alloydb" ||
    value === "firebase" ||
    value === "notebook" ||
    value === "loadbalancer" ||
    value === "cdn" ||
    value === "orgpolicy" ||
    value === "psc" ||
    value === "secretmanager" ||
    value === "certificatemanager" ||
    value === "apigee" ||
    value === "memorystore" ||
    value === "alloydb" ||
    value === "cloudshell" ||
    value === "monitoring" ||
    value === "cloudlogging" ||
    value === "cloudarmor" ||
    value === "knowledgecatalog" ||
    value === "usergroup"
  );
}

export const PALETTE_ITEMS: PaletteItemConfig[] = [
  {
    paletteKey: "zone",
    kind: "zone",
    category: "management",
    label: GCP_RESOURCE_LABELS.zone,
    description: "Agrupamento visual de recursos",
    icon: GCP_RESOURCE_ICONS.zone,
  },
  {
    paletteKey: "folder",
    kind: "folder",
    category: "management",
    label: GCP_RESOURCE_LABELS.folder,
    description: "Pasta na hierarquia de recursos GCP",
    icon: GCP_RESOURCE_ICONS.folder,
  },
  {
    paletteKey: "project",
    kind: "project",
    category: "management",
    label: GCP_RESOURCE_LABELS.project,
    description: "Projeto GCP (container de recursos)",
    icon: GCP_RESOURCE_ICONS.project,
  },
  {
    paletteKey: "orgpolicy",
    kind: "orgpolicy",
    category: "management",
    label: GCP_RESOURCE_LABELS.orgpolicy,
    description: "Constraint de política organizacional (opcional no diagrama)",
    icon: GCP_RESOURCE_ICONS.orgpolicy,
  },
  {
    paletteKey: "infocard",
    kind: "infocard",
    category: "management",
    label: GCP_RESOURCE_LABELS.infocard,
    description: "Legenda curta e título em destaque",
    icon: GCP_RESOURCE_ICONS.infocard,
  },
  {
    paletteKey: "iam",
    kind: "iam",
    category: "management",
    label: GCP_RESOURCE_LABELS.iam,
    description: "Conta de serviço, Workload Identity Federation ou grupo",
    icon: GCP_RESOURCE_ICONS.iam,
  },
  {
    paletteKey: "vm",
    kind: "vm",
    category: "compute",
    label: GCP_RESOURCE_LABELS.vm,
    description: "Máquina virtual Compute Engine",
    icon: GCP_RESOURCE_ICONS.vm,
  },
  {
    paletteKey: "gke",
    kind: "gke",
    category: "compute",
    label: GCP_RESOURCE_LABELS.gke,
    description: "Cluster Kubernetes gerenciado",
    icon: GCP_RESOURCE_ICONS.gke,
  },
  {
    paletteKey: "instancegroup",
    kind: "instancegroup",
    category: "compute",
    label: GCP_RESOURCE_LABELS.instancegroup,
    description: "Grupo de instâncias gerenciado ou não gerenciado",
    icon: GCP_RESOURCE_ICONS.instancegroup,
  },
  {
    paletteKey: "storage",
    kind: "storage",
    category: "storage",
    label: GCP_RESOURCE_LABELS.storage,
    description: "Bucket de objetos",
    icon: GCP_RESOURCE_ICONS.storage,
  },
  {
    paletteKey: "bigquery",
    kind: "bigquery",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.bigquery,
    description: "Data warehouse analítico",
    icon: GCP_RESOURCE_ICONS.bigquery,
  },
  {
    paletteKey: "pubsub",
    kind: "pubsub",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.pubsub,
    description: "Mensageria assíncrona (tópicos)",
    icon: GCP_RESOURCE_ICONS.pubsub,
  },
  {
    paletteKey: "dataflow",
    kind: "dataflow",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.dataflow,
    description: "Processamento de dados em lote ou streaming",
    icon: GCP_RESOURCE_ICONS.dataflow,
  },
  {
    paletteKey: "airflow",
    kind: "airflow",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.airflow,
    description: "Orquestração de pipelines (Apache Airflow)",
    icon: GCP_RESOURCE_ICONS.airflow,
  },
  {
    paletteKey: "spark",
    kind: "spark",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.spark,
    description: "Processamento de dados — cluster ou serverless",
    icon: GCP_RESOURCE_ICONS.spark,
  },
  {
    paletteKey: "knowledgecatalog",
    kind: "knowledgecatalog",
    category: "analytics",
    label: GCP_RESOURCE_LABELS.knowledgecatalog,
    description: "Catálogo e governança de dados (ex-Dataplex)",
    icon: GCP_RESOURCE_ICONS.knowledgecatalog,
  },
  {
    paletteKey: "vpc",
    kind: "vpc",
    category: "networking",
    label: GCP_RESOURCE_LABELS.vpc,
    description: "Rede virtual privada",
    icon: GCP_RESOURCE_ICONS.vpc,
  },
  {
    paletteKey: "subnet",
    kind: "subnet",
    category: "networking",
    label: GCP_RESOURCE_LABELS.subnet,
    description: "Segmento de IP na VPC",
    icon: GCP_RESOURCE_ICONS.subnet,
  },
  {
    paletteKey: "internet",
    kind: "internet",
    category: "networking",
    label: GCP_RESOURCE_LABELS.internet,
    description: "Rede pública externa",
    icon: GCP_RESOURCE_ICONS.internet,
  },
  {
    paletteKey: "nat",
    kind: "nat",
    category: "networking",
    label: GCP_RESOURCE_LABELS.nat,
    description: "Saída para internet sem IP público",
    icon: GCP_RESOURCE_ICONS.nat,
  },
  {
    paletteKey: "router",
    kind: "router",
    category: "networking",
    label: GCP_RESOURCE_LABELS.router,
    description: "Roteador BGP — NAT, VPN e rotas dinâmicas (VPC opcional)",
    icon: GCP_RESOURCE_ICONS.router,
  },
  {
    paletteKey: "peering",
    kind: "peering",
    category: "networking",
    label: GCP_RESOURCE_LABELS.peering,
    description: "Conectividade privada entre duas VPCs",
    icon: GCP_RESOURCE_ICONS.peering,
  },
  {
    paletteKey: "vpn",
    kind: "vpn",
    category: "networking",
    label: GCP_RESOURCE_LABELS.vpn,
    description: "Túnel IPsec híbrido com rede externa",
    icon: GCP_RESOURCE_ICONS.vpn,
  },
  {
    paletteKey: "interconnect",
    kind: "interconnect",
    category: "networking",
    label: GCP_RESOURCE_LABELS.interconnect,
    description: "Link dedicado de alta largura de banda com on-prem",
    icon: GCP_RESOURCE_ICONS.interconnect,
  },
  {
    paletteKey: "firewall",
    kind: "firewall",
    category: "networking",
    label: GCP_RESOURCE_LABELS.firewall,
    description: "Regra de firewall da VPC",
    icon: GCP_RESOURCE_ICONS.firewall,
  },
  {
    paletteKey: "dns",
    kind: "dns",
    category: "networking",
    label: GCP_RESOURCE_LABELS.dns,
    description: "Zona DNS gerenciada — pública ou privada na VPC",
    icon: GCP_RESOURCE_ICONS.dns,
  },
  {
    paletteKey: "loadbalancer",
    kind: "loadbalancer",
    category: "networking",
    label: GCP_RESOURCE_LABELS.loadbalancer,
    description: "Balanceamento de carga HTTP(S), TCP ou interno",
    icon: GCP_RESOURCE_ICONS.loadbalancer,
  },
  {
    paletteKey: "cdn",
    kind: "cdn",
    category: "networking",
    label: GCP_RESOURCE_LABELS.cdn,
    description: "Cache de conteúdo estático e dinâmico na borda",
    icon: GCP_RESOURCE_ICONS.cdn,
  },
  {
    paletteKey: "psc",
    kind: "psc",
    category: "networking",
    label: GCP_RESOURCE_LABELS.psc,
    description: "Endpoint PSC com IP privado na sub-rede da VPC",
    icon: GCP_RESOURCE_ICONS.psc,
  },
  {
    paletteKey: "run",
    kind: "run",
    category: "serverless",
    label: GCP_RESOURCE_LABELS.run,
    description: "Contêineres serverless gerenciados",
    icon: GCP_RESOURCE_ICONS.run,
  },
  {
    paletteKey: "sql",
    kind: "sql",
    category: "databases",
    label: GCP_RESOURCE_LABELS.sql,
    description: "Banco gerenciado (MySQL / PostgreSQL)",
    icon: GCP_RESOURCE_ICONS.sql,
  },
  {
    paletteKey: "firestore",
    kind: "firestore",
    category: "databases",
    label: GCP_RESOURCE_LABELS.firestore,
    description: "Banco de documentos NoSQL",
    icon: GCP_RESOURCE_ICONS.firestore,
  },
  {
    paletteKey: "spanner",
    kind: "spanner",
    category: "databases",
    label: GCP_RESOURCE_LABELS.spanner,
    description: "Banco relacional globalmente distribuído",
    icon: GCP_RESOURCE_ICONS.spanner,
  },
  {
    paletteKey: "bigtable",
    kind: "bigtable",
    category: "databases",
    label: GCP_RESOURCE_LABELS.bigtable,
    description: "Banco NoSQL de baixa latência e alto throughput",
    icon: GCP_RESOURCE_ICONS.bigtable,
  },
  {
    paletteKey: "memorystore",
    kind: "memorystore",
    category: "databases",
    label: GCP_RESOURCE_LABELS.memorystore,
    description: "Cache em memória gerenciado (Redis / Memcached)",
    icon: GCP_RESOURCE_ICONS.memorystore,
  },
  {
    paletteKey: "alloydb",
    kind: "alloydb",
    category: "databases",
    label: GCP_RESOURCE_LABELS.alloydb,
    description: "Banco PostgreSQL compatível de alta performance",
    icon: GCP_RESOURCE_ICONS.alloydb,
  },
  {
    paletteKey: "firebase",
    kind: "firebase",
    category: "appdev",
    label: GCP_RESOURCE_LABELS.firebase,
    description: "Plataforma de apps móveis e web",
    icon: GCP_RESOURCE_ICONS.firebase,
  },
  {
    paletteKey: "build",
    kind: "build",
    category: "cicd",
    label: GCP_RESOURCE_LABELS.build,
    description: "CI/CD — build e deploy de containers",
    icon: GCP_RESOURCE_ICONS.build,
  },
  {
    paletteKey: "artifact",
    kind: "artifact",
    category: "cicd",
    label: GCP_RESOURCE_LABELS.artifact,
    description: "Repositório de imagens e pacotes",
    icon: GCP_RESOURCE_ICONS.artifact,
  },
  {
    paletteKey: "modelregistry",
    kind: "modelregistry",
    category: "ai",
    label: GCP_RESOURCE_LABELS.modelregistry,
    description: "Registro e versionamento de modelos no Agent Platform",
    icon: GCP_RESOURCE_ICONS.modelregistry,
  },
  {
    paletteKey: "tuning",
    kind: "tuning",
    category: "ai",
    label: GCP_RESOURCE_LABELS.tuning,
    description: "Fine-tuning de modelos no Agent Platform",
    icon: GCP_RESOURCE_ICONS.tuning,
  },
  {
    paletteKey: "evaluation",
    kind: "evaluation",
    category: "ai",
    label: GCP_RESOURCE_LABELS.evaluation,
    description: "Avaliação de modelos no Agent Platform",
    icon: GCP_RESOURCE_ICONS.evaluation,
  },
  {
    paletteKey: "endpoints",
    kind: "endpoints",
    category: "ai",
    label: GCP_RESOURCE_LABELS.endpoints,
    description: "Endpoints de inferência online no Agent Platform",
    icon: GCP_RESOURCE_ICONS.endpoints,
  },
  {
    paletteKey: "batchinference",
    kind: "batchinference",
    category: "ai",
    label: GCP_RESOURCE_LABELS.batchinference,
    description: "Jobs de inferência em lote no Agent Platform",
    icon: GCP_RESOURCE_ICONS.batchinference,
  },
  {
    paletteKey: "featurestore",
    kind: "featurestore",
    category: "ai",
    label: GCP_RESOURCE_LABELS.featurestore,
    description: "Repositório centralizado de features no Agent Platform",
    icon: GCP_RESOURCE_ICONS.featurestore,
  },
  {
    paletteKey: "experiments",
    kind: "experiments",
    category: "ai",
    label: GCP_RESOURCE_LABELS.experiments,
    description: "Rastreamento de experimentos ML no Agent Platform",
    icon: GCP_RESOURCE_ICONS.experiments,
  },
  {
    paletteKey: "training",
    kind: "training",
    category: "ai",
    label: GCP_RESOURCE_LABELS.training,
    description: "Jobs de treinamento de modelos no Agent Platform",
    icon: GCP_RESOURCE_ICONS.training,
  },
  {
    paletteKey: "pipelines",
    kind: "pipelines",
    category: "ai",
    label: GCP_RESOURCE_LABELS.pipelines,
    description: "Pipelines ML orquestrados no Agent Platform",
    icon: GCP_RESOURCE_ICONS.pipelines,
  },
  {
    paletteKey: "mlmonitoring",
    kind: "mlmonitoring",
    category: "ai",
    label: GCP_RESOURCE_LABELS.mlmonitoring,
    description: "Monitoramento de modelos e experimentos no Agent Platform",
    icon: GCP_RESOURCE_ICONS.mlmonitoring,
  },
  {
    paletteKey: "cloudshell",
    kind: "cloudshell",
    category: "management",
    label: GCP_RESOURCE_LABELS.cloudshell,
    description: "Terminal efêmero no console GCP (gcloud, kubectl, bq)",
    icon: GCP_RESOURCE_ICONS.cloudshell,
  },
  {
    paletteKey: "github",
    kind: "github",
    category: "cicd",
    label: GCP_RESOURCE_LABELS.github,
    description: "Repositório de código-fonte no GitHub",
    icon: GCP_RESOURCE_ICONS.github,
  },
  {
    paletteKey: "eventarc",
    kind: "eventarc",
    category: "integration",
    label: GCP_RESOURCE_LABELS.eventarc,
    description: "Roteamento de eventos para destinos gerenciados",
    icon: GCP_RESOURCE_ICONS.eventarc,
  },
  {
    paletteKey: "apigee",
    kind: "apigee",
    category: "integration",
    label: GCP_RESOURCE_LABELS.apigee,
    description: "Gerenciamento e gateway de APIs",
    icon: GCP_RESOURCE_ICONS.apigee,
  },
  {
    paletteKey: "workbench",
    kind: "workbench",
    category: "ai",
    label: GCP_RESOURCE_LABELS.workbench,
    description: "Notebooks gerenciados no Agent Platform",
    icon: GCP_RESOURCE_ICONS.workbench,
  },
  {
    paletteKey: "notebook",
    kind: "notebook",
    category: "ai",
    label: GCP_RESOURCE_LABELS.notebook,
    description: "Instância de notebook gerenciada no Agent Platform",
    icon: GCP_RESOURCE_ICONS.notebook,
  },
  {
    paletteKey: "kms",
    kind: "kms",
    category: "security",
    label: GCP_RESOURCE_LABELS.kms,
    description: "Chaves de criptografia gerenciadas (CMEK)",
    icon: GCP_RESOURCE_ICONS.kms,
  },
  {
    paletteKey: "secretmanager",
    kind: "secretmanager",
    category: "security",
    label: GCP_RESOURCE_LABELS.secretmanager,
    description: "Armazenamento de segredos e credenciais",
    icon: GCP_RESOURCE_ICONS.secretmanager,
  },
  {
    paletteKey: "certificatemanager",
    kind: "certificatemanager",
    category: "security",
    label: GCP_RESOURCE_LABELS.certificatemanager,
    description: "Certificados TLS/SSL gerenciados ou próprios",
    icon: GCP_RESOURCE_ICONS.certificatemanager,
  },
  {
    paletteKey: "cloudarmor",
    kind: "cloudarmor",
    category: "security",
    label: GCP_RESOURCE_LABELS.cloudarmor,
    description: "WAF e proteção DDoS na borda",
    icon: GCP_RESOURCE_ICONS.cloudarmor,
  },
  {
    paletteKey: "monitoring",
    kind: "monitoring",
    category: "observability",
    label: GCP_RESOURCE_LABELS.monitoring,
    description: "Métricas, alertas e dashboards do Cloud Monitoring",
    icon: GCP_RESOURCE_ICONS.monitoring,
  },
  {
    paletteKey: "cloudlogging",
    kind: "cloudlogging",
    category: "observability",
    label: GCP_RESOURCE_LABELS.cloudlogging,
    description: "Coleta, armazenamento e análise de logs",
    icon: GCP_RESOURCE_ICONS.cloudlogging,
  },
  {
    paletteKey: "usergroup",
    kind: "usergroup",
    category: "other",
    label: GCP_RESOURCE_LABELS.usergroup,
    description: "Grupo de usuários para acesso e permissões",
    icon: GCP_RESOURCE_ICONS.usergroup,
  },
  {
    paletteKey: "pcuser",
    kind: "pcuser",
    category: "other",
    label: GCP_RESOURCE_LABELS.pcuser,
    description: "Usuário em estação de trabalho",
    icon: GCP_RESOURCE_ICONS.pcuser,
  },
  {
    paletteKey: "onprem",
    kind: "onprem",
    category: "other",
    label: GCP_RESOURCE_LABELS.onprem,
    description: "Ambiente local / datacenter corporativo",
    icon: GCP_RESOURCE_ICONS.onprem,
  },
  {
    paletteKey: "entra",
    kind: "entra",
    category: "other",
    label: GCP_RESOURCE_LABELS.entra,
    description: "Diretório de identidades Microsoft (Entra ID)",
    icon: GCP_RESOURCE_ICONS.entra,
  },
];

export function paletteItemsByCategory(
  categoryId: PaletteCategoryId,
): PaletteItemConfig[] {
  return PALETTE_ITEMS.filter((item) => item.category === categoryId);
}
