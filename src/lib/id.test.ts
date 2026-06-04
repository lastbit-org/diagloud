import { describe, expect, it } from "vitest";
import {
  createEdgeId,
  createNodeId,
  isStableUuidDiagramId,
  isValidDiagramId,
  nodeIdMatchesKind,
} from "./id";

describe("diagram ids", () => {
  it("cria IDs de nó com prefixo e uuid", () => {
    const id = createNodeId("vpc");
    expect(id).toMatch(/^vpc-[0-9a-f-]{36}$/i);
    expect(isStableUuidDiagramId(id)).toBe(true);
  });

  it("cria IDs de aresta com prefixo edge", () => {
    const id = createEdgeId();
    expect(id).toMatch(/^edge-[0-9a-f-]{36}$/i);
    expect(isStableUuidDiagramId(id)).toBe(true);
  });

  it("aceita IDs legados na reimportação", () => {
    expect(isValidDiagramId("vpc-1")).toBe(true);
    expect(isStableUuidDiagramId("vpc-1")).toBe(false);
  });

  it("valida correspondência nó ↔ kind", () => {
    const id = createNodeId("subnet");
    expect(nodeIdMatchesKind(id, "subnet")).toBe(true);
    expect(nodeIdMatchesKind(id, "vpc")).toBe(false);
  });
});
