import type { Connection, FinalConnectionState } from "@xyflow/react";

/** Converte o estado final do React Flow em uma Connection source → target. */
export function connectionFromFinalState(
  state: FinalConnectionState,
): Connection | null {
  if (!state.fromNode || !state.toNode || !state.fromHandle) {
    return null;
  }

  if (state.fromHandle.type === "source") {
    return {
      source: state.fromNode.id,
      target: state.toNode.id,
      sourceHandle: state.fromHandle.id ?? null,
      targetHandle: state.toHandle?.id ?? null,
    };
  }

  return {
    source: state.toNode.id,
    target: state.fromNode.id,
    sourceHandle: state.toHandle?.id ?? null,
    targetHandle: state.fromHandle.id ?? null,
  };
}
