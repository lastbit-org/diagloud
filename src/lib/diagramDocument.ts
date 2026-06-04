import { handlesForEdgeKind, validateConnection } from "../model/connections";
import {
  DIAGRAM_DOCUMENT_VERSION,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramMetadata,
  type DiagramNamingMetadata,
  type DiagramNode,
  type LegacyDiagramDocument,
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

function parseNode(raw: unknown): DiagramNode {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó inválido no documento.");
  }

  const { id, kind, position, data } = raw;
  if (typeof id !== "string" || !id.trim()) {
    throw new DiagramParseError("Nó sem id válido.");
  }

  const parsedPosition = parsePosition(position);

  switch (kind) {
    case "vpc":
      return {
        id,
        kind: "vpc",
        position: parsedPosition,
        data: parseVpcData(data),
      };
    case "subnet":
      return {
        id,
        kind: "subnet",
        position: parsedPosition,
        data: parseSubnetData(data),
      };
    case "vm":
      return {
        id,
        kind: "vm",
        position: parsedPosition,
        data: parseVmData(data),
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
    !id.trim() ||
    typeof source !== "string" ||
    typeof target !== "string"
  ) {
    throw new DiagramParseError("Aresta com campos obrigatórios ausentes.");
  }

  if (kind !== "subnet-vpc" && kind !== "vm-subnet") {
    throw new DiagramParseError(`Tipo de aresta desconhecido: ${String(kind)}`);
  }

  return { id, source, target, kind };
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
  const edges = sanitizeDocumentEdges(nodes, input.edges.map((edge) => structuredClone(edge)));
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
    a.patterns.vm === b.patterns.vm
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
