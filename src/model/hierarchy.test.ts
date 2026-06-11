import { describe, expect, it } from "vitest";
import { canonicalizeEdgeEndpoints } from "./connections";
import { resolveGraph } from "./hierarchy";
import { buildDiagramDocument } from "../lib/diagramDocument";
import type { DiagramEdge, DiagramNode } from "../types";

const vpc: DiagramNode = {
  id: "vpc-1",
  kind: "vpc",
  position: { x: 0, y: 0 },
  data: { name: "vpc-1" },
};

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 100 },
  data: { name: "subnet-1", region: "southamerica-east1", cidr: "10.0.0.0/24" },
};

describe("resolveGraph", () => {
  it("mapeia sub-rede para VPC e VM para sub-rede", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "subnet-1", target: "vpc-1", kind: "subnet-vpc" },
      { id: "e2", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
    ];
    const vm: DiagramNode = {
      id: "vm-1",
      kind: "vm",
      position: { x: 0, y: 200 },
      data: { name: "vm-1", machineType: "e2-micro" },
    };
    const doc = buildDiagramDocument([vpc, subnet, vm], edges);
    const graph = resolveGraph(doc);

    expect(graph.vpcForSubnet.get("subnet-1")).toBe("vpc-1");
    expect(graph.subnetForVm.get("vm-1")).toBe("subnet-1");
  });

  it("canonicaliza arestas invertidas", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "vpc-1", target: "subnet-1", kind: "subnet-vpc" },
    ];
    const doc = buildDiagramDocument([vpc, subnet], edges);
    const graph = resolveGraph(doc);
    expect(graph.vpcForSubnet.get("subnet-1")).toBe("vpc-1");
    expect(
      canonicalizeEdgeEndpoints(edges[0], doc.nodes),
    ).toEqual({ source: "subnet-1", target: "vpc-1" });
  });
});
