import { handlesForEdgeKind, validateConnection } from "../model/connections";
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
  type StorageProps,
  type SubnetProps,
  type VmProps,
  type VpcProps,
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

function parseNode(raw: unknown): DiagramNode {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó inválido no documento.");
  }

  const { id, kind, position, data } = raw;
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
        data: parseStorageData(data),
      };
    default:
      throw new DiagramParseError(`Tipo de recurso desconhecido: ${String(kind)}`);
  }
}

function parseEdge(raw: unknown): DiagramEdge {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Aresta inválida no documento.");
  }

  const { id, source, target, kind } = raw;
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

  if (kind !== "subnet-vpc" && kind !== "vm-subnet" && kind !== "vm-storage") {
    throw new DiagramParseError(`Tipo de aresta desconhecido: ${String(kind)}`);
  }

  return { id, source, target, kind };
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
    const { sourceHandle, targetHandle } = handlesForEdgeKind(edge.kind);
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
      accepted.push(edge);
    }
  }
  return accepted;
}

export function normalizeLoadedDocument(
  input: DiagramDocument | LegacyDiagramDocument,
): DiagramDocument {
  const nodes = input.nodes.map((node) => structuredClone(node));
  assertUniqueNodeIds(nodes);

  const referencedEdges = filterEdgesWithValidReferences(
    nodes,
    input.edges.map((edge) => structuredClone(edge)),
  );
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
    a.patterns.storage === b.patterns.storage
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
