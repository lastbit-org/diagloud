import { describe, expect, it } from "vitest";
import { reassignSubnetMemorystoreIps } from "./memorystoreSubnet";
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

const memorystore: DiagramNode = {
  id: "memorystore-1",
  kind: "memorystore",
  position: { x: 100, y: 0 },
  data: {
    name: "redis-cache",
    region: "southamerica-east1",
    engine: "redis",
    tier: "standard",
  },
};

describe("reassignSubnetMemorystoreIps", () => {
  it("atribui IP interno ao ligar Memorystore à sub-rede", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: memorystore.id,
        target: subnet.id,
        kind: "memorystore-subnet",
      },
    ];
    const nodes = reassignSubnetMemorystoreIps(
      subnet.id,
      [subnet, memorystore],
      edges,
    );
    const updated = nodes.find((n) => n.id === memorystore.id);
    expect(updated?.kind).toBe("memorystore");
    if (updated?.kind !== "memorystore") return;
    expect(updated.data.internalIp).toBe("10.0.0.4");
    expect(updated.data.region).toBe("southamerica-east1");
  });
});
