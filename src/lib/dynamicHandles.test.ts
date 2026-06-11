import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
  getVisibleHandlesForNode,
  makeHandleId,
  matchesHandleRoles,
  normalizeHandleId,
  parseHandleId,
} from "../lib/dynamicHandles";
import type { DiagramEdge } from "../types";

describe("dynamicHandles", () => {
  it("parseia IDs no formato lado-índice", () => {
    expect(parseHandleId("left-2")).toEqual({ side: "left", index: 2 });
    expect(parseHandleId("subnet-to-vpc")).toBeNull();
  });

  it("normaliza IDs legados para o ponto único do lado", () => {
    expect(normalizeHandleId("top-out-1")).toBe("top-0");
    expect(normalizeHandleId("bottom-in-0")).toBe("bottom-0");
    expect(normalizeHandleId("left-3")).toBe("left-0");
  });

  it("valida par de handles dinâmicos", () => {
    expect(
      matchesHandleRoles(DEFAULT_SOURCE_HANDLE, DEFAULT_TARGET_HANDLE),
    ).toBe(true);
    expect(matchesHandleRoles("invalid", DEFAULT_TARGET_HANDLE)).toBe(false);
  });

  it("mantém um ponto por lado após conexões", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: "vm-1",
        target: "subnet-1",
        kind: "vm-subnet",
        sourceHandle: makeHandleId("top", 0),
        targetHandle: makeHandleId("bottom", 0),
      },
      {
        id: "e2",
        source: "vm-2",
        target: "subnet-1",
        kind: "vm-subnet",
        sourceHandle: makeHandleId("top", 0),
        targetHandle: makeHandleId("bottom", 0),
      },
    ];

    const subnetHandles = getVisibleHandlesForNode("subnet-1", edges);
    const bottomSubnet = subnetHandles.filter((h) => h.side === "bottom");
    expect(bottomSubnet.map((h) => h.index)).toEqual([0]);
  });

  it("inicia com um ponto em cada lado", () => {
    const handles = getVisibleHandlesForNode("vpc-1", []);
    expect(handles).toHaveLength(4);
    for (const side of ["top", "right", "bottom", "left"] as const) {
      expect(handles.some((h) => h.id === `${side}-0`)).toBe(true);
    }
  });
});
