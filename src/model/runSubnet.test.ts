import { describe, expect, it } from "vitest";
import type { DiagramEdge, DiagramNode } from "../types";
import { reassignSubnetRunIps } from "./runSubnet";

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 100 },
  data: { name: "subnet-1", region: "southamerica-east1", cidr: "10.0.0.0/24" },
};

const run: DiagramNode = {
  id: "run-1",
  kind: "run",
  position: { x: 200, y: 100 },
  data: {
    name: "run-1",
    imageUrl: "",
    cpu: "1",
    memory: "512Mi",
    minInstances: 0,
    accessMode: "vpc",
  },
};

describe("reassignSubnetRunIps", () => {
  it("atribui IP após VMs, SQL e GKE na sub-rede", () => {
    const vm: DiagramNode = {
      id: "vm-1",
      kind: "vm",
      position: { x: 0, y: 0 },
      data: { name: "vm-1", machineType: "e2-micro" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
      { id: "e2", source: "run-1", target: "subnet-1", kind: "run-subnet" },
    ];
    const nodes = reassignSubnetRunIps(
      "subnet-1",
      [subnet, vm, run],
      edges,
    );
    const updated = nodes.find((n) => n.id === "run-1");
    if (updated?.kind === "run") {
      expect(updated.data.internalIp).toBe("10.0.0.5");
      expect(updated.data.region).toBe("southamerica-east1");
    }
  });
});
