import type { DiagramEdge, DiagramNode } from "../types";

export type DiagramSnapshot = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export const MAX_HISTORY_ENTRIES = 50;

export function cloneDiagramSnapshot(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

export function trimHistory(past: DiagramSnapshot[]): DiagramSnapshot[] {
  if (past.length <= MAX_HISTORY_ENTRIES) return past;
  return past.slice(past.length - MAX_HISTORY_ENTRIES);
}

export function snapshotsEqual(
  a: DiagramSnapshot,
  b: DiagramSnapshot,
): boolean {
  return (
    JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
    JSON.stringify(a.edges) === JSON.stringify(b.edges)
  );
}

const PROPERTY_EDIT_ARM_MS = 500;

let propertyEditArmed = true;
let propertyEditArmTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingHistory = false;

export function setApplyingHistory(value: boolean): void {
  isApplyingHistory = value;
}

export function isHistoryApplying(): boolean {
  return isApplyingHistory;
}

export function resetPropertyEditHistoryArm(): void {
  propertyEditArmed = true;
  if (propertyEditArmTimer !== null) {
    globalThis.clearTimeout(propertyEditArmTimer);
    propertyEditArmTimer = null;
  }
}

export function recordPropertyEditHistory(
  snapshot: DiagramSnapshot,
  push: (entry: DiagramSnapshot) => void,
): void {
  if (isApplyingHistory || !propertyEditArmed) return;

  push(snapshot);
  propertyEditArmed = false;

  if (propertyEditArmTimer !== null) {
    globalThis.clearTimeout(propertyEditArmTimer);
  }
  propertyEditArmTimer = globalThis.setTimeout(() => {
    propertyEditArmed = true;
    propertyEditArmTimer = null;
  }, PROPERTY_EDIT_ARM_MS);
}

export function clearPropertyEditHistoryTimers(): void {
  if (propertyEditArmTimer !== null) {
    globalThis.clearTimeout(propertyEditArmTimer);
    propertyEditArmTimer = null;
  }
}

export function isUndoKeyboardEvent(event: KeyboardEvent): boolean {
  if (event.altKey) return false;
  const key = event.key.toLowerCase();
  return key === "z" && (event.ctrlKey || event.metaKey) && !event.shiftKey;
}

export function isRedoKeyboardEvent(event: KeyboardEvent): boolean {
  if (event.altKey) return false;
  const key = event.key.toLowerCase();
  if (!(event.ctrlKey || event.metaKey)) return false;
  return key === "y" || (key === "z" && event.shiftKey);
}
