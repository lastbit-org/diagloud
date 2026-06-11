import { describe, expect, it } from "vitest";
import { buildDiagramDocument } from "../../lib/diagramDocument";
import {
  combineTerraformFiles,
  generateTerraform,
  TerraformGenerateError,
  tfName,
} from "./generate";
import type { DiagramEdge, DiagramNode } from "../../types";
import { DEFAULT_TERRAFORM_EXPORT_OPTIONS } from "../../types/terraform";

const vpc: DiagramNode = {
  id: "vpc-1",
  kind: "vpc",
  position: { x: 0, y: 0 },
  data: { name: "vpc-financeiro-dev" },
};

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 100 },
  data: {
    name: "subnet-app",
    region: "southamerica-east1",
    cidr: "10.0.1.0/24",
  },
};

const vm: DiagramNode = {
  id: "vm-1",
  kind: "vm",
  position: { x: 0, y: 200 },
  data: {
    name: "vm-api",
    machineType: "e2-micro",
    region: "southamerica-east1",
    internalIp: "10.0.1.2",
  },
};

const validEdges: DiagramEdge[] = [
  { id: "e1", source: "subnet-1", target: "vpc-1", kind: "subnet-vpc" },
  { id: "e2", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
];

const defaultOptions = {
  ...DEFAULT_TERRAFORM_EXPORT_OPTIONS,
  projectId: "meu-proj-dev",
};

describe("tfName", () => {
  it("normaliza nomes para identificadores Terraform", () => {
    expect(tfName("VPC Financeiro Dev")).toBe("vpc_financeiro_dev");
    expect(tfName("---")).toBe("resource");
  });
});

describe("generateTerraform", () => {
  it("gera VPC, sub-rede e VM ligados", () => {
    const doc = buildDiagramDocument([vpc, subnet, vm], validEdges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["network.tf"]).toContain(
      'resource "google_compute_network" "vpc_financeiro_dev"',
    );
    expect(result.files["network.tf"]).toContain(
      'resource "google_compute_subnetwork" "subnet_app"',
    );
    expect(result.files["compute.tf"]).toContain(
      'resource "google_compute_instance" "vm_api"',
    );
    expect(result.files["compute.tf"]).toContain('network_ip = "10.0.1.2"');
    expect(result.files["providers.tf"]).toContain('source  = "hashicorp/google"');
    expect(result.files["variables.tf"]).toContain('default     = "meu-proj-dev"');
  });

  it("gera storage, pubsub e bigquery isolados", () => {
    const storage: DiagramNode = {
      id: "storage-1",
      kind: "storage",
      position: { x: 0, y: 0 },
      data: {
        name: "bucket-logs",
        location: "southamerica-east1",
        storageClass: "STANDARD",
        accessMode: "public",
      },
    };
    const pubsub: DiagramNode = {
      id: "pubsub-1",
      kind: "pubsub",
      position: { x: 100, y: 0 },
      data: { name: "topic-events" },
    };
    const bigquery: DiagramNode = {
      id: "bq-1",
      kind: "bigquery",
      position: { x: 200, y: 0 },
      data: { name: "analytics", location: "southamerica-east1" },
    };
    const doc = buildDiagramDocument([storage, pubsub, bigquery], []);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["data.tf"]).toContain("google_storage_bucket");
    expect(result.files["platform.tf"]).toContain("google_pubsub_topic");
    expect(result.files["data.tf"]).toContain("google_bigquery_dataset");
  });

  it("gera GKE e Cloud Run com sub-rede", () => {
    const gke: DiagramNode = {
      id: "gke-1",
      kind: "gke",
      position: { x: 0, y: 300 },
      data: { name: "cluster-app", nodeCount: 3, machineType: "e2-medium" },
    };
    const run: DiagramNode = {
      id: "run-1",
      kind: "run",
      position: { x: 100, y: 300 },
      data: {
        name: "service-api",
        cpu: "1",
        memory: "512Mi",
        minInstances: 1,
        accessMode: "vpc",
      },
    };
    const edges: DiagramEdge[] = [
      ...validEdges,
      { id: "e3", source: "gke-1", target: "subnet-1", kind: "gke-subnet" },
      { id: "e4", source: "run-1", target: "subnet-1", kind: "run-subnet" },
    ];
    const doc = buildDiagramDocument([vpc, subnet, vm, gke, run], edges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["compute.tf"]).toContain("google_container_cluster");
    expect(result.files["compute.tf"]).toContain("google_cloud_run_v2_service");
    expect(result.files["compute.tf"]).toContain("vpc_access");
  });

  it("gera NAT e firewall na VPC", () => {
    const nat: DiagramNode = {
      id: "nat-1",
      kind: "nat",
      position: { x: 200, y: 0 },
      data: { name: "nat-egress", region: "southamerica-east1" },
    };
    const firewall: DiagramNode = {
      id: "fw-1",
      kind: "firewall",
      position: { x: 300, y: 0 },
      data: { name: "allow-web", direction: "ingress" },
    };
    const edges: DiagramEdge[] = [
      validEdges[0],
      { id: "e3", source: "nat-1", target: "vpc-1", kind: "nat-vpc" },
      { id: "e4", source: "fw-1", target: "vpc-1", kind: "firewall-vpc" },
    ];
    const doc = buildDiagramDocument([vpc, subnet, nat, firewall], edges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["network.tf"]).toContain("google_compute_router_nat");
    expect(result.files["network.tf"]).toContain("google_compute_firewall");
  });

  it("gera Cloud Router ligado à VPC", () => {
    const router: DiagramNode = {
      id: "router-1",
      kind: "router",
      position: { x: 200, y: 0 },
      data: { name: "router-bgp", region: "southamerica-east1" },
    };
    const edges: DiagramEdge[] = [
      validEdges[0],
      { id: "e3", source: "router-1", target: "vpc-1", kind: "router-vpc" },
    ];
    const doc = buildDiagramDocument([vpc, subnet, router], edges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["network.tf"]).toContain('resource "google_compute_router"');
    expect(result.files["network.tf"]).toContain("router-bgp");
  });

  it("ignora Cloud Router isolado na exportação Terraform", () => {
    const router: DiagramNode = {
      id: "router-1",
      kind: "router",
      position: { x: 200, y: 0 },
      data: { name: "router-standalone", region: "southamerica-east1" },
    };
    const doc = buildDiagramDocument([vpc, subnet, router], validEdges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["network.tf"] ?? "").not.toContain("router-standalone");
  });

  it("documenta ligações do diagrama em connections.tf", () => {
    const storage: DiagramNode = {
      id: "storage-1",
      kind: "storage",
      position: { x: 200, y: 200 },
      data: {
        name: "bucket-data",
        location: "southamerica-east1",
        storageClass: "STANDARD",
        accessMode: "vm",
      },
    };
    const edges: DiagramEdge[] = [
      ...validEdges,
      { id: "e3", source: "vm-1", target: "storage-1", kind: "vm-storage" },
    ];
    const doc = buildDiagramDocument([vpc, subnet, vm, storage], edges);
    const result = generateTerraform(doc, defaultOptions);

    expect(result.files["connections.tf"]).toContain("vm-storage");
  });

  it("avisa recursos visuais não exportados", () => {
    const zone: DiagramNode = {
      id: "zone-1",
      kind: "zone",
      position: { x: 0, y: 0 },
      data: {
        name: "Zona App",
        colorId: "violet",
        borderWidth: "normal",
        borderStyle: "solid",
        width: 400,
        height: 300,
      },
    };
    const doc = buildDiagramDocument([vpc, subnet, vm, zone], validEdges);
    const result = generateTerraform(doc, defaultOptions);
    expect(result.warnings.some((w) => w.includes("zone"))).toBe(true);
  });

  it("bloqueia quando VM está órfã", () => {
    const doc = buildDiagramDocument(
      [vpc, subnet, vm],
      [{ id: "e1", source: "subnet-1", target: "vpc-1", kind: "subnet-vpc" }],
    );
    expect(() => generateTerraform(doc, defaultOptions)).toThrow(
      TerraformGenerateError,
    );
  });

  it("bloqueia diagrama vazio", () => {
    const doc = buildDiagramDocument([], []);
    expect(() => generateTerraform(doc, defaultOptions)).toThrow(
      /Adicione recursos/,
    );
  });

  it("bloqueia sem project_id", () => {
    const doc = buildDiagramDocument([vpc, subnet, vm], validEdges);
    expect(() =>
      generateTerraform(doc, { ...defaultOptions, projectId: "  " }),
    ).toThrow(/ID do projeto/);
  });

  it("combineTerraformFiles concatena na ordem correta", () => {
    const doc = buildDiagramDocument([vpc, subnet, vm], validEdges);
    const result = generateTerraform(doc, defaultOptions);
    const combined = combineTerraformFiles(result.files);
    expect(combined.indexOf("# --- providers.tf ---")).toBeLessThan(
      combined.indexOf("# --- variables.tf ---"),
    );
    expect(combined.indexOf("# --- network.tf ---")).toBeLessThan(
      combined.indexOf("# --- compute.tf ---"),
    );
  });
});

describe("resolveGraph via generateTerraform", () => {
  it("respeita arestas subnet-vpc invertidas no canvas", () => {
    const reversedEdges: DiagramEdge[] = [
      { id: "e1", source: "vpc-1", target: "subnet-1", kind: "subnet-vpc" },
      { id: "e2", source: "vm-1", target: "subnet-1", kind: "vm-subnet" },
    ];
    const doc = buildDiagramDocument([vpc, subnet, vm], reversedEdges);
    const result = generateTerraform(doc, defaultOptions);
    expect(result.files["compute.tf"]).toContain("google_compute_instance");
  });
});
