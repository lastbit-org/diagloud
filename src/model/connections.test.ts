import { describe, expect, it } from "vitest";
import { HANDLE_IDS } from "../lib/handles";
import type { DiagramEdge, DiagramNode } from "../types";
import {
  canReachNode,
  explainConnectionFailure,
  getEdgeKind,
  validateConnection,
  wouldCreateDirectedCycle,
} from "./connections";

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
  data: { name: "vm-1", machineType: "e2-micro" },
};

const storage: DiagramNode = {
  id: "storage-1",
  kind: "storage",
  position: { x: 200, y: 200 },
  data: {
    name: "bucket-1",
    location: "southamerica-east1",
    storageClass: "STANDARD",
    accessMode: "public",
  },
};

const sql: DiagramNode = {
  id: "sql-1",
  kind: "sql",
  position: { x: 200, y: 50 },
  data: {
    name: "sql-1",
    region: "southamerica-east1",
    engine: "POSTGRES_15",
    accessMode: "private",
  },
};

const nodes = [vpc, subnet, vm, storage, sql];

describe("getEdgeKind", () => {
  it("permite sub-rede → VPC, VM → sub-rede e VM → storage", () => {
    expect(getEdgeKind("subnet", "vpc")).toBe("subnet-vpc");
    expect(getEdgeKind("vm", "subnet")).toBe("vm-subnet");
    expect(getEdgeKind("vm", "storage")).toBe("vm-storage");
    expect(getEdgeKind("sql", "subnet")).toBe("sql-subnet");
  });

  it("bloqueia VM → VPC e outras ligações inválidas", () => {
    expect(getEdgeKind("vm", "vpc")).toBeNull();
    expect(getEdgeKind("vpc", "vm")).toBeNull();
    expect(getEdgeKind("vpc", "subnet")).toBeNull();
    expect(getEdgeKind("subnet", "vm")).toBeNull();
    expect(getEdgeKind("vm", "vm")).toBeNull();
    expect(getEdgeKind("storage", "vm")).toBeNull();
    expect(getEdgeKind("vpc", "storage")).toBeNull();
  });
});

describe("wouldCreateDirectedCycle", () => {
  it("detecta auto-ligação", () => {
    expect(wouldCreateDirectedCycle("vm-1", "vm-1", [])).toBe(true);
  });

  it("detecta ciclo quando destino já alcança a origem", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "vpc-1", target: "subnet-1", kind: "subnet-vpc" },
    ];
    expect(wouldCreateDirectedCycle("subnet-1", "vpc-1", edges)).toBe(true);
    expect(canReachNode("vpc-1", "subnet-1", edges)).toBe(true);
  });
});

describe("validateConnection", () => {
  it("rejeita auto-ligação (mesmo nó)", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: vm.id,
        sourceHandle: HANDLE_IDS.vm.toSubnet,
        targetHandle: HANDLE_IDS.vm.toSubnet,
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "same-node" });
  });

  it("rejeita aresta que fecharia ciclo", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: vpc.id, target: subnet.id, kind: "subnet-vpc" },
    ];
    const result = validateConnection(
      {
        source: subnet.id,
        target: vpc.id,
        sourceHandle: HANDLE_IDS.subnet.toVpc,
        targetHandle: HANDLE_IDS.vpc.in,
      },
      { nodes, edges },
    );
    expect(result).toEqual({ valid: false, reason: "cycle" });
  });

  it("aceita sub-rede → VPC com handles corretos", () => {
    const result = validateConnection(
      {
        source: subnet.id,
        target: vpc.id,
        sourceHandle: HANDLE_IDS.subnet.toVpc,
        targetHandle: HANDLE_IDS.vpc.in,
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: true, edgeKind: "subnet-vpc" });
  });

  it("aceita Cloud SQL privado → sub-rede", () => {
    const result = validateConnection(
      {
        source: sql.id,
        target: subnet.id,
        sourceHandle: HANDLE_IDS.sql.toSubnet,
        targetHandle: HANDLE_IDS.subnet.fromSql,
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: true, edgeKind: "sql-subnet" });
  });

  it("rejeita Cloud SQL público → sub-rede", () => {
    const publicSql: DiagramNode = {
      ...sql,
      id: "sql-public",
      data: { ...sql.data, accessMode: "public" },
    };
    const result = validateConnection(
      {
        source: publicSql.id,
        target: subnet.id,
        sourceHandle: HANDLE_IDS.sql.toSubnet,
        targetHandle: HANDLE_IDS.subnet.fromSql,
      },
      { nodes: [...nodes, publicSql], edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "sql-not-private" });
  });

  it("aceita VM → Cloud Storage com handles corretos", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: storage.id,
        sourceHandle: HANDLE_IDS.vm.toStorage,
        targetHandle: HANDLE_IDS.storage.fromVm,
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: true, edgeKind: "vm-storage" });
  });

  it("rejeita VM → VPC com invalid-types", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: vpc.id,
        sourceHandle: HANDLE_IDS.vm.toSubnet,
        targetHandle: HANDLE_IDS.vpc.in,
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "invalid-types" });
  });

  it("rejeita ligação duplicada", () => {
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: subnet.id,
        target: vpc.id,
        kind: "subnet-vpc",
      },
    ];

    const result = validateConnection(
      {
        source: subnet.id,
        target: vpc.id,
        sourceHandle: HANDLE_IDS.subnet.toVpc,
        targetHandle: HANDLE_IDS.vpc.in,
      },
      { nodes, edges },
    );
    expect(result).toEqual({ valid: false, reason: "duplicate-edge" });
  });

  it("rejeita VM → sub-rede quando CIDR da sub-rede é inválido", () => {
    const badSubnet: DiagramNode = {
      ...subnet,
      id: "subnet-bad",
      data: { ...subnet.data, cidr: "invalid" },
    };
    const result = validateConnection(
      {
        source: vm.id,
        target: badSubnet.id,
        sourceHandle: HANDLE_IDS.vm.toSubnet,
        targetHandle: HANDLE_IDS.subnet.fromVm,
      },
      { nodes: [vpc, badSubnet, vm], edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "subnet-invalid-cidr" });
  });

  it("rejeita VM → sub-rede quando capacidade esgotada", () => {
    const tinySubnet: DiagramNode = {
      ...subnet,
      id: "subnet-tiny",
      data: { ...subnet.data, cidr: "10.0.9.0/29" },
    };
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: "vm-a",
        target: tinySubnet.id,
        kind: "vm-subnet",
      },
      {
        id: "e2",
        source: "vm-b",
        target: tinySubnet.id,
        kind: "vm-subnet",
      },
      {
        id: "e3",
        source: "vm-c",
        target: tinySubnet.id,
        kind: "vm-subnet",
      },
    ];
    const result = validateConnection(
      {
        source: vm.id,
        target: tinySubnet.id,
        sourceHandle: HANDLE_IDS.vm.toSubnet,
        targetHandle: HANDLE_IDS.subnet.fromVm,
      },
      { nodes: [vpc, tinySubnet, vm], edges },
    );
    expect(result).toEqual({ valid: false, reason: "subnet-vm-capacity" });
  });

  it("explica falta de IP mesmo com handles incorretos (VM + sub-rede cheia)", () => {
    const tinySubnet: DiagramNode = {
      ...subnet,
      id: "subnet-tiny",
      data: { ...subnet.data, cidr: "10.0.9.0/29" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: "vm-a", target: tinySubnet.id, kind: "vm-subnet" },
      { id: "e2", source: "vm-b", target: tinySubnet.id, kind: "vm-subnet" },
      { id: "e3", source: "vm-c", target: tinySubnet.id, kind: "vm-subnet" },
    ];
    const connection = {
      source: vm.id,
      target: tinySubnet.id,
      sourceHandle: "wrong-handle",
      targetHandle: "also-wrong",
    };
    expect(validateConnection(connection, { nodes: [vpc, tinySubnet, vm], edges }))
      .toEqual({ valid: false, reason: "subnet-vm-capacity" });
    expect(
      explainConnectionFailure(connection, {
        nodes: [vpc, tinySubnet, vm],
        edges,
      }),
    ).toBe("subnet-vm-capacity");
  });
});
