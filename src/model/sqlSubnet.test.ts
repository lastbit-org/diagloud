import { describe, expect, it } from "vitest";
import type { DiagramEdge, DiagramNode } from "../types";
import { reassignSubnetSqlIps } from "./sqlSubnet";

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

const vm: DiagramNode = {
  id: "vm-1",
  kind: "vm",
  position: { x: 0, y: 200 },
  data: {
    name: "vm-1",
    machineType: "e2-micro",
    internalIp: "10.0.0.4",
    region: "southamerica-east1",
  },
};

const sql: DiagramNode = {
  id: "sql-1",
  kind: "sql",
  position: { x: 200, y: 100 },
  data: {
    name: "sql-1",
    region: "southamerica-east1",
    engine: "POSTGRES_15",
    accessMode: "private",
  },
};

describe("reassignSubnetSqlIps", () => {
  it("atribui IP interno na sub-rede após as VMs", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "subnet-1", target: "vpc-1", kind: "subnet-vpc" },
      { id: "e2", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
      { id: "e3", source: "sql-1", target: "subnet-1", kind: "sql-subnet" },
    ];
    const nodes = reassignSubnetSqlIps("subnet-1", [vpc, subnet, vm, sql], edges);
    const updated = nodes.find((n) => n.id === "sql-1");
    expect(updated?.kind).toBe("sql");
    if (updated?.kind === "sql") {
      expect(updated.data.internalIp).toBe("10.0.0.5");
      expect(updated.data.region).toBe("southamerica-east1");
    }
  });
});
