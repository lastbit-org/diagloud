import type { DiagramNode, ResourceKind } from "../types";

/** Recursos GCP ficam acima das zonas por padrão. */
export const RESOURCE_LAYER_BASE = 1000;

/** Documentos antigos sem `zIndex` usam este valor até a normalização. */
export const MISSING_Z_INDEX = -1;

function resolvedZIndex(node: DiagramNode): number {
  if (typeof node.zIndex === "number") return node.zIndex;
  return node.kind === "zone" ? 0 : RESOURCE_LAYER_BASE;
}

export function defaultZIndexForKind(
  kind: ResourceKind,
  nodes: DiagramNode[],
): number {
  if (kind === "zone") {
    const zoneIndices = nodes
      .filter((node) => node.kind === "zone")
      .map((node) => resolvedZIndex(node));
    if (zoneIndices.length === 0) return 0;
    return Math.min(...zoneIndices) - 1;
  }

  const maxZ = nodes.reduce(
    (max, node) => Math.max(max, resolvedZIndex(node)),
    RESOURCE_LAYER_BASE - 1,
  );
  return maxZ + 1;
}

export function assignDefaultZIndices(nodes: DiagramNode[]): DiagramNode[] {
  let nextZone = 0;
  let nextResource = RESOURCE_LAYER_BASE;

  return nodes.map((node) => {
    if (node.zIndex !== undefined && node.zIndex !== MISSING_Z_INDEX) {
      return node;
    }
    const zIndex = node.kind === "zone" ? nextZone++ : nextResource++;
    return { ...node, zIndex };
  });
}

export function resolveNodeZIndex(node: DiagramNode): number {
  if (typeof node.zIndex === "number" && node.zIndex !== MISSING_Z_INDEX) {
    return node.zIndex;
  }
  return node.kind === "zone" ? 0 : RESOURCE_LAYER_BASE;
}

export function sortNodesByZIndex(nodes: DiagramNode[]): DiagramNode[] {
  return [...nodes].sort(
    (a, b) => resolveNodeZIndex(a) - resolveNodeZIndex(b),
  );
}

export function bringNodeToFront(
  nodes: DiagramNode[],
  id: string,
): DiagramNode[] {
  const maxZ = nodes.reduce(
    (max, node) => Math.max(max, resolveNodeZIndex(node)),
    0,
  );
  return nodes.map((node) =>
    node.id === id ? { ...node, zIndex: maxZ + 1 } : node,
  );
}

export function sendNodeToBack(
  nodes: DiagramNode[],
  id: string,
): DiagramNode[] {
  const minZ = nodes.reduce(
    (min, node) => Math.min(min, resolveNodeZIndex(node)),
    0,
  );
  return nodes.map((node) =>
    node.id === id ? { ...node, zIndex: minZ - 1 } : node,
  );
}
