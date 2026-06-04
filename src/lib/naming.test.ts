import { describe, expect, it } from "vitest";
import { generateResourceName } from "./naming";
import { DEFAULT_NAMING_PATTERNS } from "../types/naming";
import type { DiagramNode } from "../types";

const placeholders = { area: "financeiro", ambiente: "prd" };

function vmNode(name: string, id = `vm-${name}`): DiagramNode {
  return {
    id,
    kind: "vm",
    position: { x: 0, y: 0 },
    data: { name, machineType: "e2-micro" },
  };
}

describe("generateResourceName", () => {
  it("gera VM com sequência e placeholders", () => {
    const name = generateResourceName(
      "vm",
      DEFAULT_NAMING_PATTERNS,
      placeholders,
      [],
    );
    expect(name).toBe("vm-01-financeiro-prd");
  });

  it("incrementa sequência de VM existente", () => {
    const name = generateResourceName(
      "vm",
      DEFAULT_NAMING_PATTERNS,
      placeholders,
      [vmNode("vm-01-financeiro-prd")],
    );
    expect(name).toBe("vm-02-financeiro-prd");
  });

  it("gera VPC e sub-rede sem sequência", () => {
    expect(
      generateResourceName("vpc", DEFAULT_NAMING_PATTERNS, placeholders, []),
    ).toBe("vpc-financeiro-prd");
    expect(
      generateResourceName(
        "subnet",
        DEFAULT_NAMING_PATTERNS,
        placeholders,
        [],
      ),
    ).toBe("sub-financeiro-prd");
  });

  it("evita duplicata quando padrão não tem ##", () => {
    const nodes: DiagramNode[] = [
      {
        id: "vpc-1",
        kind: "vpc",
        position: { x: 0, y: 0 },
        data: { name: "vpc-financeiro-prd" },
      },
    ];
    expect(
      generateResourceName("vpc", DEFAULT_NAMING_PATTERNS, placeholders, nodes),
    ).toBe("vpc-financeiro-prd-2");
  });
});
