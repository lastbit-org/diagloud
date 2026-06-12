import type { NamingPatternByKind, NamingPlaceholders } from "../types/naming";
import type { DiagramNode, ResourceKind } from "../types";

export function getNodeDisplayName(node: DiagramNode): string {
  if (node.kind === "infocard") {
    return node.data.title.trim() || "Identificação";
  }
  return node.data.name;
}

function slugToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyAreaAmbiente(pattern: string, placeholders: NamingPlaceholders): string {
  const area = slugToken(placeholders.area) || "area";
  const ambiente = slugToken(placeholders.ambiente) || "ambiente";
  return pattern
    .replace(/AREA/gi, area)
    .replace(/AMBIENTE/gi, ambiente);
}

function nextSequenceFromPattern(
  pattern: string,
  placeholders: NamingPlaceholders,
  existingNames: string[],
): { prefix: string; suffix: string; padLen: number; next: number } | null {
  const hashMatch = pattern.match(/#+/);
  if (!hashMatch) return null;

  const padLen = hashMatch[0].length;
  const partial = applyAreaAmbiente(
    pattern.replace(/#+/, "{{SEQ}}"),
    placeholders,
  );
  const [prefix, suffix = ""] = partial.split("{{SEQ}}");

  let max = 0;
  const re = new RegExp(
    `^${escapeRegex(prefix)}(\\d+)${escapeRegex(suffix)}$`,
    "i",
  );
  for (const name of existingNames) {
    const match = name.match(re);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }

  return { prefix, suffix, padLen, next: max + 1 };
}

function ensureUniqueName(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) return name;
  let n = 2;
  while (existingNames.includes(`${name}-${n}`)) n += 1;
  return `${name}-${n}`;
}

export function generateResourceName(
  kind: ResourceKind,
  patterns: NamingPatternByKind,
  placeholders: NamingPlaceholders,
  nodes: DiagramNode[],
): string {
  const pattern = patterns[kind]?.trim();
  if (!pattern) {
    return fallbackName(kind, nodes);
  }

  const existingNames = nodes
    .filter((node) => node.kind === kind)
    .map((node) =>
      node.kind === "infocard" ? node.data.title : node.data.name,
    );

  const seq = nextSequenceFromPattern(pattern, placeholders, existingNames);
  if (seq) {
    const seqStr = String(seq.next).padStart(seq.padLen, "0");
    const name = `${seq.prefix}${seqStr}${seq.suffix}`;
    return ensureUniqueName(name, existingNames);
  }

  const name = applyAreaAmbiente(pattern, placeholders);
  return ensureUniqueName(name, existingNames);
}

function fallbackName(kind: ResourceKind, nodes: DiagramNode[]): string {
  const count = nodes.filter((n) => n.kind === kind).length + 1;
  switch (kind) {
    case "vpc":
      return `vpc-${count}`;
    case "subnet":
      return `subnet-${count}`;
    case "vm":
      return `vm-${count}`;
    case "storage":
      return `bucket-${count}`;
    case "sql":
      return `sql-${count}`;
    case "gke":
      return `gke-${count}`;
    case "nat":
      return `nat-${count}`;
    case "router":
      return `router-${count}`;
    case "peering":
      return `peer-${count}`;
    case "vpn":
      return `vpn-${count}`;
    case "interconnect":
      return `ic-${count}`;
    case "firewall":
      return `fw-${count}`;
    case "dns":
      return `dns-${count}`;
    case "artifact":
      return `gar-${count}`;
    case "build":
      return `cb-${count}`;
    case "kms":
      return `kms-${count}`;
    case "iam":
      return `iam-${count}`;
    case "internet":
      return "Internet";
    case "run":
      return `run-${count}`;
    case "pubsub":
      return `topic-${count}`;
    case "eventarc":
      return `ea-${count}`;
    case "bigquery":
      return `bq-${count}`;
    case "spanner":
      return `spanner-${count}`;
    case "firestore":
      return `fs-${count}`;
    case "bigtable":
      return `bt-${count}`;
    case "firebase":
      return `firebase-${count}`;
    case "workbench":
      return `wb-${count}`;
    case "notebook":
      return `nb-${count}`;
    case "spark":
      return `spark-${count}`;
    case "airflow":
      return `composer-${count}`;
    case "dataflow":
      return `dataflow-${count}`;
    case "modelregistry":
      return `mr-${count}`;
    case "zone":
      return `zona-${count}`;
    case "folder":
      return `folder-${count}`;
    case "project":
      return `proj-${count}`;
    case "entra":
      return `entra-${count}`;
    case "infocard":
      return `info-${count}`;
    case "pcuser":
      return `usuario-${count}`;
    case "onprem":
      return `onprem-${count}`;
    case "github":
      return `github-${count}`;
    case "loadbalancer":
      return `lb-${count}`;
    case "orgpolicy":
      return `orgpol-${count}`;
    case "psc":
      return `psc-${count}`;
    case "secretmanager":
      return `secret-${count}`;
  }
}

export function previewResourceName(
  kind: ResourceKind,
  patterns: NamingPatternByKind,
  placeholders: NamingPlaceholders,
  nodes: DiagramNode[],
): string {
  return generateResourceName(kind, patterns, placeholders, nodes);
}
