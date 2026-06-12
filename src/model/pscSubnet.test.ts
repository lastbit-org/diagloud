import { describe, expect, it } from "vitest";
import { reassignSubnetPscIps } from "./pscSubnet";
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

const psc: DiagramNode = {
  id: "psc-1",
  kind: "psc",
  position: { x: 100, y: 0 },
  data: {
    name: "psc-endpoint",
    region: "southamerica-east1",
  },
};

describe("reassignSubnetPscIps", () => {
  it("atribui IP interno ao ligar PSC à sub-rede", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: psc.id,
        target: subnet.id,
        kind: "psc-subnet",
      },
    ];
    const nodes = reassignSubnetPscIps(subnet.id, [subnet, psc], edges);
    const updated = nodes.find((n) => n.id === psc.id);
    expect(updated?.kind).toBe("psc");
    if (updated?.kind !== "psc") return;
    expect(updated.data.internalIp).toBe("10.0.0.4");
    expect(updated.data.region).toBe("southamerica-east1");
  });
});
