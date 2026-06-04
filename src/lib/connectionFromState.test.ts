import { describe, expect, it } from "vitest";
import { connectionFromFinalState } from "./connectionFromState";
import type { FinalConnectionState } from "@xyflow/react";

function state(
  partial: Partial<FinalConnectionState> & {
    fromNode: NonNullable<FinalConnectionState["fromNode"]>;
    toNode: NonNullable<FinalConnectionState["toNode"]>;
    fromHandle: NonNullable<FinalConnectionState["fromHandle"]>;
  },
): FinalConnectionState {
  return {
    isValid: false,
    from: { x: 0, y: 0 },
    to: { x: 0, y: 0 },
    fromPosition: 1,
    toPosition: 3,
    toHandle: null,
    pointer: { x: 0, y: 0 },
    ...partial,
  } as FinalConnectionState;
}

describe("connectionFromFinalState", () => {
  it("mapeia arraste a partir de handle source", () => {
    const connection = connectionFromFinalState(
      state({
        fromNode: { id: "vm-1" } as NonNullable<FinalConnectionState["fromNode"]>,
        toNode: { id: "subnet-1" } as NonNullable<FinalConnectionState["toNode"]>,
        fromHandle: {
          id: "vm-out",
          type: "source",
        } as NonNullable<FinalConnectionState["fromHandle"]>,
        toHandle: { id: "subnet-in", type: "target" } as FinalConnectionState["toHandle"],
      }),
    );
    expect(connection).toEqual({
      source: "vm-1",
      target: "subnet-1",
      sourceHandle: "vm-out",
      targetHandle: "subnet-in",
    });
  });

  it("mapeia arraste a partir de handle target", () => {
    const connection = connectionFromFinalState(
      state({
        fromNode: { id: "subnet-1" } as NonNullable<FinalConnectionState["fromNode"]>,
        toNode: { id: "vm-1" } as NonNullable<FinalConnectionState["toNode"]>,
        fromHandle: {
          id: "subnet-in",
          type: "target",
        } as NonNullable<FinalConnectionState["fromHandle"]>,
        toHandle: { id: "vm-out", type: "source" } as FinalConnectionState["toHandle"],
      }),
    );
    expect(connection).toEqual({
      source: "vm-1",
      target: "subnet-1",
      sourceHandle: "vm-out",
      targetHandle: "subnet-in",
    });
  });
});
