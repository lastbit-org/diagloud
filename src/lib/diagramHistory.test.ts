import { describe, expect, it, vi } from "vitest";
import {
  cloneDiagramSnapshot,
  isRedoKeyboardEvent,
  isUndoKeyboardEvent,
  recordPropertyEditHistory,
  resetPropertyEditHistoryArm,
  snapshotsEqual,
  trimHistory,
} from "./diagramHistory";
import type { DiagramNode } from "../types";

const node: DiagramNode = {
  id: "vm-1",
  kind: "vm",
  position: { x: 0, y: 0 },
  data: { name: "vm-1", machineType: "e2-micro" },
};

describe("diagramHistory", () => {
  it("cloneDiagramSnapshot cria cópia profunda", () => {
    const snapshot = cloneDiagramSnapshot([node], []);
    const cloned = snapshot.nodes[0];
    if (cloned?.kind !== "vm") throw new Error("expected vm node");
    cloned.data.name = "alterado";
    expect(node.data.name).toBe("vm-1");
  });

  it("snapshotsEqual compara conteúdo", () => {
    const a = cloneDiagramSnapshot([node], []);
    const b = cloneDiagramSnapshot([node], []);
    expect(snapshotsEqual(a, b)).toBe(true);
    const changed = b.nodes[0];
    if (changed?.kind !== "vm") throw new Error("expected vm node");
    changed.data.name = "outro";
    expect(snapshotsEqual(a, b)).toBe(false);
  });

  it("trimHistory limita o tamanho da pilha", () => {
    const past = Array.from({ length: 60 }, (_, index) =>
      cloneDiagramSnapshot(
        [{ ...node, id: `vm-${index}`, data: { ...node.data, name: `vm-${index}` } }],
        [],
      ),
    );
    expect(trimHistory(past)).toHaveLength(50);
  });

  it("recordPropertyEditHistory agrupa edições rápidas", () => {
    vi.useFakeTimers();
    resetPropertyEditHistoryArm();
    const pushed: string[] = [];

    recordPropertyEditHistory(cloneDiagramSnapshot([node], []), () => {
      pushed.push("a");
    });
    recordPropertyEditHistory(cloneDiagramSnapshot([node], []), () => {
      pushed.push("b");
    });

    expect(pushed).toEqual(["a"]);

    vi.advanceTimersByTime(500);
    recordPropertyEditHistory(cloneDiagramSnapshot([node], []), () => {
      pushed.push("c");
    });
    expect(pushed).toEqual(["a", "c"]);

    vi.useRealTimers();
  });

  it("detecta atalhos de undo e redo", () => {
    const undoEvent = {
      key: "z",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    } as KeyboardEvent;
    const redoY = {
      key: "y",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    } as KeyboardEvent;
    const redoShiftZ = {
      key: "z",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    } as KeyboardEvent;

    expect(isUndoKeyboardEvent(undoEvent)).toBe(true);
    expect(isRedoKeyboardEvent(redoY)).toBe(true);
    expect(isRedoKeyboardEvent(redoShiftZ)).toBe(true);
  });
});
