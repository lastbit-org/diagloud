import { describe, expect, it } from "vitest";
import { resolveEdgeLineStyle } from "./edgeLineStyle";

describe("resolveEdgeLineStyle", () => {
  it("usa sólida como padrão", () => {
    expect(resolveEdgeLineStyle(undefined)).toBe("solid");
  });

  it("preserva tracejada", () => {
    expect(resolveEdgeLineStyle("dashed")).toBe("dashed");
  });
});
