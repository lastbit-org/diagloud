import { getNodeDisplayName } from "../../lib/naming";
import { resolveGraph } from "../hierarchy";
import { collectDiagramIssues } from "../validation";
import { createTerraformGenContext } from "./context";
import { generateIamTerraform } from "./generators/iam";
import { generateComputeTerraform } from "./generators/compute";
import { generateConnectionsTerraform } from "./generators/connections";
import { generateDataTerraform } from "./generators/data";
import { generateMlTerraform } from "./generators/ml";
import { generateNetworkTerraform } from "./generators/network";
import { generateOrgTerraform } from "./generators/org";
import { generatePlatformTerraform } from "./generators/platform";
import { escapeHclString } from "./hcl";
import type { DiagramDocument, DiagramNode, ResourceKind } from "../../types";
import type {
  TerraformExportOptions,
  TerraformExportResult,
} from "../../types/terraform";

export { tfName } from "./hcl";
export class TerraformGenerateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TerraformGenerateError";
  }
}

const EXPORTABLE_KINDS = new Set<ResourceKind>([
  "vpc",
  "subnet",
  "vm",
  "instancegroup",
  "storage",
  "sql",
  "gke",
  "nat",
  "router",
  "peering",
  "vpn",
  "interconnect",
  "firewall",
  "dns",
  "artifact",
  "build",
  "kms",
  "run",
  "pubsub",
  "eventarc",
  "bigquery",
  "spanner",
  "firestore",
  "bigtable",
  "memorystore",
  "alloydb",
  "notebook",
  "workbench",
  "spark",
  "airflow",
  "dataflow",
  "modelregistry",
  "tuning",
  "evaluation",
  "endpoints",
  "batchinference",
  "featurestore",
  "experiments",
  "training",
  "pipelines",
  "mlmonitoring",
  "loadbalancer",
  "cdn",
  "psc",
  "secretmanager",
  "certificatemanager",
  "apigee",
  "orgpolicy",
  "folder",
  "project",
  "cloudlogging",
  "cloudarmor",
  "knowledgecatalog",
]);

const SKIPPED_KINDS = new Set<ResourceKind>([
  "zone",
  "infocard",
  "entra",
  "pcuser",
  "onprem",
  "github",
  "azdorepo",
  "azdopipeline",
  "internet",
  "cloudshell",
  "monitoring",
  "usergroup",
]);

const TERRAFORM_FILE_ORDER = [
  "providers.tf",
  "variables.tf",
  "network.tf",
  "compute.tf",
  "data.tf",
  "platform.tf",
  "ml.tf",
  "org.tf",
  "iam.tf",
  "connections.tf",
] as const;

function buildProvidersTf(options: TerraformExportOptions): string {
  return `# Gerado pelo Diagloud — módulo "${escapeHclString(options.moduleName)}"

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "${escapeHclString(options.providerVersion)}"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.default_region
}
`;
}

function buildVariablesTf(options: TerraformExportOptions): string {
  const projectDefault = options.projectId.trim()
    ? `\n  default     = "${escapeHclString(options.projectId.trim())}"`
    : "";

  return `variable "project_id" {
  type        = string
  description = "ID do projeto GCP"${projectDefault}
}

variable "default_region" {
  type        = string
  description = "Região padrão para recursos sem região explícita no diagrama"
  default     = "${escapeHclString(options.defaultRegion)}"
}

variable "organization_id" {
  type        = string
  description = "ID numérico da organização GCP (pastas raiz)"
  default     = ""
}
`;
}

function collectWarnings(nodes: DiagramNode[]): string[] {
  const warnings: string[] = [];
  for (const node of nodes) {
    if (EXPORTABLE_KINDS.has(node.kind)) continue;
    if (SKIPPED_KINDS.has(node.kind)) {
      warnings.push(
        `"${getNodeDisplayName(node)}" (${node.kind}) é apenas visual/documentação — não exportado.`,
      );
    }
  }
  return warnings;
}

function countExportableBlocks(files: Record<string, string>): number {
  const resourcePattern = /^resource "/gm;
  let count = 0;
  for (const name of TERRAFORM_FILE_ORDER) {
    if (name === "providers.tf" || name === "variables.tf") continue;
    const content = files[name];
    if (!content) continue;
    count += content.match(resourcePattern)?.length ?? 0;
  }
  return count;
}

export function generateTerraform(
  document: DiagramDocument,
  options: TerraformExportOptions,
): TerraformExportResult {
  if (document.nodes.length === 0) {
    throw new TerraformGenerateError(
      "Adicione recursos ao diagrama antes de gerar Terraform.",
    );
  }

  if (!options.projectId.trim()) {
    throw new TerraformGenerateError(
      "Informe o ID do projeto GCP para gerar Terraform.",
    );
  }

  const errors = collectDiagramIssues(document.nodes, document.edges).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length > 0) {
    throw new TerraformGenerateError(
      `Corrija ${errors.length} erro(s) de validação antes de gerar Terraform.`,
    );
  }

  const graph = resolveGraph(document);
  const ctx = createTerraformGenContext(document, graph, options);

  const files: Record<string, string> = {
    "providers.tf": buildProvidersTf(options),
    "variables.tf": buildVariablesTf(options),
  };

  const generatedSections: Array<[keyof typeof files & string, string]> = [
    ["network.tf", generateNetworkTerraform(ctx)],
    ["compute.tf", generateComputeTerraform(ctx)],
    ["data.tf", generateDataTerraform(ctx)],
    ["platform.tf", generatePlatformTerraform(ctx)],
    ["ml.tf", generateMlTerraform(ctx)],
    ["org.tf", generateOrgTerraform(ctx)],
    ["iam.tf", generateIamTerraform(ctx)],
    ["connections.tf", generateConnectionsTerraform(ctx)],
  ];

  for (const [filename, content] of generatedSections) {
    if (content.trim()) {
      files[filename] = content.trim();
    }
  }

  if (countExportableBlocks(files) === 0) {
    throw new TerraformGenerateError(
      "Nenhum recurso GCP exportável encontrado no diagrama.",
    );
  }

  return {
    files,
    warnings: collectWarnings(document.nodes),
  };
}

export function combineTerraformFiles(
  files: Record<string, string>,
): string {
  const parts: string[] = [];
  for (const name of TERRAFORM_FILE_ORDER) {
    const content = files[name];
    if (!content) continue;
    parts.push(`# --- ${name} ---\n\n${content.trim()}`);
  }
  for (const [name, content] of Object.entries(files)) {
    if ((TERRAFORM_FILE_ORDER as readonly string[]).includes(name)) continue;
    parts.push(`# --- ${name} ---\n\n${content.trim()}`);
  }
  return `${parts.join("\n\n")}\n`;
}
