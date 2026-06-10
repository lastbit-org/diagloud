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
import {
  clearGkeNetwork,
  reassignSubnetGkeIps,
} from "../model/gkeSubnet";
import {
  clearRunNetwork,
  reassignSubnetRunIps,
} from "../model/runSubnet";
import {
  clearWorkbenchNetwork,
  reassignSubnetWorkbenchIps,
} from "../model/workbenchSubnet";
import {
  clearSqlPrivateNetwork,
  reassignSubnetSqlIps,
} from "../model/sqlSubnet";
import { resolveEdgeHandles } from "../lib/dynamicHandles";
import { validateConnection } from "../model/connections";
import {
  bringNodeToFront,
  defaultZIndexForKind,
  sendNodeToBack,
} from "../lib/nodeLayers";
import { validateSubnetCidr } from "../model/subnet";
import type {
  DiagramDocument,
  DiagramEdge,
  DiagramNode,
  LegacyDiagramDocument,
  ResourceKind,
  ResourcePropsByKind,
  GkeProps,
  SqlProps,
  StorageProps,
  SubnetProps,
  VmProps,
  VpcProps,
  NatProps,
  PeeringProps,
  VpnProps,
  FirewallProps,
  ArtifactProps,
  InternetProps,
  RunProps,
  PubsubProps,
  BigqueryProps,
  SpannerProps,
  WorkbenchProps,
  ZoneProps,
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
    data:
      | Partial<VpcProps>
      | Partial<SubnetProps>
      | Partial<VmProps>
      | Partial<StorageProps>
      | Partial<SqlProps>
      | Partial<GkeProps>
      | Partial<NatProps>
      | Partial<PeeringProps>
      | Partial<VpnProps>
      | Partial<FirewallProps>
      | Partial<ArtifactProps>
      | Partial<InternetProps>
      | Partial<RunProps>
      | Partial<PubsubProps>
      | Partial<BigqueryProps>
      | Partial<SpannerProps>
      | Partial<WorkbenchProps>
      | Partial<ZoneProps>,
  ) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  bringNodeToFront: (id: string) => void;
  sendNodeToBack: (id: string) => void;
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
  const existingSubnetCidrs = context?.existingSubnetCidrs ?? [];
  const nodes = context?.nodes ?? [];
  const base = {
    id: createNodeId(kind),
    position,
    zIndex: defaultZIndexForKind(kind, nodes),
  };
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
    case "storage":
      return {
        ...base,
        kind: "storage",
        data: { ...defaultResourceData("storage", resourceContext), ...data },
      };
    case "sql":
      return {
        ...base,
        kind: "sql",
        data: { ...defaultResourceData("sql", resourceContext), ...data },
      };
    case "gke":
      return {
        ...base,
        kind: "gke",
        data: { ...defaultResourceData("gke", resourceContext), ...data },
      };
    case "nat":
      return {
        ...base,
        kind: "nat",
        data: { ...defaultResourceData("nat", resourceContext), ...data },
      };
    case "peering":
      return {
        ...base,
        kind: "peering",
        data: { ...defaultResourceData("peering", resourceContext), ...data },
      };
    case "vpn":
      return {
        ...base,
        kind: "vpn",
        data: { ...defaultResourceData("vpn", resourceContext), ...data },
      };
    case "firewall":
      return {
        ...base,
        kind: "firewall",
        data: { ...defaultResourceData("firewall", resourceContext), ...data },
      };
    case "artifact":
      return {
        ...base,
        kind: "artifact",
        data: { ...defaultResourceData("artifact", resourceContext), ...data },
      };
    case "internet":
      return {
        ...base,
        kind: "internet",
        data: { ...defaultResourceData("internet", resourceContext), ...data },
      };
    case "run":
      return {
        ...base,
        kind: "run",
        data: { ...defaultResourceData("run", resourceContext), ...data },
      };
    case "pubsub":
      return {
        ...base,
        kind: "pubsub",
        data: { ...defaultResourceData("pubsub", resourceContext), ...data },
      };
    case "bigquery":
      return {
        ...base,
        kind: "bigquery",
        data: { ...defaultResourceData("bigquery", resourceContext), ...data },
      };
    case "spanner":
      return {
        ...base,
        kind: "spanner",
        data: { ...defaultResourceData("spanner", resourceContext), ...data },
      };
    case "workbench":
      return {
        ...base,
        kind: "workbench",
        data: { ...defaultResourceData("workbench", resourceContext), ...data },
      };
    case "zone":
      return {
        ...base,
        kind: "zone",
        data: { ...defaultResourceData("zone", resourceContext), ...data },
      };
  }
}

function mergeNodeData(
  node: DiagramNode,
  patch:
    | Partial<VpcProps>
    | Partial<SubnetProps>
    | Partial<VmProps>
    | Partial<StorageProps>
    | Partial<SqlProps>
    | Partial<GkeProps>
    | Partial<NatProps>
    | Partial<PeeringProps>
    | Partial<VpnProps>
    | Partial<ArtifactProps>
    | Partial<InternetProps>
    | Partial<RunProps>
    | Partial<PubsubProps>
    | Partial<BigqueryProps>
    | Partial<SpannerProps>
    | Partial<WorkbenchProps>
    | Partial<ZoneProps>,
): DiagramNode {
  switch (node.kind) {
    case "vpc":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<VpcProps>) },
      };
    case "subnet":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<SubnetProps>) },
      };
    case "vm":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<VmProps>) },
      };
    case "storage":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<StorageProps>) },
      };
    case "sql":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<SqlProps>) },
      };
    case "gke":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<GkeProps>) },
      };
    case "nat":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<NatProps>) },
      };
    case "peering":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<PeeringProps>) },
      };
    case "vpn":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<VpnProps>) },
      };
    case "firewall":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FirewallProps>) },
      };
    case "artifact":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ArtifactProps>) },
      };
    case "internet":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<InternetProps>) },
      };
    case "run":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<RunProps>) },
      };
    case "pubsub":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<PubsubProps>) },
      };
    case "bigquery":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<BigqueryProps>) },
      };
    case "spanner":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<SpannerProps>) },
      };
    case "workbench":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<WorkbenchProps>) },
      };
    case "zone":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ZoneProps>) },
      };
  }
}

function reassignSubnetHostIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  let next = reassignSubnetVmIps(subnetId, nodes, edges);
  next = reassignSubnetSqlIps(subnetId, next, edges);
  next = reassignSubnetGkeIps(subnetId, next, edges);
  next = reassignSubnetRunIps(subnetId, next, edges);
  next = reassignSubnetWorkbenchIps(subnetId, next, edges);
  return next;
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
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (
        !node ||
        (node.position.x === position.x && node.position.y === position.y)
      ) {
        return state;
      }

      return {
        nodes: state.nodes.map((current) =>
          current.id === id ? { ...current, position } : current,
        ),
      };
    });
  },

  bringNodeToFront: (id) => {
    set((state) => ({
      nodes: bringNodeToFront(state.nodes, id),
    }));
  },

  sendNodeToBack: (id) => {
    set((state) => ({
      nodes: sendNodeToBack(state.nodes, id),
    }));
  },

  updateNodeDimensions: (id, width, height) => {
    const nextWidth = Math.max(120, width);
    const nextHeight = Math.max(80, height);

    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (
        !node ||
        node.kind !== "zone" ||
        (node.data.width === nextWidth && node.data.height === nextHeight)
      ) {
        return state;
      }

      return {
        nodes: state.nodes.map((current) =>
          current.id === id && current.kind === "zone"
            ? {
                ...current,
                data: {
                  ...current.data,
                  width: nextWidth,
                  height: nextHeight,
                },
              }
            : current,
        ),
      };
    });
  },

  updateNodeData: (id, data) => {
    set((state) => {
      let nodes = state.nodes.map((node) =>
        node.id === id ? mergeNodeData(node, data) : node,
      );
      let edges = state.edges;
      const updated = nodes.find((node) => node.id === id);

      if (updated?.kind === "subnet" && "region" in data && data.region !== undefined) {
        nodes = reassignSubnetHostIps(id, nodes, edges);
      }

      if (updated?.kind === "sql" && "accessMode" in data && data.accessMode === "public") {
        nodes = clearSqlPrivateNetwork(id, nodes);
        const subnetEdge = edges.find(
          (e) => e.kind === "sql-subnet" && e.source === id,
        );
        edges = edges.filter(
          (e) => !(e.kind === "sql-subnet" && e.source === id),
        );
        if (subnetEdge) {
          nodes = reassignSubnetHostIps(subnetEdge.target, nodes, edges);
        }
      }

      if (updated?.kind === "sql" && "accessMode" in data && data.accessMode === "private") {
        const subnetEdge = edges.find(
          (e) => e.kind === "sql-subnet" && e.source === id,
        );
        if (subnetEdge) {
          nodes = reassignSubnetSqlIps(subnetEdge.target, nodes, edges);
        }
      }

      if (updated?.kind === "run" && "accessMode" in data && data.accessMode === "public") {
        nodes = clearRunNetwork(id, nodes);
        const subnetEdge = edges.find(
          (e) => e.kind === "run-subnet" && e.source === id,
        );
        edges = edges.filter(
          (e) => !(e.kind === "run-subnet" && e.source === id),
        );
        if (subnetEdge) {
          nodes = reassignSubnetHostIps(subnetEdge.target, nodes, edges);
        }
      }

      if (updated?.kind === "run" && "accessMode" in data && data.accessMode === "vpc") {
        const subnetEdge = edges.find(
          (e) => e.kind === "run-subnet" && e.source === id,
        );
        if (subnetEdge) {
          nodes = reassignSubnetRunIps(subnetEdge.target, nodes, edges);
        }
      }

      return { nodes, edges };
    });
  },

  setSubnetCidr: (id, cidr) => {
    let applied = false;
    set((state) => {
      const validation = validateSubnetCidr(cidr, id, state.nodes);
      if (!validation.valid) return state;

      applied = true;
      let nodes = state.nodes.map((node) =>
        node.id === id && node.kind === "subnet"
          ? {
              ...node,
              data: { ...node.data, cidr: validation.normalized },
            }
          : node,
      );
      nodes = reassignSubnetHostIps(id, nodes, state.edges);
      return { nodes };
    });
    return applied;
  },

  removeNode: (id) => {
    set((state) => {
      const affectedSubnetIds = new Set<string>();
      for (const edge of state.edges) {
        if (
          (edge.kind === "vm-subnet" ||
            edge.kind === "sql-subnet" ||
            edge.kind === "gke-subnet" ||
            edge.kind === "run-subnet" ||
            edge.kind === "workbench-subnet") &&
          (edge.source === id || edge.target === id)
        ) {
          affectedSubnetIds.add(edge.target);
        }
      }

      const edges = state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      );
      const selectedEdgeRemoved =
        state.selectedEdgeId !== null &&
        !edges.some((edge) => edge.id === state.selectedEdgeId);

      let nodes = state.nodes.filter((node) => node.id !== id);
      for (const subnetId of affectedSubnetIds) {
        nodes = reassignSubnetHostIps(subnetId, nodes, edges);
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
      const resolved = resolveEdgeHandles(edge);
      const sourceHandle = edge.sourceHandle ?? resolved.sourceHandle;
      const targetHandle = edge.targetHandle ?? resolved.targetHandle;
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

      const next: DiagramEdge = {
        ...edge,
        id: edge.id ?? createEdgeId(),
        kind: result.edgeKind,
        source: result.source,
        target: result.target,
        sourceHandle: result.sourceHandle ?? sourceHandle,
        targetHandle: result.targetHandle ?? targetHandle,
      };
      const edges = [...state.edges, next];
      let nodes = state.nodes;

      if (
        next.kind === "vm-subnet" ||
        next.kind === "sql-subnet" ||
        next.kind === "gke-subnet" ||
        next.kind === "run-subnet" ||
        next.kind === "workbench-subnet"
      ) {
        if (next.kind === "vm-subnet") {
          nodes = assignIpToVm(next.source, next.target, nodes, edges);
        }
        nodes = reassignSubnetHostIps(next.target, nodes, edges);
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
          nodes = reassignSubnetHostIps(removed.target, nodes, edges);
        }
      }

      if (removed?.kind === "sql-subnet") {
        nodes = clearSqlPrivateNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "gke-subnet") {
        nodes = clearGkeNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "run-subnet") {
        nodes = clearRunNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "workbench-subnet") {
        nodes = clearWorkbenchNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
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
