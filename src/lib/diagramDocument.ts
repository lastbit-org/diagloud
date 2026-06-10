import { assignDefaultZIndices, MISSING_Z_INDEX } from "./nodeLayers";
import { isZoneColorId } from "./zoneColors";
import { resolveEdgeHandles } from "./dynamicHandles";
import { validateConnection } from "../model/connections";
import { migrateSqlVpcEdge } from "../model/sqlSubnet";
import {
  isValidDiagramId,
  nodeIdMatchesKind,
} from "./id";
import { DEFAULT_NAMING_PATTERNS } from "../types/naming";
import {
  DIAGRAM_DOCUMENT_VERSION,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramMetadata,
  type DiagramNamingMetadata,
  type DiagramNode,
  type LegacyDiagramDocument,
  type GkeProps,
  type SqlProps,
  type StorageProps,
  type SubnetProps,
  type VmProps,
  type VpcProps,
  type NatProps,
  type PeeringProps,
  type VpnProps,
  type ArtifactProps,
  type InternetProps,
  type RunProps,
  type PubsubProps,
  type   BigqueryProps,
  type ZoneProps,
  type ZonePurpose,
} from "../types";

export const DIAGRAM_STORAGE_KEY = "diagloud-diagram";

export class DiagramParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagramParseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePosition(raw: unknown): { x: number; y: number } {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó com posição inválida.");
  }
  const { x, y } = raw;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
    throw new DiagramParseError("Nó com posição inválida.");
  }
  return { x, y };
}

function parseVpcData(raw: unknown): VpcProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de VPC inválidos.");
  }
  return { name: raw.name };
}

function parseSubnetData(raw: unknown): SubnetProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.cidr !== "string"
  ) {
    throw new DiagramParseError("Dados de sub-rede inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
    cidr: raw.cidr,
  };
}

function parseVmData(raw: unknown): VmProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.machineType !== "string"
  ) {
    throw new DiagramParseError("Dados de VM inválidos.");
  }
  const data: VmProps = {
    name: raw.name,
    machineType: raw.machineType,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

const STORAGE_CLASSES = new Set([
  "STANDARD",
  "NEARLINE",
  "COLDLINE",
  "ARCHIVE",
]);

function parseStorageData(raw: unknown): StorageProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string" ||
    typeof raw.storageClass !== "string" ||
    !STORAGE_CLASSES.has(raw.storageClass)
  ) {
    throw new DiagramParseError("Dados de Cloud Storage inválidos.");
  }
  const accessMode =
    raw.accessMode === "vm" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";

  return {
    name: raw.name,
    location: raw.location,
    storageClass: raw.storageClass as StorageProps["storageClass"],
    accessMode,
  };
}

const SQL_ENGINES = new Set(["MYSQL_8_0", "POSTGRES_15"]);

function parseSqlData(raw: unknown): SqlProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.engine !== "string" ||
    !SQL_ENGINES.has(raw.engine)
  ) {
    throw new DiagramParseError("Dados de Cloud SQL inválidos.");
  }
  const accessMode =
    raw.accessMode === "private" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";
  const data: SqlProps = {
    name: raw.name,
    region: raw.region,
    engine: raw.engine as SqlProps["engine"],
    accessMode,
  };
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parseGkeData(raw: unknown): GkeProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.machineType !== "string" ||
    typeof raw.nodeCount !== "number" ||
    !Number.isInteger(raw.nodeCount) ||
    raw.nodeCount < 1
  ) {
    throw new DiagramParseError("Dados de GKE inválidos.");
  }
  const data: GkeProps = {
    name: raw.name,
    nodeCount: raw.nodeCount,
    machineType: raw.machineType,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parseNatData(raw: unknown): NatProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud NAT inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

const ARTIFACT_FORMATS = new Set(["DOCKER", "MAVEN", "NPM"]);

function parseArtifactData(raw: unknown): ArtifactProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string" ||
    typeof raw.format !== "string" ||
    !ARTIFACT_FORMATS.has(raw.format)
  ) {
    throw new DiagramParseError("Dados de Artifact Registry inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
    format: raw.format as ArtifactProps["format"],
  };
}

function parsePeeringData(raw: unknown): PeeringProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de VPC Peering inválidos.");
  }
  return { name: raw.name };
}

function parseVpnData(raw: unknown): VpnProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud VPN inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

function parseInternetData(raw: unknown): InternetProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Internet inválidos.");
  }
  return { name: raw.name };
}

function parseRunData(raw: unknown): RunProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.cpu !== "string" ||
    typeof raw.memory !== "string" ||
    typeof raw.minInstances !== "number" ||
    !Number.isInteger(raw.minInstances) ||
    raw.minInstances < 0
  ) {
    throw new DiagramParseError("Dados de Cloud Run inválidos.");
  }
  const accessMode =
    raw.accessMode === "vpc" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";
  const data: RunProps = {
    name: raw.name,
    cpu: raw.cpu,
    memory: raw.memory,
    minInstances: raw.minInstances,
    accessMode,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parsePubsubData(raw: unknown): PubsubProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Pub/Sub inválidos.");
  }
  return { name: raw.name };
}

function parseBigqueryData(raw: unknown): BigqueryProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de BigQuery inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseZonePurpose(value: unknown): ZonePurpose {
  if (value === "project" || value === "vpc-area" || value === "perimeter") {
    return value;
  }
  throw new DiagramParseError("Propósito de zona inválido.");
}

function parseZoneData(raw: unknown): ZoneProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de zona inválidos.");
  }

  const width =
    typeof raw.width === "number" && Number.isFinite(raw.width)
      ? Math.max(120, Math.round(raw.width))
      : 320;
  const height =
    typeof raw.height === "number" && Number.isFinite(raw.height)
      ? Math.max(80, Math.round(raw.height))
      : 200;
  const colorId =
    typeof raw.colorId === "string" && isZoneColorId(raw.colorId)
      ? raw.colorId
      : "slate";

  return {
    name: raw.name,
    purpose: parseZonePurpose(raw.purpose),
    colorId,
    width,
    height,
  };
}

function parseZIndex(raw: Record<string, unknown>): number {
  if (typeof raw.zIndex === "number" && Number.isFinite(raw.zIndex)) {
    return Math.round(raw.zIndex);
  }
  return MISSING_Z_INDEX;
}

function parseNode(raw: unknown): DiagramNode {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó inválido no documento.");
  }

  const { id, kind, position, data } = raw;
  const zIndex = parseZIndex(raw);
  if (typeof id !== "string" || !isValidDiagramId(id)) {
    throw new DiagramParseError(`ID de nó inválido: ${String(id)}`);
  }

  const parsedPosition = parsePosition(position);
  const nodeId = id;

  switch (kind) {
    case "vpc":
      if (!nodeIdMatchesKind(nodeId, "vpc")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo VPC.`);
      }
      return {
        id: nodeId,
        kind: "vpc",
        position: parsedPosition,
        zIndex,
        data: parseVpcData(data),
      };
    case "subnet":
      if (!nodeIdMatchesKind(nodeId, "subnet")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo sub-rede.`);
      }
      return {
        id: nodeId,
        kind: "subnet",
        position: parsedPosition,
        zIndex,
        data: parseSubnetData(data),
      };
    case "vm":
      if (!nodeIdMatchesKind(nodeId, "vm")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo VM.`);
      }
      return {
        id: nodeId,
        kind: "vm",
        position: parsedPosition,
        zIndex,
        data: parseVmData(data),
      };
    case "storage":
      if (!nodeIdMatchesKind(nodeId, "storage")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Storage.`,
        );
      }
      return {
        id: nodeId,
        kind: "storage",
        position: parsedPosition,
        zIndex,
        data: parseStorageData(data),
      };
    case "sql":
      if (!nodeIdMatchesKind(nodeId, "sql")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud SQL.`,
        );
      }
      return {
        id: nodeId,
        kind: "sql",
        position: parsedPosition,
        zIndex,
        data: parseSqlData(data),
      };
    case "gke":
      if (!nodeIdMatchesKind(nodeId, "gke")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo GKE.`);
      }
      return {
        id: nodeId,
        kind: "gke",
        position: parsedPosition,
        zIndex,
        data: parseGkeData(data),
      };
    case "nat":
      if (!nodeIdMatchesKind(nodeId, "nat")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Cloud NAT.`);
      }
      return {
        id: nodeId,
        kind: "nat",
        position: parsedPosition,
        zIndex,
        data: parseNatData(data),
      };
    case "peering":
      if (!nodeIdMatchesKind(nodeId, "peering")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo VPC Peering.`,
        );
      }
      return {
        id: nodeId,
        kind: "peering",
        position: parsedPosition,
        zIndex,
        data: parsePeeringData(data),
      };
    case "vpn":
      if (!nodeIdMatchesKind(nodeId, "vpn")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud VPN.`,
        );
      }
      return {
        id: nodeId,
        kind: "vpn",
        position: parsedPosition,
        zIndex,
        data: parseVpnData(data),
      };
    case "artifact":
      if (!nodeIdMatchesKind(nodeId, "artifact")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Artifact Registry.`,
        );
      }
      return {
        id: nodeId,
        kind: "artifact",
        position: parsedPosition,
        zIndex,
        data: parseArtifactData(data),
      };
    case "internet":
      if (!nodeIdMatchesKind(nodeId, "internet")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Internet.`);
      }
      return {
        id: nodeId,
        kind: "internet",
        position: parsedPosition,
        zIndex,
        data: parseInternetData(data),
      };
    case "run":
      if (!nodeIdMatchesKind(nodeId, "run")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Cloud Run.`);
      }
      return {
        id: nodeId,
        kind: "run",
        position: parsedPosition,
        zIndex,
        data: parseRunData(data),
      };
    case "pubsub":
      if (!nodeIdMatchesKind(nodeId, "pubsub")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Pub/Sub.`);
      }
      return {
        id: nodeId,
        kind: "pubsub",
        position: parsedPosition,
        zIndex,
        data: parsePubsubData(data),
      };
    case "bigquery":
      if (!nodeIdMatchesKind(nodeId, "bigquery")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo BigQuery.`);
      }
      return {
        id: nodeId,
        kind: "bigquery",
        position: parsedPosition,
        zIndex,
        data: parseBigqueryData(data),
      };
    case "zone":
      if (!nodeIdMatchesKind(nodeId, "zone")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Zona.`);
      }
      return {
        id: nodeId,
        kind: "zone",
        position: parsedPosition,
        zIndex,
        data: parseZoneData(data),
      };
    default:
      throw new DiagramParseError(`Tipo de recurso desconhecido: ${String(kind)}`);
  }
}

function parseEdge(raw: unknown): DiagramEdge {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Aresta inválida no documento.");
  }

  const { id, source, target, kind, sourceHandle, targetHandle } = raw;
  if (
    typeof id !== "string" ||
    typeof source !== "string" ||
    typeof target !== "string" ||
    !isValidDiagramId(id) ||
    !isValidDiagramId(source) ||
    !isValidDiagramId(target)
  ) {
    throw new DiagramParseError("Aresta com id, source ou target inválido.");
  }

  if (source === target) {
    throw new DiagramParseError("Aresta não pode ligar um nó a si mesmo.");
  }

  if (
    kind !== "subnet-vpc" &&
    kind !== "vm-subnet" &&
    kind !== "vm-storage" &&
    kind !== "sql-subnet" &&
    kind !== "gke-subnet" &&
    kind !== "nat-vpc" &&
    kind !== "peering-vpc" &&
    kind !== "vpn-vpc" &&
    kind !== "internet-nat" &&
    kind !== "internet-vpn" &&
    kind !== "subnet-nat" &&
    kind !== "gke-artifact" &&
    kind !== "vm-artifact" &&
    kind !== "run-subnet" &&
    kind !== "run-artifact" &&
    kind !== "pubsub-run" &&
    kind !== "pubsub-storage" &&
    kind !== "pubsub-bigquery" &&
    kind !== "sql-vpc"
  ) {
    throw new DiagramParseError(`Tipo de aresta desconhecido: ${String(kind)}`);
  }

  const parsed: DiagramEdge = {
    id,
    source,
    target,
    kind: kind === "sql-vpc" ? "sql-vpc" : kind,
  } as DiagramEdge;

  if (typeof sourceHandle === "string") {
    parsed.sourceHandle = sourceHandle;
  }
  if (typeof targetHandle === "string") {
    parsed.targetHandle = targetHandle;
  }

  return parsed;
}

function assertUniqueNodeIds(nodes: DiagramNode[]): void {
  const seen = new Set<string>();
  for (const node of nodes) {
    if (seen.has(node.id)) {
      throw new DiagramParseError(`ID de nó duplicado: ${node.id}`);
    }
    seen.add(node.id);
  }
}

/** Mantém arestas cujo source/target existem nos nós importados (referências intactas). */
export function filterEdgesWithValidReferences(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
}

function parseNamingMetadata(raw: unknown): DiagramNamingMetadata | undefined {
  if (!isRecord(raw)) return undefined;

  const { area, ambiente, patterns, isActive } = raw;
  if (
    typeof area !== "string" ||
    typeof ambiente !== "string" ||
    typeof isActive !== "boolean" ||
    !isRecord(patterns) ||
    typeof patterns.vpc !== "string" ||
    typeof patterns.subnet !== "string" ||
    typeof patterns.vm !== "string"
  ) {
    return undefined;
  }

  return {
    area,
    ambiente,
    isActive,
    patterns: {
      vpc: patterns.vpc,
      subnet: patterns.subnet,
      vm: patterns.vm,
      storage:
        typeof patterns.storage === "string"
          ? patterns.storage
          : DEFAULT_NAMING_PATTERNS.storage,
      sql:
        typeof patterns.sql === "string"
          ? patterns.sql
          : DEFAULT_NAMING_PATTERNS.sql,
      gke:
        typeof patterns.gke === "string"
          ? patterns.gke
          : DEFAULT_NAMING_PATTERNS.gke,
      nat:
        typeof patterns.nat === "string"
          ? patterns.nat
          : DEFAULT_NAMING_PATTERNS.nat,
      peering:
        typeof patterns.peering === "string"
          ? patterns.peering
          : DEFAULT_NAMING_PATTERNS.peering,
      vpn:
        typeof patterns.vpn === "string"
          ? patterns.vpn
          : DEFAULT_NAMING_PATTERNS.vpn,
      artifact:
        typeof patterns.artifact === "string"
          ? patterns.artifact
          : DEFAULT_NAMING_PATTERNS.artifact,
      internet:
        typeof patterns.internet === "string"
          ? patterns.internet
          : DEFAULT_NAMING_PATTERNS.internet,
      run:
        typeof patterns.run === "string"
          ? patterns.run
          : DEFAULT_NAMING_PATTERNS.run,
      pubsub:
        typeof patterns.pubsub === "string"
          ? patterns.pubsub
          : DEFAULT_NAMING_PATTERNS.pubsub,
      bigquery:
        typeof patterns.bigquery === "string"
          ? patterns.bigquery
          : DEFAULT_NAMING_PATTERNS.bigquery,
      zone:
        typeof patterns.zone === "string"
          ? patterns.zone
          : DEFAULT_NAMING_PATTERNS.zone,
    },
  };
}

function parseMetadata(raw: unknown): DiagramMetadata {
  if (!isRecord(raw)) {
    return createDocumentMetadata();
  }

  const savedAt =
    typeof raw.savedAt === "string" && raw.savedAt
      ? raw.savedAt
      : new Date().toISOString();
  const generator = raw.generator === "diagloud" ? "diagloud" : "diagloud";
  const naming = parseNamingMetadata(raw.naming);

  return {
    savedAt,
    generator,
    ...(naming ? { naming } : {}),
  };
}

export function createDocumentMetadata(
  partial?: Partial<DiagramMetadata>,
): DiagramMetadata {
  return {
    savedAt: partial?.savedAt ?? new Date().toISOString(),
    generator: "diagloud",
    ...(partial?.naming ? { naming: partial.naming } : {}),
  };
}

export function buildDiagramDocument(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  naming?: DiagramNamingMetadata,
): DiagramDocument {
  return {
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata: createDocumentMetadata(naming ? { naming } : undefined),
  };
}

/** Remove arestas inválidas ou cíclicas ao importar, preservando ordem. */
export function sanitizeDocumentEdges(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramEdge[] {
  const accepted: DiagramEdge[] = [];
  for (const edge of edges) {
    const { sourceHandle, targetHandle } = resolveEdgeHandles(edge);
    const result = validateConnection(
      {
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
      },
      { nodes, edges: accepted },
    );
    if (result.valid) {
      accepted.push({
        ...edge,
        kind: result.edgeKind,
        source: result.source,
        target: result.target,
        sourceHandle: result.sourceHandle ?? sourceHandle,
        targetHandle: result.targetHandle ?? targetHandle,
      });
    }
  }
  return accepted;
}

export function normalizeLoadedDocument(
  input: DiagramDocument | LegacyDiagramDocument,
): DiagramDocument {
  const nodes = assignDefaultZIndices(
    input.nodes.map((node) => structuredClone(node)),
  );
  assertUniqueNodeIds(nodes);

  const clonedEdges = input.edges.map((edge) => structuredClone(edge));
  const migratedEdges = clonedEdges
    .map((edge) => migrateSqlVpcEdge(edge, nodes, clonedEdges))
    .filter((edge): edge is DiagramEdge => edge !== null);
  const referencedEdges = filterEdgesWithValidReferences(nodes, migratedEdges);
  const edges = sanitizeDocumentEdges(nodes, referencedEdges);
  const metadata =
    "metadata" in input && input.metadata
      ? parseMetadata(input.metadata)
      : createDocumentMetadata();

  return {
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata,
  };
}

export function parseDiagramDocument(json: string): DiagramDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DiagramParseError("JSON inválido.");
  }

  if (!isRecord(parsed)) {
    throw new DiagramParseError("Documento deve ser um objeto JSON.");
  }

  if (parsed.version !== DIAGRAM_DOCUMENT_VERSION) {
    throw new DiagramParseError(
      `Versão não suportada: ${String(parsed.version)} (esperado ${DIAGRAM_DOCUMENT_VERSION}).`,
    );
  }

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new DiagramParseError("Documento deve conter arrays nodes e edges.");
  }

  const nodes = parsed.nodes.map(parseNode);
  const edges = parsed.edges.map(parseEdge);
  const metadata = parseMetadata(parsed.metadata);

  return normalizeLoadedDocument({
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata,
  });
}

export function serializeDiagramDocument(document: DiagramDocument): string {
  return JSON.stringify(document, null, 2);
}

function namingMetadataEqual(
  a: DiagramNamingMetadata | undefined,
  b: DiagramNamingMetadata | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.area === b.area &&
    a.ambiente === b.ambiente &&
    a.isActive === b.isActive &&
    a.patterns.vpc === b.patterns.vpc &&
    a.patterns.subnet === b.patterns.subnet &&
    a.patterns.vm === b.patterns.vm &&
    a.patterns.storage === b.patterns.storage &&
    a.patterns.sql === b.patterns.sql &&
    a.patterns.gke === b.patterns.gke &&
    a.patterns.nat === b.patterns.nat &&
    a.patterns.peering === b.patterns.peering &&
    a.patterns.vpn === b.patterns.vpn &&
    a.patterns.artifact === b.patterns.artifact &&
    a.patterns.internet === b.patterns.internet &&
    a.patterns.run === b.patterns.run &&
    a.patterns.pubsub === b.patterns.pubsub &&
    a.patterns.bigquery === b.patterns.bigquery
  );
}

export function documentsEqual(
  a: DiagramDocument,
  b: DiagramDocument,
  options?: { ignoreSavedAt?: boolean },
): boolean {
  if (a.version !== b.version) return false;
  if (JSON.stringify(a.nodes) !== JSON.stringify(b.nodes)) return false;
  if (JSON.stringify(a.edges) !== JSON.stringify(b.edges)) return false;

  if (a.metadata.generator !== b.metadata.generator) return false;
  if (!namingMetadataEqual(a.metadata.naming, b.metadata.naming)) return false;

  if (!(options?.ignoreSavedAt ?? true)) {
    return a.metadata.savedAt === b.metadata.savedAt;
  }

  return true;
}

export function downloadDiagramDocument(
  diagram: DiagramDocument,
  filename?: string,
): void {
  const blob = new Blob([serializeDiagramDocument(diagram)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const stamp = diagram.metadata.savedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = filename ?? `diagloud-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
