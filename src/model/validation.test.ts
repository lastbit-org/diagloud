import { describe, expect, it } from "vitest";
import { collectDiagramIssues, issuesForNode } from "./validation";
import type { DiagramEdge, DiagramNode } from "../types";

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

const storagePublic: DiagramNode = {
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

const storageVm: DiagramNode = {
  ...storagePublic,
  id: "storage-2",
  data: { ...storagePublic.data, name: "bucket-2", accessMode: "vm" },
};

const sqlPublic: DiagramNode = {
  id: "sql-1",
  kind: "sql",
  position: { x: 0, y: 0 },
  data: {
    name: "sql-1",
    region: "southamerica-east1",
    engine: "POSTGRES_15",
    accessMode: "public",
  },
};

const sqlPrivate: DiagramNode = {
  ...sqlPublic,
  id: "sql-2",
  data: { ...sqlPublic.data, name: "sql-2", accessMode: "private" },
};

describe("collectDiagramIssues", () => {
  it("detecta GKE órfão", () => {
    const gke: DiagramNode = {
      id: "gke-1",
      kind: "gke",
      position: { x: 0, y: 0 },
      data: { name: "gke-1", nodeCount: 3, machineType: "e2-medium" },
    };
    const issues = collectDiagramIssues([gke], []);
    expect(
      issues.some((i) => i.code === "orphan-gke" && i.nodeId === "gke-1"),
    ).toBe(true);
  });

  it("detecta VM órfã", () => {
    const issues = collectDiagramIssues([vpc, subnet, vm], []);
    expect(issues.some((i) => i.code === "orphan-vm" && i.nodeId === "vm-1")).toBe(
      true,
    );
  });

  it("permite bucket público/CLI isolado sem aviso", () => {
    const issues = collectDiagramIssues([storagePublic], []);
    expect(issues.some((i) => i.code === "orphan-storage")).toBe(false);
  });

  it("avisa bucket em modo VM sem ligação", () => {
    const issues = collectDiagramIssues([storageVm], []);
    expect(
      issues.some(
        (i) =>
          i.code === "orphan-storage" &&
          i.nodeId === "storage-2" &&
          i.severity === "warning",
      ),
    ).toBe(true);
  });

  it("permite Cloud SQL público isolado", () => {
    const issues = collectDiagramIssues([sqlPublic], []);
    expect(issues.some((i) => i.code === "orphan-sql-private")).toBe(false);
  });

  it("avisa Cloud SQL privado sem VPC", () => {
    const issues = collectDiagramIssues([sqlPrivate], []);
    expect(
      issues.some(
        (i) => i.code === "orphan-sql-private" && i.nodeId === "sql-2",
      ),
    ).toBe(true);
  });

  it("não avisa bucket em modo VM quando ligado", () => {
    const edges: DiagramEdge[] = [
      { id: "e3", source: "vm-1", target: "storage-2", kind: "vm-storage" },
    ];
    const issues = collectDiagramIssues([vpc, subnet, vm, storageVm], edges);
    expect(issues.some((i) => i.code === "orphan-storage")).toBe(false);
  });

  it("detecta sub-rede sem VPC", () => {
    const issues = collectDiagramIssues([vpc, subnet], []);
    expect(
      issues.some((i) => i.code === "subnet-without-vpc" && i.nodeId === "subnet-1"),
    ).toBe(true);
  });

  it("detecta CIDR inválido", () => {
    const badSubnet: DiagramNode = {
      ...subnet,
      data: { ...subnet.data, cidr: "invalid" },
    };
    const issues = collectDiagramIssues([badSubnet], []);
    expect(
      issues.some((i) => i.code === "subnet-invalid-cidr" && i.nodeId === "subnet-1"),
    ).toBe(true);
  });

  it("detecta CIDR sobreposto", () => {
    const subnetB: DiagramNode = {
      ...subnet,
      id: "subnet-2",
      data: { ...subnet.data, name: "subnet-2", cidr: "10.0.0.0/25" },
    };
    const issues = collectDiagramIssues([subnet, subnetB], []);
    expect(
      issues.some((i) => i.code === "subnet-cidr-overlap" && i.nodeId === "subnet-2"),
    ).toBe(true);
  });

  it("não reporta problemas em diagrama válido", () => {
    const edges: DiagramEdge[] = [
      { id: "e1", source: "subnet-1", target: "vpc-1", kind: "subnet-vpc" },
      { id: "e2", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
    ];
    const issues = collectDiagramIssues([vpc, subnet, vm], edges);
    expect(issues).toHaveLength(0);
  });

  it("agrupa issues por nó", () => {
    const issues = collectDiagramIssues([subnet], []);
    expect(issuesForNode("subnet-1", issues).length).toBeGreaterThanOrEqual(1);
  });
});
