import { describe, expect, it } from "vitest";
import {
  assignDefaultZIndices,
  bringNodeToFront,
  defaultZIndexForKind,
  MISSING_Z_INDEX,
  RESOURCE_LAYER_BASE,
  sendNodeToBack,
  resolveNodeZIndex,
  sortNodesByZIndex,
} from "./nodeLayers";
import type { DiagramNode } from "../types";

const zone: DiagramNode = {
  id: "zone-1",
  kind: "zone",
  position: { x: 0, y: 0 },
  zIndex: MISSING_Z_INDEX,
  data: {
    name: "Projeto",
    purpose: "project",
    colorId: "slate",
    width: 320,
    height: 200,
  },
};

const vpc: DiagramNode = {
  id: "vpc-1",
  kind: "vpc",
  position: { x: 10, y: 10 },
  zIndex: MISSING_Z_INDEX,
  data: { name: "vpc-main" },
};

describe("nodeLayers", () => {
  it("atribui zonas abaixo dos recursos em documentos legados", () => {
    const normalized = assignDefaultZIndices([zone, vpc]);
    expect(resolveNodeZIndex(normalized[0]!)).toBe(0);
    expect(resolveNodeZIndex(normalized[1]!)).toBe(RESOURCE_LAYER_BASE);
  });

  it("novos recursos entram acima das zonas existentes", () => {
    const existingZone: DiagramNode = { ...zone, zIndex: 2 };
    expect(defaultZIndexForKind("vm", [existingZone])).toBe(RESOURCE_LAYER_BASE);
  });

  it("reordena nós por zIndex", () => {
    const ordered = sortNodesByZIndex([
      { ...vpc, zIndex: 1005 },
      { ...zone, zIndex: 0 },
    ]);
    expect(ordered.map((node) => node.id)).toEqual(["zone-1", "vpc-1"]);
  });

  it("traz nó para frente e envia para trás", () => {
    const nodes = assignDefaultZIndices([zone, vpc]);
    const front = bringNodeToFront(nodes, zone.id);
    expect(front.find((node) => node.id === zone.id)?.zIndex).toBeGreaterThan(
      front.find((node) => node.id === vpc.id)?.zIndex ?? 0,
    );

    const back = sendNodeToBack(front, vpc.id);
    expect(back.find((node) => node.id === vpc.id)?.zIndex).toBeLessThan(
      back.find((node) => node.id === zone.id)?.zIndex ?? 0,
    );
  });
});
