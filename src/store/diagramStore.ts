import { create } from "zustand";
import { suggestSubnetCidr } from "../lib/cidr";
import { defaultResourceData } from "../lib/defaults";
import { createEdgeId, createNodeId } from "../lib/id";
import {
  buildDiagramDocument,
  normalizeLoadedDocument,
} from "../lib/diagramDocument";
import { useNamingStore } from "./namingStore";
import {
  assignIpToVm,
  clearVmIp,
  reassignSubnetVmIps,
} from "../model/ipAssignment";
import { handlesForEdgeKind, validateConnection } from "../model/connections";
import { validateSubnetCidr } from "../model/subnet";
import type {
  DiagramDocument,
  DiagramEdge,
  DiagramNode,
  LegacyDiagramDocument,
  ResourceKind,
  ResourcePropsByKind,
  SubnetProps,
  VmProps,
  VpcProps,
} from "../types";

type DiagramState = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
};

type DiagramActions = {
  addNode: <K extends ResourceKind>(
    kind: K,
    position: { x: number; y: number },
    data?: Partial<ResourcePropsByKind[K]>,
  ) => string;
  updateNodePosition: (
    id: string,
    position: { x: number; y: number },
  ) => void;
  updateNodeData: (
    id: string,
    data: Partial<VpcProps> | Partial<SubnetProps> | Partial<VmProps>,
  ) => void;
  setSubnetCidr: (id: string, cidr: string) => boolean;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<DiagramEdge, "id"> & { id?: string }) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  loadDocument: (document: DiagramDocument | LegacyDiagramDocument) => void;
  reset: () => void;
  getDocument: () => DiagramDocument;
};

export type DiagramStore = DiagramState & DiagramActions;

const initialState: DiagramState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
};

function buildNode<K extends ResourceKind>(
  kind: K,
  position: { x: number; y: number },
  data?: Partial<ResourcePropsByKind[K]>,
  context?: { existingSubnetCidrs: string[]; nodes: DiagramNode[] },
): DiagramNode {
  const base = { id: createNodeId(kind), position };
  const existingSubnetCidrs = context?.existingSubnetCidrs ?? [];
  const nodes = context?.nodes ?? [];
  const resourceContext = { existingSubnetCidrs, nodes };

  switch (kind) {
    case "vpc":
      return {
        ...base,
        kind: "vpc",
        data: { ...defaultResourceData("vpc", resourceContext), ...data },
      };
    case "subnet": {
      const subnetDefaults = defaultResourceData("subnet", resourceContext);
      const merged = { ...subnetDefaults, ...data };
      const pseudoSubnetNodes: DiagramNode[] = existingSubnetCidrs.map(
        (existingCidr, index) => ({
          id: `__existing-subnet-${index}`,
          kind: "subnet",
          position: { x: 0, y: 0 },
          data: {
            name: "",
            region: "",
            cidr: existingCidr,
          },
        }),
      );
      const validation = validateSubnetCidr(
        merged.cidr,
        undefined,
        pseudoSubnetNodes,
      );
      const cidr = validation.valid
        ? validation.normalized
        : suggestSubnetCidr(existingSubnetCidrs);
      return {
        ...base,
        kind: "subnet",
        data: { ...merged, cidr },
      };
    }
    case "vm":
      return {
        ...base,
        kind: "vm",
        data: { ...defaultResourceData("vm", resourceContext), ...data },
      };
  }
}

function mergeNodeData(
  node: DiagramNode,
  patch: Partial<VpcProps> | Partial<SubnetProps> | Partial<VmProps>,
): DiagramNode {
  switch (node.kind) {
    case "vpc":
      return { ...node, data: { ...node.data, ...patch } };
    case "subnet":
      return { ...node, data: { ...node.data, ...patch } };
    case "vm":
      return { ...node, data: { ...node.data, ...patch } };
  }
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  ...initialState,

  addNode: (kind, position, data) => {
    const nodes = get().nodes;
    const existingSubnetCidrs = nodes
      .filter((n) => n.kind === "subnet")
      .map((n) => n.data.cidr);
    const node = buildNode(kind, position, data, {
      existingSubnetCidrs,
      nodes,
    });
    set((state) => ({ nodes: [...state.nodes, node] }));
    return node.id;
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node,
      ),
    }));
  },

  updateNodeData: (id, data) => {
    set((state) => {
      let nodes = state.nodes.map((node) =>
        node.id === id ? mergeNodeData(node, data) : node,
      );
      const updated = nodes.find((node) => node.id === id);
      if (
        updated?.kind === "subnet" &&
        "region" in data &&
        data.region !== undefined
      ) {
        nodes = reassignSubnetVmIps(id, nodes, state.edges);
      }
      return { nodes };
    });
  },

  setSubnetCidr: (id, cidr) => {
    let applied = false;
    set((state) => {
      const validation = validateSubnetCidr(cidr, id, state.nodes);
      if (!validation.valid) return state;

      applied = true;
      const nodes = state.nodes.map((node) =>
        node.id === id && node.kind === "subnet"
          ? {
              ...node,
              data: { ...node.data, cidr: validation.normalized },
            }
          : node,
      );
      return { nodes: reassignSubnetVmIps(id, nodes, state.edges) };
    });
    return applied;
  },

  removeNode: (id) => {
    set((state) => {
      const affectedSubnetIds = new Set(
        state.edges
          .filter(
            (edge) =>
              edge.kind === "vm-subnet" &&
              (edge.source === id || edge.target === id),
          )
          .map((edge) => edge.target),
      );

      const edges = state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      );
      const selectedEdgeRemoved =
        state.selectedEdgeId !== null &&
        !edges.some((edge) => edge.id === state.selectedEdgeId);

      let nodes = state.nodes.filter((node) => node.id !== id);
      for (const subnetId of affectedSubnetIds) {
        nodes = reassignSubnetVmIps(subnetId, nodes, edges);
      }

      return {
        nodes,
        edges,
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
        selectedEdgeId: selectedEdgeRemoved ? null : state.selectedEdgeId,
      };
    });
  },

  addEdge: (edge) => {
    set((state) => {
      const { sourceHandle, targetHandle } = handlesForEdgeKind(edge.kind);
      const result = validateConnection(
        {
          source: edge.source,
          target: edge.target,
          sourceHandle,
          targetHandle,
        },
        { nodes: state.nodes, edges: state.edges },
      );
      if (!result.valid) return state;

      const next: DiagramEdge = { ...edge, id: edge.id ?? createEdgeId() };
      const edges = [...state.edges, next];
      let nodes = state.nodes;

      if (next.kind === "vm-subnet") {
        nodes = assignIpToVm(next.source, next.target, nodes, edges);
      }

      return { edges, nodes };
    });
  },

  removeEdge: (id) => {
    set((state) => {
      const removed = state.edges.find((edge) => edge.id === id);
      const edges = state.edges.filter((edge) => edge.id !== id);
      let nodes = state.nodes;

      if (removed?.kind === "vm-subnet") {
        nodes = clearVmIp(removed.source, nodes);
        if (removed.target) {
          nodes = reassignSubnetVmIps(removed.target, nodes, edges);
        }
      }

      return {
        edges,
        nodes,
        selectedEdgeId:
          state.selectedEdgeId === id ? null : state.selectedEdgeId,
      };
    });
  },

  selectNode: (id) =>
    set({ selectedNodeId: id, selectedEdgeId: null }),

  selectEdge: (id) =>
    set({ selectedEdgeId: id, selectedNodeId: null }),

  clearSelection: () =>
    set({ selectedNodeId: null, selectedEdgeId: null }),

  deleteSelection: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    if (selectedNodeId) {
      get().removeNode(selectedNodeId);
      return;
    }
    if (selectedEdgeId) {
      get().removeEdge(selectedEdgeId);
    }
  },

  loadDocument: (document) => {
    const normalized = normalizeLoadedDocument(document);
    if (normalized.metadata.naming) {
      useNamingStore.setState(normalized.metadata.naming);
    }
    set({
      nodes: normalized.nodes,
      edges: normalized.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  reset: () => set(initialState),

  getDocument: () => {
    const { nodes, edges } = get();
    const { area, ambiente, patterns, isActive } = useNamingStore.getState();
    return buildDiagramDocument(nodes, edges, {
      area,
      ambiente,
      patterns,
      isActive,
    });
  },
}));
