import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
  makeHandleId,
} from "../lib/dynamicHandles";
import type { DiagramEdge, DiagramNode } from "../types";
import {
  canReachNode,
  explainConnectionFailure,
  getEdgeKind,
  validateConnection,
  wouldCreateDirectedCycle,
} from "./connections";

const egress = (side: "top" | "right" | "bottom" | "left" = "bottom", index = 0) =>
  makeHandleId(side, index);
const ingress = (side: "top" | "right" | "bottom" | "left" = "top", index = 0) =>
  makeHandleId(side, index);

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
    expect(getEdgeKind("nat", "vpc")).toBe("nat-vpc");
    expect(getEdgeKind("peering", "vpc")).toBe("peering-vpc");
    expect(getEdgeKind("vpn", "vpc")).toBe("vpn-vpc");
    expect(getEdgeKind("firewall", "vpc")).toBe("firewall-vpc");
    expect(getEdgeKind("internet", "nat")).toBe("internet-nat");
    expect(getEdgeKind("internet", "vpn")).toBe("internet-vpn");
    expect(getEdgeKind("subnet", "nat")).toBe("subnet-nat");
    expect(getEdgeKind("gke", "artifact")).toBe("gke-artifact");
    expect(getEdgeKind("vm", "artifact")).toBe("vm-artifact");
    expect(getEdgeKind("run", "subnet")).toBe("run-subnet");
    expect(getEdgeKind("run", "artifact")).toBe("run-artifact");
    expect(getEdgeKind("pubsub", "run")).toBe("pubsub-run");
    expect(getEdgeKind("pubsub", "storage")).toBe("pubsub-storage");
    expect(getEdgeKind("pubsub", "bigquery")).toBe("pubsub-bigquery");
    expect(getEdgeKind("vm", "spanner")).toBe("vm-spanner");
    expect(getEdgeKind("gke", "spanner")).toBe("gke-spanner");
    expect(getEdgeKind("run", "spanner")).toBe("run-spanner");
    expect(getEdgeKind("pubsub", "spanner")).toBe("pubsub-spanner");
    expect(getEdgeKind("workbench", "subnet")).toBe("workbench-subnet");
    expect(getEdgeKind("workbench", "storage")).toBe("workbench-storage");
    expect(getEdgeKind("workbench", "bigquery")).toBe("workbench-bigquery");
    expect(getEdgeKind("workbench", "spanner")).toBe("workbench-spanner");
    expect(getEdgeKind("vm", "firestore")).toBe("vm-firestore");
    expect(getEdgeKind("pubsub", "firestore")).toBe("pubsub-firestore");
    expect(getEdgeKind("workbench", "firestore")).toBe("workbench-firestore");
    expect(getEdgeKind("pubsub", "eventarc")).toBe("pubsub-eventarc");
    expect(getEdgeKind("storage", "eventarc")).toBe("storage-eventarc");
    expect(getEdgeKind("eventarc", "run")).toBe("eventarc-run");
    expect(getEdgeKind("eventarc", "gke")).toBe("eventarc-gke");
  });

  it("bloqueia VM → VPC e outras ligações inválidas", () => {
    expect(getEdgeKind("vm", "vpc")).toBeNull();
    expect(getEdgeKind("vpc", "peering")).toBeNull();
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
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "same-node" });
  });

  it("rejeita ligação duplicada mesmo com direção invertida no gesto", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: subnet.id, target: vpc.id, kind: "subnet-vpc" },
    ];
    const result = validateConnection(
      {
        source: vpc.id,
        target: subnet.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes, edges },
    );
    expect(result).toEqual({ valid: false, reason: "duplicate-edge" });
  });

  it("aceita sub-rede → VPC com handles em qualquer lado", () => {
    const result = validateConnection(
      {
        source: subnet.id,
        target: vpc.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes, edges: [] },
    );
    expect(result).toMatchObject({
      valid: true,
      edgeKind: "subnet-vpc",
      source: subnet.id,
      target: vpc.id,
    });
  });

  it("normaliza VPC → sub-rede para sub-rede → VPC ao validar", () => {
    const result = validateConnection(
      {
        source: vpc.id,
        target: subnet.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes, edges: [] },
    );
    expect(result).toMatchObject({
      valid: true,
      edgeKind: "subnet-vpc",
      source: subnet.id,
      target: vpc.id,
    });
  });

  it("aceita Cloud SQL privado → sub-rede", () => {
    const result = validateConnection(
      {
        source: sql.id,
        target: subnet.id,
        sourceHandle: egress("top"),
        targetHandle: ingress("left"),
      },
      { nodes, edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "sql-subnet" });
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
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, publicSql], edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "sql-not-private" });
  });

  it("aceita GKE → sub-rede", () => {
    const result = validateConnection(
      {
        source: "gke-1",
        target: subnet.id,
        sourceHandle: egress(),
        targetHandle: ingress("right"),
      },
      {
        nodes: [
          ...nodes,
          {
            id: "gke-1",
            kind: "gke",
            position: { x: 0, y: 0 },
            data: { name: "gke-1", nodeCount: 3, machineType: "e2-medium" },
          },
        ],
        edges: [],
      },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "gke-subnet" });
  });

  it("aceita VM → Cloud Storage com handles corretos", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: storage.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes, edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "vm-storage" });
  });

  it("rejeita ligação com handle inválido", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: storage.id,
        sourceHandle: "wrong-handle",
        targetHandle: ingress("left"),
      },
      { nodes, edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "invalid-handles" });
  });

  it("rejeita VM → VPC com invalid-types", () => {
    const result = validateConnection(
      {
        source: vm.id,
        target: vpc.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
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
        sourceHandle: egress(),
        targetHandle: ingress(),
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
        sourceHandle: egress(),
        targetHandle: ingress(),
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
        sourceHandle: egress(),
        targetHandle: ingress(),
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

  it("aceita Cloud Run VPC → sub-rede", () => {
    const run: DiagramNode = {
      id: "run-1",
      kind: "run",
      position: { x: 0, y: 0 },
      data: {
        name: "run-1",
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "vpc",
      },
    };
    const result = validateConnection(
      {
        source: run.id,
        target: subnet.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, run], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "run-subnet" });
  });

  it("rejeita Cloud Run público → sub-rede", () => {
    const run: DiagramNode = {
      id: "run-pub",
      kind: "run",
      position: { x: 0, y: 0 },
      data: {
        name: "run-pub",
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "public",
      },
    };
    const result = validateConnection(
      {
        source: run.id,
        target: subnet.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, run], edges: [] },
    );
    expect(result).toEqual({ valid: false, reason: "run-not-vpc" });
  });

  it("aceita Pub/Sub → Cloud Run", () => {
    const run: DiagramNode = {
      id: "run-1",
      kind: "run",
      position: { x: 0, y: 0 },
      data: {
        name: "run-1",
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "public",
      },
    };
    const pubsub: DiagramNode = {
      id: "pubsub-1",
      kind: "pubsub",
      position: { x: 100, y: 0 },
      data: { name: "events" },
    };
    const result = validateConnection(
      {
        source: pubsub.id,
        target: run.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, run, pubsub], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "pubsub-run" });
  });

  it("aceita Pub/Sub → Cloud Storage", () => {
    const pubsub: DiagramNode = {
      id: "pubsub-1",
      kind: "pubsub",
      position: { x: 0, y: 0 },
      data: { name: "events" },
    };
    const result = validateConnection(
      {
        source: pubsub.id,
        target: storage.id,
        sourceHandle: egress(),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, pubsub], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "pubsub-storage" });
  });

  it("aceita VM → Firestore", () => {
    const firestore: DiagramNode = {
      id: "firestore-1",
      kind: "firestore",
      position: { x: 200, y: 0 },
      data: { name: "fs-app", location: "southamerica-east1" },
    };
    const result = validateConnection(
      {
        source: vm.id,
        target: firestore.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, firestore], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "vm-firestore" });
  });

  it("aceita VM → Cloud Spanner", () => {
    const spanner: DiagramNode = {
      id: "spanner-1",
      kind: "spanner",
      position: { x: 200, y: 0 },
      data: { name: "spanner-1", config: "regional-southamerica-east1" },
    };
    const result = validateConnection(
      {
        source: vm.id,
        target: spanner.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, spanner], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "vm-spanner" });
  });

  it("aceita Pub/Sub → Cloud Spanner", () => {
    const spanner: DiagramNode = {
      id: "spanner-1",
      kind: "spanner",
      position: { x: 200, y: 0 },
      data: { name: "spanner-1", config: "regional-southamerica-east1" },
    };
    const pubsub: DiagramNode = {
      id: "pubsub-1",
      kind: "pubsub",
      position: { x: 0, y: 0 },
      data: { name: "events" },
    };
    const result = validateConnection(
      {
        source: pubsub.id,
        target: spanner.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, spanner, pubsub], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "pubsub-spanner" });
  });

  it("aceita Pub/Sub → BigQuery", () => {
    const pubsub: DiagramNode = {
      id: "pubsub-1",
      kind: "pubsub",
      position: { x: 0, y: 0 },
      data: { name: "events" },
    };
    const bigquery: DiagramNode = {
      id: "bq-1",
      kind: "bigquery",
      position: { x: 200, y: 0 },
      data: { name: "analytics", location: "southamerica-east1" },
    };
    const result = validateConnection(
      {
        source: pubsub.id,
        target: bigquery.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, pubsub, bigquery], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "pubsub-bigquery" });
  });

  it("aceita handles padrão", () => {
    const result = validateConnection(
      {
        source: subnet.id,
        target: vpc.id,
        sourceHandle: DEFAULT_SOURCE_HANDLE,
        targetHandle: DEFAULT_TARGET_HANDLE,
      },
      { nodes, edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "subnet-vpc" });
  });

  it("aceita VPC Peering → VPC e normaliza VPC → peering", () => {
    const peering: DiagramNode = {
      id: "peering-1",
      kind: "peering",
      position: { x: 200, y: 0 },
      data: { name: "peer-1" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const diagramNodes = [vpc, vpcB, peering];

    const forward = validateConnection(
      {
        source: peering.id,
        target: vpc.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(forward).toMatchObject({
      valid: true,
      edgeKind: "peering-vpc",
      source: peering.id,
      target: vpc.id,
    });

    const reversed = validateConnection(
      {
        source: vpcB.id,
        target: peering.id,
        sourceHandle: egress("left"),
        targetHandle: ingress("right"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(reversed).toMatchObject({
      valid: true,
      edgeKind: "peering-vpc",
      source: peering.id,
      target: vpcB.id,
    });
  });

  it("rejeita terceira VPC no mesmo peering", () => {
    const peering: DiagramNode = {
      id: "peering-1",
      kind: "peering",
      position: { x: 200, y: 0 },
      data: { name: "peer-1" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const vpcC: DiagramNode = {
      id: "vpc-3",
      kind: "vpc",
      position: { x: 600, y: 0 },
      data: { name: "vpc-3" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: peering.id, target: vpc.id, kind: "peering-vpc" },
      { id: "e2", source: peering.id, target: vpcB.id, kind: "peering-vpc" },
    ];
    const result = validateConnection(
      {
        source: peering.id,
        target: vpcC.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, vpcB, vpcC, peering], edges },
    );
    expect(result).toEqual({ valid: false, reason: "peering-has-max-vpcs" });
  });

  it("aceita Cloud VPN → VPC e normaliza VPC → VPN", () => {
    const vpn: DiagramNode = {
      id: "vpn-1",
      kind: "vpn",
      position: { x: 200, y: 0 },
      data: { name: "vpn-1", region: "southamerica-east1" },
    };
    const diagramNodes = [vpc, vpn];

    const forward = validateConnection(
      {
        source: vpn.id,
        target: vpc.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(forward).toMatchObject({
      valid: true,
      edgeKind: "vpn-vpc",
      source: vpn.id,
      target: vpc.id,
    });

    const reversed = validateConnection(
      {
        source: vpc.id,
        target: vpn.id,
        sourceHandle: egress("left"),
        targetHandle: ingress("right"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(reversed).toMatchObject({
      valid: true,
      edgeKind: "vpn-vpc",
      source: vpn.id,
      target: vpc.id,
    });
  });

  it("rejeita segunda VPC no mesmo Cloud VPN", () => {
    const vpn: DiagramNode = {
      id: "vpn-1",
      kind: "vpn",
      position: { x: 200, y: 0 },
      data: { name: "vpn-1", region: "southamerica-east1" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: vpn.id, target: vpc.id, kind: "vpn-vpc" },
    ];
    const result = validateConnection(
      {
        source: vpn.id,
        target: vpcB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, vpcB, vpn], edges },
    );
    expect(result).toEqual({ valid: false, reason: "vpn-has-vpc" });
  });

  it("aceita Firewall → VPC e normaliza VPC → firewall", () => {
    const firewall: DiagramNode = {
      id: "firewall-1",
      kind: "firewall",
      position: { x: 200, y: 0 },
      data: { name: "fw-allow-ssh", direction: "ingress" },
    };
    const diagramNodes = [vpc, firewall];

    const forward = validateConnection(
      {
        source: firewall.id,
        target: vpc.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(forward).toMatchObject({
      valid: true,
      edgeKind: "firewall-vpc",
      source: firewall.id,
      target: vpc.id,
    });

    const reversed = validateConnection(
      {
        source: vpc.id,
        target: firewall.id,
        sourceHandle: egress("left"),
        targetHandle: ingress("right"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(reversed).toMatchObject({
      valid: true,
      edgeKind: "firewall-vpc",
      source: firewall.id,
      target: vpc.id,
    });
  });

  it("rejeita segunda VPC na mesma regra de firewall", () => {
    const firewall: DiagramNode = {
      id: "firewall-1",
      kind: "firewall",
      position: { x: 200, y: 0 },
      data: { name: "fw-1", direction: "ingress" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: firewall.id, target: vpc.id, kind: "firewall-vpc" },
    ];
    const result = validateConnection(
      {
        source: firewall.id,
        target: vpcB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, vpcB, firewall], edges },
    );
    expect(result).toEqual({ valid: false, reason: "firewall-has-vpc" });
  });

  it("permite várias regras de firewall na mesma VPC", () => {
    const firewallA: DiagramNode = {
      id: "firewall-1",
      kind: "firewall",
      position: { x: 200, y: 0 },
      data: { name: "fw-a", direction: "ingress" },
    };
    const firewallB: DiagramNode = {
      id: "firewall-2",
      kind: "firewall",
      position: { x: 300, y: 0 },
      data: { name: "fw-b", direction: "egress" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: firewallA.id, target: vpc.id, kind: "firewall-vpc" },
    ];
    const result = validateConnection(
      {
        source: firewallB.id,
        target: vpc.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, firewallA, firewallB], edges },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "firewall-vpc" });
  });

  it("aceita Vertex AI Workbench → sub-rede e dados", () => {
    const workbench: DiagramNode = {
      id: "workbench-1",
      kind: "workbench",
      position: { x: 200, y: 0 },
      data: {
        name: "wb-1",
        region: "southamerica-east1",
        machineType: "n1-standard-4",
      },
    };
    const storageNode: DiagramNode = {
      id: "storage-1",
      kind: "storage",
      position: { x: 400, y: 0 },
      data: {
        name: "bucket-1",
        location: "southamerica-east1",
        storageClass: "STANDARD",
        accessMode: "public",
      },
    };

    const subnetResult = validateConnection(
      {
        source: workbench.id,
        target: subnet.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, workbench], edges: [] },
    );
    expect(subnetResult).toMatchObject({
      valid: true,
      edgeKind: "workbench-subnet",
    });

    const storageResult = validateConnection(
      {
        source: workbench.id,
        target: storageNode.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, workbench, storageNode], edges: [] },
    );
    expect(storageResult).toMatchObject({
      valid: true,
      edgeKind: "workbench-storage",
    });
  });

  it("rejeita segunda sub-rede no mesmo Workbench", () => {
    const workbench: DiagramNode = {
      id: "workbench-1",
      kind: "workbench",
      position: { x: 200, y: 0 },
      data: {
        name: "wb-1",
        region: "southamerica-east1",
        machineType: "n1-standard-4",
      },
    };
    const subnetB: DiagramNode = {
      id: "subnet-2",
      kind: "subnet",
      position: { x: 400, y: 0 },
      data: {
        name: "subnet-b",
        region: "southamerica-east1",
        cidr: "10.0.1.0/24",
      },
    };
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: workbench.id,
        target: subnet.id,
        kind: "workbench-subnet",
      },
    ];
    const result = validateConnection(
      {
        source: workbench.id,
        target: subnetB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, workbench, subnetB], edges },
    );
    expect(result).toEqual({ valid: false, reason: "workbench-has-subnet" });
  });

  it("aceita Internet → Cloud VPN", () => {
    const vpn: DiagramNode = {
      id: "vpn-1",
      kind: "vpn",
      position: { x: 200, y: 0 },
      data: { name: "vpn-1", region: "southamerica-east1" },
    };
    const internet: DiagramNode = {
      id: "internet-1",
      kind: "internet",
      position: { x: 0, y: 0 },
      data: { name: "Internet" },
    };
    const result = validateConnection(
      {
        source: internet.id,
        target: vpn.id,
        sourceHandle: egress("bottom"),
        targetHandle: ingress("top"),
      },
      { nodes: [...nodes, vpn, internet], edges: [] },
    );
    expect(result).toMatchObject({
      valid: true,
      edgeKind: "internet-vpn",
      source: internet.id,
      target: vpn.id,
    });
  });
});
