import { beforeEach, describe, expect, it } from "vitest";
import { useDiagramStore } from "../store/diagramStore";

describe("diagramStore history", () => {
  beforeEach(() => {
    useDiagramStore.getState().reset();
  });

  it("desfaz e refaz adição de nó", () => {
    useDiagramStore.getState().addNode("vpc", { x: 0, y: 0 });
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
    expect(useDiagramStore.getState().canUndo()).toBe(true);

    useDiagramStore.getState().undo();
    expect(useDiagramStore.getState().nodes).toHaveLength(0);
    expect(useDiagramStore.getState().canRedo()).toBe(true);

    useDiagramStore.getState().redo();
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
  });

  it("desfaz remoção de nó", () => {
    const id = useDiagramStore.getState().addNode("vpc", { x: 0, y: 0 });
    useDiagramStore.getState().removeNode(id);
    expect(useDiagramStore.getState().nodes).toHaveLength(0);

    useDiagramStore.getState().undo();
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
    expect(useDiagramStore.getState().nodes[0]?.id).toBe(id);
  });

  it("agrupa transação de arraste em um único passo", () => {
    const id = useDiagramStore.getState().addNode("vpc", { x: 0, y: 0 });
    useDiagramStore.getState().beginHistoryTransaction();
    useDiagramStore.getState().updateNodePosition(id, { x: 50, y: 50 });
    useDiagramStore.getState().updateNodePosition(id, { x: 100, y: 100 });
    useDiagramStore.getState().endHistoryTransaction();

    expect(useDiagramStore.getState().nodes[0]?.position).toEqual({
      x: 100,
      y: 100,
    });

    useDiagramStore.getState().undo();
    expect(useDiagramStore.getState().nodes[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it("limpa histórico ao carregar documento", () => {
    useDiagramStore.getState().addNode("vpc", { x: 0, y: 0 });
    expect(useDiagramStore.getState().canUndo()).toBe(true);

    useDiagramStore.getState().loadDocument({
      version: 1,
      nodes: [],
      edges: [],
      metadata: {
        savedAt: new Date().toISOString(),
        generator: "diagloud",
      },
    });

    expect(useDiagramStore.getState().canUndo()).toBe(false);
    expect(useDiagramStore.getState().canRedo()).toBe(false);
  });
});
