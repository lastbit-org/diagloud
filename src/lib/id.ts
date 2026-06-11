import type { ResourceKind } from "../types";

/** UUID v4 (RFC 4122). */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ID_PREFIXES = [
  "vpc",
  "subnet",
  "vm",
  "storage",
  "sql",
  "gke",
  "nat",
  "peering",
  "vpn",
  "interconnect",
  "firewall",
  "artifact",
  "build",
  "kms",
  "internet",
  "run",
  "pubsub",
  "eventarc",
  "bigquery",
  "spanner",
  "firestore",
  "workbench",
  "spark",
  "airflow",
  "dataflow",
  "modelregistry",
  "zone",
  "folder",
  "project",
  "entra",
  "infocard",
  "pcuser",
  "onprem",
  "edge",
] as const;

export type DiagramIdPrefix = (typeof ID_PREFIXES)[number];

/** Novo nó: `{kind}-{uuid}` — estável entre export/import. */
export function createNodeId(kind: ResourceKind): string {
  return `${kind}-${crypto.randomUUID()}`;
}

/** Nova aresta: `edge-{uuid}`. */
export function createEdgeId(): string {
  return `edge-${crypto.randomUUID()}`;
}

/** @deprecated Use createNodeId / createEdgeId. */
export function createId(prefix = "node"): string {
  if (prefix === "edge") return createEdgeId();
  if (
    prefix === "vpc" ||
    prefix === "subnet" ||
    prefix === "vm" ||
    prefix === "storage" ||
    prefix === "sql" ||
    prefix === "gke" ||
    prefix === "nat" ||
    prefix === "peering" ||
    prefix === "vpn" ||
    prefix === "interconnect" ||
    prefix === "firewall" ||
    prefix === "artifact" ||
    prefix === "build" ||
    prefix === "kms" ||
    prefix === "internet" ||
    prefix === "run" ||
    prefix === "pubsub" ||
    prefix === "eventarc" ||
    prefix === "bigquery" ||
    prefix === "spanner" ||
    prefix === "firestore" ||
    prefix === "workbench" ||
    prefix === "spark" ||
    prefix === "airflow" ||
    prefix === "dataflow" ||
    prefix === "modelregistry" ||
    prefix === "zone" ||
    prefix === "folder" ||
    prefix === "project" ||
    prefix === "entra" ||
    prefix === "infocard" ||
    prefix === "pcuser" ||
    prefix === "onprem"
  ) {
    return createNodeId(prefix);
  }
  return `${prefix}-${crypto.randomUUID()}`;
}

export function isUuid(value: string): boolean {
  return UUID_V4.test(value);
}

const ID_PREFIX_PATTERN =
  /^(vpc|subnet|vm|storage|sql|gke|nat|peering|vpn|interconnect|firewall|artifact|build|kms|internet|run|pubsub|eventarc|bigquery|spanner|firestore|workbench|spark|airflow|dataflow|modelregistry|zone|folder|project|entra|infocard|pcuser|onprem|edge)-(.+)$/;

function parsePrefixedId(
  id: string,
): { prefix: DiagramIdPrefix; suffix: string } | null {
  const match = id.match(ID_PREFIX_PATTERN);
  if (!match) return null;
  return { prefix: match[1] as DiagramIdPrefix, suffix: match[2] };
}

/** ID persistido no JSON (`{prefix}-{uuid}` ou legado `{prefix}-{n}`). */
export function isValidDiagramId(id: string): boolean {
  if (typeof id !== "string" || !id.trim() || id.startsWith("__")) {
    return false;
  }
  const parsed = parsePrefixedId(id);
  if (parsed) return parsed.suffix.length > 0;
  return id.length > 0;
}

export function isStableUuidDiagramId(id: string): boolean {
  const parsed = parsePrefixedId(id);
  if (!parsed) return false;
  return isUuid(parsed.suffix);
}

export function nodeIdMatchesKind(id: string, kind: ResourceKind): boolean {
  const parsed = parsePrefixedId(id);
  if (parsed) return parsed.prefix === kind;
  return id === kind;
}
