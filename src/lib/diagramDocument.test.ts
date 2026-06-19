import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { createEdgeId, createNodeId } from "./id";
import {
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
} from "./dynamicHandles";
import {
  buildDiagramDocument,
  documentsEqual,
  filterEdgesWithValidReferences,
  parseDiagramDocument,
  serializeDiagramDocument,
} from "./diagramDocument";
import { useDiagramStore } from "../store/diagramStore";
import { useNamingStore } from "../store/namingStore";
import { assignDefaultZIndices } from "./nodeLayers";
import type { DiagramDocument } from "../types";

const sampleDocument: DiagramDocument = {
  version: 1,
  metadata: {
    savedAt: "2026-06-01T12:00:00.000Z",
    generator: "diagloud",
    naming: {
      area: "financeiro",
      ambiente: "prd",
      isActive: true,
      patterns: {
        vpc: "vpc-AREA-AMBIENTE",
        subnet: "sub-AREA-AMBIENTE",
        vm: "vm-##-AREA-AMBIENTE",
        storage: "gcs-AREA-AMBIENTE",
        sql: "sql-AREA-AMBIENTE",
        gke: "gke-AREA-AMBIENTE",
        nat: "nat-AREA-AMBIENTE",
        router: "router-AREA-AMBIENTE",
        peering: "peer-AREA-AMBIENTE",
        vpn: "vpn-AREA-AMBIENTE",
        interconnect: "ic-AREA-AMBIENTE",
        firewall: "fw-AREA-AMBIENTE",
        dns: "dns-AREA-AMBIENTE",
        artifact: "gar-AREA-AMBIENTE",
        build: "cb-AREA-AMBIENTE",
        kms: "kms-AREA-AMBIENTE",
        internet: "Internet",
        run: "run-AREA-AMBIENTE",
        pubsub: "topic-AREA-AMBIENTE",
        eventarc: "ea-AREA-AMBIENTE",
        bigquery: "bq-AREA-AMBIENTE",
        spanner: "spanner-AREA-AMBIENTE",
        firestore: "fs-AREA-AMBIENTE",
        bigtable: "bt-AREA-AMBIENTE",
        firebase: "firebase-AREA-AMBIENTE",
        workbench: "wb-AREA-AMBIENTE",
        notebook: "nb-AREA-AMBIENTE",
        spark: "spark-AREA-AMBIENTE",
        airflow: "composer-AREA-AMBIENTE",
        dataflow: "dataflow-AREA-AMBIENTE",
        modelregistry: "mr-AREA-AMBIENTE",
        zone: "zona-AREA-AMBIENTE",
        folder: "folder-AREA-AMBIENTE",
        project: "proj-AREA-AMBIENTE",
        entra: "entra-AREA-AMBIENTE",
        infocard: "info-AREA-AMBIENTE",
        pcuser: "user-AREA-AMBIENTE",
        onprem: "onprem-AREA-AMBIENTE",
        github: "github-AREA-AMBIENTE",
        iam: "iam-AREA-AMBIENTE",
        loadbalancer: "lb-AREA-AMBIENTE",
        cdn: "cdn-AREA-AMBIENTE",
        orgpolicy: "orgpol-AREA-AMBIENTE",
        psc: "psc-AREA-AMBIENTE",
        secretmanager: "secret-AREA-AMBIENTE",
        certificatemanager: "cert-AREA-AMBIENTE",
        apigee: "apigee-AREA-AMBIENTE",
        memorystore: "ms-AREA-AMBIENTE",
        alloydb: "alloydb-AREA-AMBIENTE",
        cloudshell: "shell-AREA-AMBIENTE",
        monitoring: "monitoring-AREA-AMBIENTE",
      },
    },
  },
  nodes: [
    {
      id: "vpc-1",
      kind: "vpc",
      position: { x: 100, y: 50 },
      zIndex: 1000,
      data: { name: "vpc-financeiro-prd" },
    },
    {
      id: "subnet-1",
      kind: "subnet",
      position: { x: 100, y: 180 },
      zIndex: 1001,
      data: {
        name: "sub-financeiro-prd",
        region: "southamerica-east1",
        cidr: "10.0.0.0/24",
      },
    },
    {
      id: "vm-1",
      kind: "vm",
      position: { x: 100, y: 310 },
      zIndex: 1002,
      data: {
        name: "vm-01-financeiro-prd",
        machineType: "e2-micro",
        region: "southamerica-east1",
        internalIp: "10.0.0.4",
      },
    },
  ],
  edges: [
    {
      id: "edge-1",
      source: "subnet-1",
      target: "vpc-1",
      kind: "subnet-vpc",
      sourceHandle: DEFAULT_SOURCE_HANDLE,
      targetHandle: DEFAULT_TARGET_HANDLE,
    },
    {
      id: "edge-2",
      source: "vm-1",
      target: "subnet-1",
      kind: "vm-subnet",
      sourceHandle: DEFAULT_SOURCE_HANDLE,
      targetHandle: DEFAULT_TARGET_HANDLE,
    },
  ],
};

describe("diagramDocument", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    useDiagramStore.getState().reset();
  });

  it("serializa e faz parse round-trip preservando nodes e edges", () => {
    const json = serializeDiagramDocument(sampleDocument);
    const parsed = parseDiagramDocument(json);

    expect(documentsEqual(sampleDocument, parsed)).toBe(true);
    expect(parsed.nodes).toHaveLength(3);
    expect(parsed.edges).toHaveLength(2);
    expect(parsed.metadata.generator).toBe("diagloud");
    expect(parsed.metadata.naming?.area).toBe("financeiro");
  });

  it("aceita documento legado sem metadata", () => {
    const legacy = {
      version: 1 as const,
      nodes: sampleDocument.nodes,
      edges: sampleDocument.edges,
    };
    const parsed = parseDiagramDocument(JSON.stringify(legacy));
    expect(parsed.nodes).toEqual(assignDefaultZIndices(sampleDocument.nodes));
    expect(parsed.edges).toEqual(sampleDocument.edges);
    expect(parsed.metadata.generator).toBe("diagloud");
  });

  it("rejeita JSON inválido", () => {
    expect(() => parseDiagramDocument("{")).toThrow(/JSON inválido/);
  });

  it("rejeita versão não suportada", () => {
    expect(() =>
      parseDiagramDocument(
        JSON.stringify({ ...sampleDocument, version: 99 }),
      ),
    ).toThrow(/Versão não suportada/);
  });

  it("buildDiagramDocument inclui metadata de nomenclatura", () => {
    const doc = buildDiagramDocument(sampleDocument.nodes, sampleDocument.edges, {
      area: "rh",
      ambiente: "hml",
      isActive: false,
      patterns: sampleDocument.metadata.naming!.patterns,
    });
    expect(doc.metadata.naming?.area).toBe("rh");
    expect(doc.version).toBe(1);
  });

  it("reimport com UUID preserva referências source/target das arestas", () => {
    const vpcId = createNodeId("vpc");
    const subnetId = createNodeId("subnet");
    const vmId = createNodeId("vm");
    const edgeVpcId = createEdgeId();
    const edgeVmId = createEdgeId();

    const doc: DiagramDocument = {
      version: 1,
      metadata: {
        savedAt: "2026-06-01T12:00:00.000Z",
        generator: "diagloud",
      },
      nodes: [
        {
          id: vpcId,
          kind: "vpc",
          position: { x: 0, y: 0 },
          data: { name: "vpc-a" },
        },
        {
          id: subnetId,
          kind: "subnet",
          position: { x: 0, y: 100 },
          data: {
            name: "sub-a",
            region: "southamerica-east1",
            cidr: "10.0.0.0/24",
          },
        },
        {
          id: vmId,
          kind: "vm",
          position: { x: 0, y: 200 },
          data: { name: "vm-a", machineType: "e2-micro" },
        },
      ],
      edges: [
        {
          id: edgeVpcId,
          source: subnetId,
          target: vpcId,
          kind: "subnet-vpc",
        },
        {
          id: edgeVmId,
          source: vmId,
          target: subnetId,
          kind: "vm-subnet",
        },
      ],
    };

    const json = serializeDiagramDocument(doc);
    const parsed = parseDiagramDocument(json);

    expect(parsed.nodes.map((n) => n.id)).toEqual([vpcId, subnetId, vmId]);
    expect(parsed.edges).toHaveLength(2);
    expect(parsed.edges[0].source).toBe(subnetId);
    expect(parsed.edges[0].target).toBe(vpcId);
    expect(parsed.edges[1].source).toBe(vmId);
    expect(parsed.edges[1].target).toBe(subnetId);

    useDiagramStore.getState().loadDocument(parsed);
    const exported = useDiagramStore.getState().getDocument();
    expect(exported.edges).toEqual(parsed.edges);
    expect(exported.nodes.map((n) => n.id)).toEqual(parsed.nodes.map((n) => n.id));
  });

  it("rejeita IDs de nó duplicados", () => {
    const duplicate = {
      ...sampleDocument,
      nodes: [sampleDocument.nodes[0], sampleDocument.nodes[0]],
    };
    expect(() => parseDiagramDocument(JSON.stringify(duplicate))).toThrow(
      /duplicado/,
    );
  });

  it("remove arestas com referência quebrada sem alterar IDs dos nós", () => {
    const nodes = sampleDocument.nodes;
    const edges = [
      ...sampleDocument.edges,
      {
        id: "edge-orphan",
        source: "missing-vm",
        target: "subnet-1",
        kind: "vm-subnet" as const,
      },
    ];
    const filtered = filterEdgesWithValidReferences(nodes, edges);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.id !== "edge-orphan")).toBe(true);
  });

  it("serializa e restaura zona com dimensões e cor", () => {
    const zoneId = createNodeId("zone");
    const doc: DiagramDocument = {
      version: 1,
      metadata: {
        savedAt: "2026-06-01T12:00:00.000Z",
        generator: "diagloud",
      },
      nodes: [
        {
          id: zoneId,
          kind: "zone",
          position: { x: 40, y: 40 },
          zIndex: 0,
          data: {
            name: "meu-projeto",
            colorId: "blue",
            borderWidth: "thin",
            borderStyle: "dashed",
            width: 400,
            height: 260,
          },
        },
      ],
      edges: [],
    };

    const parsed = parseDiagramDocument(serializeDiagramDocument(doc));
    expect(parsed.nodes[0]).toEqual(doc.nodes[0]);
  });

  it("aplica defaults de borda em zonas antigas sem borderWidth/borderStyle", () => {
    const zoneId = createNodeId("zone");
    const json = JSON.stringify({
      version: 1,
      metadata: { savedAt: "2026-06-01T12:00:00.000Z", generator: "diagloud" },
      nodes: [
        {
          id: zoneId,
          kind: "zone",
          position: { x: 0, y: 0 },
          data: {
            name: "legado",
            colorId: "slate",
            width: 320,
            height: 200,
          },
        },
      ],
      edges: [],
    });

    const parsed = parseDiagramDocument(json);
    expect(parsed.nodes[0]).toMatchObject({
      kind: "zone",
      data: {
        borderWidth: "normal",
        borderStyle: "solid",
      },
    });
  });

  it("updateNodeDimensions ignora nós que não são zona", () => {
    useDiagramStore.getState().reset();
    const vpcId = useDiagramStore.getState().addNode("vpc", { x: 10, y: 10 });
    useDiagramStore.getState().updateNodeDimensions(vpcId, 999, 999);
    const vpc = useDiagramStore.getState().nodes.find((n) => n.id === vpcId);
    expect(vpc?.kind).toBe("vpc");
    if (vpc?.kind === "vpc") {
      expect(vpc.data).toEqual({ name: expect.any(String) });
    }
  });

  it("updateNodeDimensions altera tamanho da zona", () => {
    useDiagramStore.getState().reset();
    const id = useDiagramStore.getState().addNode("zone", { x: 0, y: 0 });
    useDiagramStore.getState().updateNodeDimensions(id, 500, 300);
    const node = useDiagramStore.getState().nodes.find((n) => n.id === id);
    expect(node?.kind).toBe("zone");
    if (node?.kind === "zone") {
      expect(node.data.width).toBe(500);
      expect(node.data.height).toBe(300);
    }
  });

  it("store loadDocument + getDocument preserva o diagrama", () => {
    useDiagramStore.getState().loadDocument(sampleDocument);
    expect(useNamingStore.getState().isActive).toBe(true);
    const exported = useDiagramStore.getState().getDocument();
    expect(exported.nodes).toEqual(sampleDocument.nodes);
    expect(exported.edges).toEqual(sampleDocument.edges);
    expect(exported.metadata.naming).toEqual(sampleDocument.metadata.naming);
    expect(documentsEqual(sampleDocument, exported)).toBe(true);
  });
});
