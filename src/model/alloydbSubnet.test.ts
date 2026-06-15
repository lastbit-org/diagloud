import { describe, expect, it } from "vitest";
import { reassignSubnetAlloydbIps } from "./alloydbSubnet";
import type { DiagramEdge, DiagramNode } from "../types";

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 0 },
  data: {
    name: "subnet-1",
    region: "southamerica-east1",
    cidr: "10.0.0.0/28",
  },
};

const alloydb: DiagramNode = {
  id: "alloydb-1",
  kind: "alloydb",
  position: { x: 100, y: 0 },
  data: {
    name: "alloydb-cluster",
    region: "southamerica-east1",
  },
};

describe("reassignSubnetAlloydbIps", () => {
  it("atribui IP interno ao ligar AlloyDB à sub-rede", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: alloydb.id,
        target: subnet.id,
        kind: "alloydb-subnet",
      },
    ];
    const nodes = reassignSubnetAlloydbIps(subnet.id, [subnet, alloydb], edges);
    const updated = nodes.find((n) => n.id === alloydb.id);
    expect(updated?.kind).toBe("alloydb");
    if (updated?.kind !== "alloydb") return;
    expect(updated.data.internalIp).toBe("10.0.0.4");
    expect(updated.data.region).toBe("southamerica-east1");
  });
});
