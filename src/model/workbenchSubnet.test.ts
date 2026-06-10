import { describe, expect, it } from "vitest";
import { reassignSubnetWorkbenchIps } from "./workbenchSubnet";
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

const workbench: DiagramNode = {
  id: "workbench-1",
  kind: "workbench",
  position: { x: 100, y: 0 },
  data: {
    name: "wb-1",
    region: "southamerica-east1",
    machineType: "n1-standard-4",
  },
};

describe("reassignSubnetWorkbenchIps", () => {
  it("atribui IP interno ao ligar Workbench à sub-rede", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: workbench.id,
        target: subnet.id,
        kind: "workbench-subnet",
      },
    ];
    const nodes = reassignSubnetWorkbenchIps(
      subnet.id,
      [subnet, workbench],
      edges,
    );
    const updated = nodes.find((n) => n.id === workbench.id);
    expect(updated?.kind).toBe("workbench");
    if (updated?.kind !== "workbench") return;
    expect(updated.data.internalIp).toBe("10.0.0.4");
    expect(updated.data.region).toBe("southamerica-east1");
  });
});
