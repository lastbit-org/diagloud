import { describe, expect, it } from "vitest";
import type { DiagramEdge, DiagramNode } from "../types";
import { reassignSubnetGkeIps } from "./gkeSubnet";

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 100 },
  data: { name: "subnet-1", region: "southamerica-east1", cidr: "10.0.0.0/24" },
};

const gke: DiagramNode = {
  id: "gke-1",
  kind: "gke",
  position: { x: 200, y: 100 },
  data: { name: "gke-1", nodeCount: 3, machineType: "e2-medium" },
};

describe("reassignSubnetGkeIps", () => {
  it("atribui IP na sub-rede quando não há VMs nem SQL", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "gke-1", target: "subnet-1", kind: "gke-subnet" },
    ];
    const nodes = reassignSubnetGkeIps("subnet-1", [subnet, gke], edges);
    const updated = nodes.find((n) => n.id === "gke-1");
    if (updated?.kind === "gke") {
      expect(updated.data.internalIp).toBe("10.0.0.4");
      expect(updated.data.region).toBe("southamerica-east1");
    }
  });
});
