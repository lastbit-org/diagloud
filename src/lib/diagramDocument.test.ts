import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { createEdgeId, createNodeId } from "./id";
import {
  buildDiagramDocument,
  documentsEqual,
  filterEdgesWithValidReferences,
  parseDiagramDocument,
  serializeDiagramDocument,
} from "./diagramDocument";
import { useDiagramStore } from "../store/diagramStore";
import { useNamingStore } from "../store/namingStore";
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
      },
    },
  },
  nodes: [
    {
      id: "vpc-1",
      kind: "vpc",
      position: { x: 100, y: 50 },
      data: { name: "vpc-financeiro-prd" },
    },
    {
      id: "subnet-1",
      kind: "subnet",
      position: { x: 100, y: 180 },
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
    },
    {
      id: "edge-2",
      source: "vm-1",
      target: "subnet-1",
      kind: "vm-subnet",
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
    expect(parsed.nodes).toEqual(sampleDocument.nodes);
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
