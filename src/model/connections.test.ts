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
    expect(getEdgeKind("vm", "iam")).toBe("vm-iam");
    expect(getEdgeKind("vm", "nat")).toBe("vm-nat");
    expect(getEdgeKind("vm", "firewall")).toBe("vm-firewall");
    expect(getEdgeKind("vm", "vm")).toBe("vm-vm");
    expect(getEdgeKind("vm", "bigquery")).toBe("vm-bigquery");
    expect(getEdgeKind("sql", "subnet")).toBe("sql-subnet");
    expect(getEdgeKind("nat", "vpc")).toBe("nat-vpc");
    expect(getEdgeKind("router", "vpc")).toBe("router-vpc");
    expect(getEdgeKind("peering", "vpc")).toBe("peering-vpc");
    expect(getEdgeKind("vpn", "vpc")).toBe("vpn-vpc");
    expect(getEdgeKind("interconnect", "vpc")).toBe("interconnect-vpc");
    expect(getEdgeKind("firewall", "vpc")).toBe("firewall-vpc");
    expect(getEdgeKind("dns", "vpc")).toBe("dns-vpc");
    expect(getEdgeKind("internet", "nat")).toBe("internet-nat");
    expect(getEdgeKind("internet", "vpn")).toBe("internet-vpn");
    expect(getEdgeKind("internet", "interconnect")).toBe(
      "internet-interconnect",
    );
    expect(getEdgeKind("vm", "kms")).toBe("vm-kms");
    expect(getEdgeKind("storage", "kms")).toBe("storage-kms");
    expect(getEdgeKind("sql", "kms")).toBe("sql-kms");
    expect(getEdgeKind("bigquery", "kms")).toBe("bigquery-kms");
    expect(getEdgeKind("firestore", "kms")).toBe("firestore-kms");
    expect(getEdgeKind("spanner", "kms")).toBe("spanner-kms");
    expect(getEdgeKind("subnet", "nat")).toBe("subnet-nat");
    expect(getEdgeKind("gke", "artifact")).toBe("gke-artifact");
    expect(getEdgeKind("vm", "artifact")).toBe("vm-artifact");
    expect(getEdgeKind("run", "subnet")).toBe("run-subnet");
    expect(getEdgeKind("run", "artifact")).toBe("run-artifact");
    expect(getEdgeKind("build", "artifact")).toBe("build-artifact");
    expect(getEdgeKind("pubsub", "build")).toBe("pubsub-build");
    expect(getEdgeKind("storage", "build")).toBe("storage-build");
    expect(getEdgeKind("github", "build")).toBe("github-build");
    expect(getEdgeKind("github", "run")).toBe("github-run");
    expect(getEdgeKind("github", "gke")).toBe("github-gke");
    expect(getEdgeKind("iam", "project")).toBe("iam-project");
    expect(getEdgeKind("iam", "subnet")).toBe("iam-subnet");
    expect(getEdgeKind("iam", "kms")).toBe("iam-kms");
    expect(getEdgeKind("iam", "bigquery")).toBe("iam-bigquery");
    expect(getEdgeKind("spark", "subnet")).toBe("spark-subnet");
    expect(getEdgeKind("spark", "storage")).toBe("spark-storage");
    expect(getEdgeKind("spark", "bigquery")).toBe("spark-bigquery");
    expect(getEdgeKind("spark", "kms")).toBe("spark-kms");
    expect(getEdgeKind("airflow", "subnet")).toBe("airflow-subnet");
    expect(getEdgeKind("airflow", "storage")).toBe("airflow-storage");
    expect(getEdgeKind("airflow", "bigquery")).toBe("airflow-bigquery");
    expect(getEdgeKind("airflow", "kms")).toBe("airflow-kms");
    expect(getEdgeKind("pubsub", "airflow")).toBe("pubsub-airflow");
    expect(getEdgeKind("dataflow", "subnet")).toBe("dataflow-subnet");
    expect(getEdgeKind("dataflow", "storage")).toBe("dataflow-storage");
    expect(getEdgeKind("dataflow", "bigquery")).toBe("dataflow-bigquery");
    expect(getEdgeKind("dataflow", "kms")).toBe("dataflow-kms");
    expect(getEdgeKind("pubsub", "dataflow")).toBe("pubsub-dataflow");
    expect(getEdgeKind("workbench", "modelregistry")).toBe(
      "workbench-modelregistry",
    );
    expect(getEdgeKind("build", "modelregistry")).toBe("build-modelregistry");
    expect(getEdgeKind("modelregistry", "run")).toBe("modelregistry-run");
    expect(getEdgeKind("modelregistry", "gke")).toBe("modelregistry-gke");
    expect(getEdgeKind("modelregistry", "storage")).toBe(
      "modelregistry-storage",
    );
    expect(getEdgeKind("modelregistry", "kms")).toBe("modelregistry-kms");
    expect(getEdgeKind("pubsub", "run")).toBe("pubsub-run");
    expect(getEdgeKind("pubsub", "storage")).toBe("pubsub-storage");
    expect(getEdgeKind("pubsub", "bigquery")).toBe("pubsub-bigquery");
    expect(getEdgeKind("pubsub", "vm")).toBe("pubsub-vm");
    expect(getEdgeKind("pubsub", "gke")).toBe("pubsub-gke");
    expect(getEdgeKind("storage", "dataflow")).toBe("storage-dataflow");
    expect(getEdgeKind("storage", "bigquery")).toBe("storage-bigquery");
    expect(getEdgeKind("dataflow", "sql")).toBe("dataflow-sql");
    expect(getEdgeKind("dataflow", "firestore")).toBe("dataflow-firestore");
    expect(getEdgeKind("dataflow", "pubsub")).toBe("dataflow-pubsub");
    expect(getEdgeKind("bigquery", "storage")).toBe("bigquery-storage");
    expect(getEdgeKind("run", "bigquery")).toBe("run-bigquery");
    expect(getEdgeKind("gke", "bigquery")).toBe("gke-bigquery");
    expect(getEdgeKind("airflow", "dataflow")).toBe("airflow-dataflow");
    expect(getEdgeKind("airflow", "spark")).toBe("airflow-spark");
    expect(getEdgeKind("spark", "sql")).toBe("spark-sql");
    expect(getEdgeKind("spark", "vm")).toBe("spark-vm");
    expect(getEdgeKind("nat", "router")).toBe("nat-router");
    expect(getEdgeKind("router", "vpn")).toBe("router-vpn");
    expect(getEdgeKind("dns", "vm")).toBe("dns-vm");
    expect(getEdgeKind("firebase", "firestore")).toBe("firebase-firestore");
    expect(getEdgeKind("vm", "bigtable")).toBe("vm-bigtable");
    expect(getEdgeKind("spark", "bigtable")).toBe("spark-bigtable");
    expect(getEdgeKind("notebook", "subnet")).toBe("notebook-subnet");
    expect(getEdgeKind("internet", "loadbalancer")).toBe("internet-loadbalancer");
    expect(getEdgeKind("psc", "subnet")).toBe("psc-subnet");
    expect(getEdgeKind("psc", "vpc")).toBeNull();
    expect(getEdgeKind("vm", "secretmanager")).toBe("vm-secretmanager");
    expect(getEdgeKind("orgpolicy", "project")).toBe("orgpolicy-project");
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
    expect(getEdgeKind("pcuser", "entra")).toBe("pcuser-entra");
    expect(getEdgeKind("pcuser", "vm")).toBe("pcuser-vm");
    expect(getEdgeKind("pcuser", "run")).toBe("pcuser-run");
    expect(getEdgeKind("pcuser", "onprem")).toBe("pcuser-onprem");
    expect(getEdgeKind("entra", "vm")).toBe("entra-vm");
    expect(getEdgeKind("entra", "run")).toBe("entra-run");
    expect(getEdgeKind("entra", "gke")).toBe("entra-gke");
    expect(getEdgeKind("onprem", "entra")).toBe("onprem-entra");
    expect(getEdgeKind("onprem", "vpn")).toBe("onprem-vpn");
    expect(getEdgeKind("onprem", "interconnect")).toBe("onprem-interconnect");
    expect(getEdgeKind("onprem", "vm")).toBe("onprem-vm");
    expect(getEdgeKind("folder", "folder")).toBe("folder-folder");
    expect(getEdgeKind("folder", "project")).toBe("folder-project");
    expect(getEdgeKind("project", "folder")).toBeNull();
    expect(getEdgeKind("infocard", "vpc")).toBe("infocard-link");
    expect(getEdgeKind("vm", "infocard")).toBe("infocard-link");
    expect(getEdgeKind("infocard", "zone")).toBeNull();
    expect(getEdgeKind("infocard", "infocard")).toBe("infocard-link");
  });

  it("bloqueia VM → VPC e outras ligações inválidas", () => {
    expect(getEdgeKind("vm", "vpc")).toBeNull();
    expect(getEdgeKind("vpc", "peering")).toBeNull();
    expect(getEdgeKind("vpc", "vm")).toBeNull();
    expect(getEdgeKind("vpc", "subnet")).toBeNull();
    expect(getEdgeKind("subnet", "vm")).toBeNull();
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

  it("aceita VM → IAM, Cloud NAT e Firewall", () => {
    const iam: DiagramNode = {
      id: "iam-1",
      kind: "iam",
      position: { x: 300, y: 0 },
      data: {
        name: "iam-app",
        variant: "iam",
        serviceAccountEmail: "sa@projeto.iam.gserviceaccount.com",
        workloadPoolId: "",
        workloadProviderId: "",
        groupEmail: "",
        roles: [],
      },
    };
    const nat: DiagramNode = {
      id: "nat-1",
      kind: "nat",
      position: { x: 400, y: 0 },
      data: { name: "nat-egress", region: "southamerica-east1" },
    };
    const firewall: DiagramNode = {
      id: "firewall-1",
      kind: "firewall",
      position: { x: 500, y: 0 },
      data: { name: "allow-ssh", direction: "ingress" },
    };
    const diagramNodes = [...nodes, iam, nat, firewall];

    expect(
      validateConnection(
        {
          source: vm.id,
          target: iam.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "vm-iam" });

    expect(
      validateConnection(
        {
          source: vm.id,
          target: nat.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "vm-nat" });

    expect(
      validateConnection(
        {
          source: vm.id,
          target: firewall.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "vm-firewall" });
  });

  it("rejeita segunda identidade IAM na mesma VM", () => {
    const iamA: DiagramNode = {
      id: "iam-1",
      kind: "iam",
      position: { x: 300, y: 0 },
      data: {
        name: "iam-a",
        variant: "iam",
        serviceAccountEmail: "sa-a@projeto.iam.gserviceaccount.com",
        workloadPoolId: "",
        workloadProviderId: "",
        groupEmail: "",
        roles: [],
      },
    };
    const iamB: DiagramNode = {
      id: "iam-2",
      kind: "iam",
      position: { x: 400, y: 0 },
      data: {
        name: "iam-b",
        variant: "iam",
        serviceAccountEmail: "sa-b@projeto.iam.gserviceaccount.com",
        workloadPoolId: "",
        workloadProviderId: "",
        groupEmail: "",
        roles: [],
      },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: vm.id, target: iamA.id, kind: "vm-iam" },
    ];
    const result = validateConnection(
      {
        source: vm.id,
        target: iamB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, iamA, iamB], edges },
    );
    expect(result).toEqual({ valid: false, reason: "vm-has-iam" });
  });

  it("aceita VM → VM e rejeita par duplicado invertido", () => {
    const vmB: DiagramNode = {
      id: "vm-2",
      kind: "vm",
      position: { x: 300, y: 0 },
      data: { name: "vm-b", machineType: "e2-micro" },
    };
    const first = validateConnection(
      {
        source: vm.id,
        target: vmB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, vmB], edges: [] },
    );
    expect(first).toMatchObject({ valid: true, edgeKind: "vm-vm" });

    const edges: DiagramEdge[] = [
      { id: "e1", source: vm.id, target: vmB.id, kind: "vm-vm" },
    ];
    const reverse = validateConnection(
      {
        source: vmB.id,
        target: vm.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [...nodes, vmB], edges },
    );
    expect(reverse).toEqual({ valid: false, reason: "duplicate-edge" });
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
        imageUrl: "",
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
        imageUrl: "",
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
        imageUrl: "",
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

  it("aceita VM → Cloud KMS", () => {
    const kms: DiagramNode = {
      id: "kms-1",
      kind: "kms",
      position: { x: 200, y: 0 },
      data: { name: "kms-app", location: "southamerica-east1" },
    };
    const result = validateConnection(
      {
        source: vm.id,
        target: kms.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, kms], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "vm-kms" });
  });

  it("aceita Cloud Storage → Cloud KMS", () => {
    const kms: DiagramNode = {
      id: "kms-1",
      kind: "kms",
      position: { x: 200, y: 0 },
      data: { name: "kms-bucket", location: "southamerica-east1" },
    };
    const result = validateConnection(
      {
        source: storage.id,
        target: kms.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: [...nodes, kms], edges: [] },
    );
    expect(result).toMatchObject({ valid: true, edgeKind: "storage-kms" });
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

  it("aceita Cloud Interconnect → VPC e normaliza VPC → Interconnect", () => {
    const interconnect: DiagramNode = {
      id: "interconnect-1",
      kind: "interconnect",
      position: { x: 200, y: 0 },
      data: { name: "ic-1", region: "southamerica-east1" },
    };
    const diagramNodes = [vpc, interconnect];

    const forward = validateConnection(
      {
        source: interconnect.id,
        target: vpc.id,
        sourceHandle: egress("right"),
        targetHandle: ingress("left"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(forward).toMatchObject({
      valid: true,
      edgeKind: "interconnect-vpc",
      source: interconnect.id,
      target: vpc.id,
    });

    const reversed = validateConnection(
      {
        source: vpc.id,
        target: interconnect.id,
        sourceHandle: egress("left"),
        targetHandle: ingress("right"),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(reversed).toMatchObject({
      valid: true,
      edgeKind: "interconnect-vpc",
      source: interconnect.id,
      target: vpc.id,
    });
  });

  it("rejeita segunda VPC no mesmo Cloud Interconnect", () => {
    const interconnect: DiagramNode = {
      id: "interconnect-1",
      kind: "interconnect",
      position: { x: 200, y: 0 },
      data: { name: "ic-1", region: "southamerica-east1" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const edges: DiagramEdge[] = [
      {
        id: "e1",
        source: interconnect.id,
        target: vpc.id,
        kind: "interconnect-vpc",
      },
    ];
    const result = validateConnection(
      {
        source: interconnect.id,
        target: vpcB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, vpcB, interconnect], edges },
    );
    expect(result).toEqual({ valid: false, reason: "interconnect-has-vpc" });
  });

  it("aceita Internet → Cloud Interconnect", () => {
    const interconnect: DiagramNode = {
      id: "interconnect-1",
      kind: "interconnect",
      position: { x: 200, y: 0 },
      data: { name: "ic-1", region: "southamerica-east1" },
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
        target: interconnect.id,
        sourceHandle: egress("bottom"),
        targetHandle: ingress("top"),
      },
      { nodes: [...nodes, interconnect, internet], edges: [] },
    );
    expect(result).toMatchObject({
      valid: true,
      edgeKind: "internet-interconnect",
      source: internet.id,
      target: interconnect.id,
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

  it("rejeita segunda VPC no mesmo Cloud Router", () => {
    const router: DiagramNode = {
      id: "router-1",
      kind: "router",
      position: { x: 200, y: 0 },
      data: { name: "router-1", region: "southamerica-east1" },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-2" },
    };
    const edges: DiagramEdge[] = [
      { id: "e1", source: router.id, target: vpc.id, kind: "router-vpc" },
    ];
    const result = validateConnection(
      {
        source: router.id,
        target: vpcB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: [vpc, vpcB, router], edges },
    );
    expect(result).toEqual({ valid: false, reason: "router-has-vpc" });
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

  it("aceita Cloud DNS → VPC e permite várias VPCs na mesma zona", () => {
    const dnsNode: DiagramNode = {
      id: "dns-1",
      kind: "dns",
      position: { x: 200, y: 0 },
      data: {
        name: "private-zone",
        dnsName: "internal.example.com.",
        visibility: "private",
      },
    };
    const vpcB: DiagramNode = {
      id: "vpc-2",
      kind: "vpc",
      position: { x: 400, y: 0 },
      data: { name: "vpc-b" },
    };
    const diagramNodes = [vpc, vpcB, dnsNode];
    const first = validateConnection(
      {
        source: dnsNode.id,
        target: vpc.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: diagramNodes, edges: [] },
    );
    expect(first).toMatchObject({ valid: true, edgeKind: "dns-vpc" });

    const edges: DiagramEdge[] = [
      { id: "e1", source: dnsNode.id, target: vpc.id, kind: "dns-vpc" },
    ];
    const second = validateConnection(
      {
        source: dnsNode.id,
        target: vpcB.id,
        sourceHandle: egress(),
        targetHandle: ingress(),
      },
      { nodes: diagramNodes, edges },
    );
    expect(second).toMatchObject({ valid: true, edgeKind: "dns-vpc" });
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

  it("aceita GitHub → Cloud Build, Cloud Run e GKE", () => {
    const github: DiagramNode = {
      id: "github-1",
      kind: "github",
      position: { x: 0, y: 0 },
      data: { name: "github-app", repository: "my-org/my-repo" },
    };
    const build: DiagramNode = {
      id: "build-1",
      kind: "build",
      position: { x: 100, y: 0 },
      data: { name: "build-ci", location: "southamerica-east1" },
    };
    const run: DiagramNode = {
      id: "run-1",
      kind: "run",
      position: { x: 200, y: 0 },
      data: {
        name: "run-api",
        imageUrl: "",
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "public",
      },
    };
    const gke: DiagramNode = {
      id: "gke-1",
      kind: "gke",
      position: { x: 300, y: 0 },
      data: { name: "gke-prod", nodeCount: 3, machineType: "e2-medium" },
    };
    const diagramNodes = [github, build, run, gke];

    expect(
      validateConnection(
        {
          source: github.id,
          target: build.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "github-build" });

    expect(
      validateConnection(
        {
          source: github.id,
          target: run.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "github-run" });

    expect(
      validateConnection(
        {
          source: github.id,
          target: gke.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "github-gke" });
  });

  it("aceita IAM → Projeto, Sub-rede, KMS e BigQuery", () => {
    const iam: DiagramNode = {
      id: "iam-1",
      kind: "iam",
      position: { x: 0, y: 0 },
      data: {
        name: "iam-app",
        variant: "iam",
        serviceAccountEmail: "sa@projeto.iam.gserviceaccount.com",
        workloadPoolId: "pool-external",
        workloadProviderId: "provider-github",
        groupEmail: "eng@example.com",
        roles: ["roles/viewer"],
      },
    };
    const project: DiagramNode = {
      id: "project-1",
      kind: "project",
      position: { x: 100, y: 0 },
      data: { name: "proj-prd" },
    };
    const subnetNode: DiagramNode = {
      id: "subnet-2",
      kind: "subnet",
      position: { x: 200, y: 0 },
      data: {
        name: "sub-app",
        region: "southamerica-east1",
        cidr: "10.1.0.0/24",
      },
    };
    const kms: DiagramNode = {
      id: "kms-1",
      kind: "kms",
      position: { x: 300, y: 0 },
      data: { name: "keyring-app", location: "southamerica-east1" },
    };
    const bigquery: DiagramNode = {
      id: "bigquery-1",
      kind: "bigquery",
      position: { x: 400, y: 0 },
      data: { name: "dataset-app", location: "southamerica-east1" },
    };
    const diagramNodes = [iam, project, subnetNode, kms, bigquery];

    expect(
      validateConnection(
        {
          source: iam.id,
          target: project.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "iam-project" });

    expect(
      validateConnection(
        {
          source: iam.id,
          target: subnetNode.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "iam-subnet" });

    expect(
      validateConnection(
        {
          source: iam.id,
          target: kms.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "iam-kms" });

    expect(
      validateConnection(
        {
          source: iam.id,
          target: bigquery.id,
          sourceHandle: egress(),
          targetHandle: ingress(),
        },
        { nodes: diagramNodes, edges: [] },
      ),
    ).toMatchObject({ valid: true, edgeKind: "iam-bigquery" });
  });
});
