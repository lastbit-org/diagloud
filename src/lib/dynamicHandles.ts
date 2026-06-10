import { Position } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { DiagramEdge } from "../types";

export type HandleSide = "top" | "right" | "bottom" | "left";

export const HANDLE_SIDES: HandleSide[] = ["top", "right", "bottom", "left"];

const HANDLE_ID_PATTERN = /^(top|right|bottom|left)-(\d+)$/;
const LEGACY_HANDLE_ID_PATTERN = /^(top|right|bottom|left)-(out|in)-(\d+)$/;

export type ParsedHandleId = {
  side: HandleSide;
  index: number;
};

export function makeHandleId(side: HandleSide, index: number): string {
  return `${side}-${index}`;
}

export function parseHandleId(id: string): ParsedHandleId | null {
  const legacy = id.match(LEGACY_HANDLE_ID_PATTERN);
  if (legacy) {
    return {
      side: legacy[1] as HandleSide,
      index: Number.parseInt(legacy[3], 10),
    };
  }

  const match = id.match(HANDLE_ID_PATTERN);
  if (!match) return null;
  return {
    side: match[1] as HandleSide,
    index: Number.parseInt(match[2], 10),
  };
}

export function normalizeHandleId(id: string | null | undefined): string | null {
  if (!id) return null;
  const parsed = parseHandleId(id);
  if (!parsed) return null;
  return makeHandleId(parsed.side, parsed.index);
}

export function isValidHandleId(id: string | null | undefined): boolean {
  return normalizeHandleId(id) !== null;
}

export function matchesHandleRoles(
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
): boolean {
  return isValidHandleId(sourceHandle) && isValidHandleId(targetHandle);
}

export type VisibleHandle = {
  id: string;
  side: HandleSide;
  index: number;
};

function maxIndexUsedOnSide(
  nodeId: string,
  side: HandleSide,
  edges: DiagramEdge[],
): number {
  let max = -1;
  for (const edge of edges) {
    const handleIds: (string | undefined)[] = [];
    if (edge.source === nodeId) handleIds.push(edge.sourceHandle);
    if (edge.target === nodeId) handleIds.push(edge.targetHandle);

    for (const handleId of handleIds) {
      const normalized = normalizeHandleId(handleId);
      if (!normalized) continue;
      const parsed = parseHandleId(normalized);
      if (!parsed || parsed.side !== side) continue;
      max = Math.max(max, parsed.index);
    }
  }
  return max;
}

/** Um ponto por lado; ao conectar, surge o próximo índice no mesmo lado. */
export function getVisibleHandlesForNode(
  nodeId: string,
  edges: DiagramEdge[],
): VisibleHandle[] {
  const handles: VisibleHandle[] = [];

  for (const side of HANDLE_SIDES) {
    const maxUsed = maxIndexUsedOnSide(nodeId, side, edges);
    const count = maxUsed + 2;
    for (let index = 0; index < count; index++) {
      handles.push({
        id: makeHandleId(side, index),
        side,
        index,
      });
    }
  }

  return handles;
}

export function sideToPosition(side: HandleSide): Position {
  switch (side) {
    case "top":
      return Position.Top;
    case "right":
      return Position.Right;
    case "bottom":
      return Position.Bottom;
    case "left":
      return Position.Left;
  }
}

export function handleStyle(
  side: HandleSide,
  index: number,
  totalOnSide: number,
): CSSProperties {
  const pct =
    totalOnSide <= 1 ? 50 : ((index + 1) / (totalOnSide + 1)) * 100;

  switch (side) {
    case "top":
      return { left: `${pct}%`, transform: "translate(-50%, -50%)" };
    case "bottom":
      return { left: `${pct}%`, transform: "translate(-50%, 50%)" };
    case "left":
      return { top: `${pct}%`, transform: "translate(-50%, -50%)" };
    case "right":
      return { top: `${pct}%`, transform: "translate(50%, -50%)" };
  }
}

export function countOnSide(
  handles: VisibleHandle[],
  side: HandleSide,
): number {
  return handles.filter((h) => h.side === side).length;
}

export const DEFAULT_SOURCE_HANDLE = makeHandleId("bottom", 0);
export const DEFAULT_TARGET_HANDLE = makeHandleId("top", 0);

/** @deprecated Use DEFAULT_SOURCE_HANDLE */
export const DEFAULT_EGRESS_HANDLE = DEFAULT_SOURCE_HANDLE;

/** @deprecated Use DEFAULT_TARGET_HANDLE */
export const DEFAULT_INGRESS_HANDLE = DEFAULT_TARGET_HANDLE;

export function resolveEdgeHandles(
  edge: Pick<DiagramEdge, "sourceHandle" | "targetHandle">,
): {
  sourceHandle: string;
  targetHandle: string;
} {
  return {
    sourceHandle:
      normalizeHandleId(edge.sourceHandle) ?? DEFAULT_SOURCE_HANDLE,
    targetHandle:
      normalizeHandleId(edge.targetHandle) ?? DEFAULT_TARGET_HANDLE,
  };
}
