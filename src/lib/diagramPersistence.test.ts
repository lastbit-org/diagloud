import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { createNodeId } from "./id";
import {
  clearDiagramLocalStorage,
  DIAGRAM_STORAGE_KEY,
  hasDiagramInLocalStorage,
  loadDiagramFromLocalStorage,
  saveDiagramToLocalStorage,
} from "./diagramPersistence";
import { useDiagramStore } from "../store/diagramStore";
import type { DiagramDocument } from "../types";

function sampleDoc(): DiagramDocument {
  const vpcId = createNodeId("vpc");
  return {
    version: 1,
    metadata: {
      savedAt: "2026-06-01T12:00:00.000Z",
      generator: "diagloud",
    },
    nodes: [
      {
        id: vpcId,
        kind: "vpc",
        position: { x: 10, y: 20 },
        data: { name: "vpc-test" },
      },
    ],
    edges: [],
  };
}

describe("diagramPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useDiagramStore.getState().reset();
  });

  afterEach(() => {
    localStorage.clear();
    useDiagramStore.getState().reset();
  });

  it("salva e restaura o diagrama do localStorage", () => {
    const doc = sampleDoc();
    useDiagramStore.getState().loadDocument(doc);
    saveDiagramToLocalStorage();

    expect(hasDiagramInLocalStorage()).toBe(true);
    expect(localStorage.getItem(DIAGRAM_STORAGE_KEY)).toContain("vpc-test");

    useDiagramStore.getState().reset();
    expect(useDiagramStore.getState().nodes).toHaveLength(0);

    const loaded = loadDiagramFromLocalStorage();
    expect(loaded).toBe(true);
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
    const node = useDiagramStore.getState().nodes[0];
    expect(node?.kind).toBe("vpc");
    if (node?.kind === "vpc") {
      expect(node.data.name).toBe("vpc-test");
    }
    expect(node?.position).toEqual({ x: 10, y: 20 });
  });

  it("clearDiagramLocalStorage remove o rascunho", () => {
    useDiagramStore.getState().loadDocument(sampleDoc());
    saveDiagramToLocalStorage();
    clearDiagramLocalStorage();
    expect(hasDiagramInLocalStorage()).toBe(false);
    expect(loadDiagramFromLocalStorage()).toBe(false);
  });
});
