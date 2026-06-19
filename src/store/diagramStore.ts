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
  clearNotebookNetwork,
  reassignSubnetNotebookIps,
} from "../model/notebookSubnet";
import {
  clearWorkbenchNetwork,
  reassignSubnetWorkbenchIps,
} from "../model/workbenchSubnet";
import { assignSparkSubnetRegion } from "../model/sparkSubnet";
import { assignAirflowSubnetRegion } from "../model/airflowSubnet";
import { assignDataflowSubnetRegion } from "../model/dataflowSubnet";
import {
  clearSqlPrivateNetwork,
  reassignSubnetSqlIps,
} from "../model/sqlSubnet";
import {
  clearPscNetwork,
  reassignSubnetPscIps,
} from "../model/pscSubnet";
import {
  clearMemorystoreNetwork,
  reassignSubnetMemorystoreIps,
} from "../model/memorystoreSubnet";
import {
  clearAlloydbNetwork,
  reassignSubnetAlloydbIps,
} from "../model/alloydbSubnet";
import { resolveEdgeHandles } from "../lib/dynamicHandles";
import { validateConnection } from "../model/connections";
import {
  bringNodeToFront,
  defaultZIndexForKind,
  sendNodeToBack,
} from "../lib/nodeLayers";
import { validateSubnetCidr } from "../model/subnet";
import type { EdgeLineStyle } from "../lib/edgeLineStyle";
import {
  cloneDiagramSnapshot,
  clearPropertyEditHistoryTimers,
  isHistoryApplying,
  recordPropertyEditHistory,
  resetPropertyEditHistoryArm,
  setApplyingHistory,
  snapshotsEqual,
  trimHistory,
  type DiagramSnapshot,
} from "../lib/diagramHistory";
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
  RouterProps,
  PeeringProps,
  VpnProps,
  InterconnectProps,
  FirewallProps,
  DnsProps,
  ArtifactProps,
  BuildProps,
  KmsProps,
  InternetProps,
  RunProps,
  PubsubProps,
  EventarcProps,
  BigqueryProps,
  SpannerProps,
  FirestoreProps,
  BigtableProps,
  FirebaseProps,
  WorkbenchProps,
  NotebookProps,
  SparkProps,
  AirflowProps,
  DataflowProps,
  ModelRegistryProps,
  TuningProps,
  EvaluationProps,
  EndpointsProps,
  BatchInferenceProps,
  FeatureStoreProps,
  ExperimentsProps,
  TrainingProps,
  PipelinesProps,
  MlMonitoringProps,
  ZoneProps,
  FolderProps,
  ProjectProps,
  EntraProps,
  InfocardProps,
  PcUserProps,
  OnpremProps,
  GithubProps,
  LoadBalancerProps,
  CdnProps,
  OrgPolicyProps,
  PscProps,
  SecretManagerProps,
  CertificateManagerProps,
  ApigeeProps,
  MemorystoreProps,
  AlloydbProps,
  CloudShellProps,
  MonitoringProps,
  CloudLoggingProps,
  CloudArmorProps,
  KnowledgeCatalogProps,
  UserGroupProps,
  IamProps,
} from "../types";

type DiagramState = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  past: DiagramSnapshot[];
  future: DiagramSnapshot[];
  historyTransactionDepth: number;
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
      | Partial<RouterProps>
      | Partial<PeeringProps>
      | Partial<VpnProps>
      | Partial<InterconnectProps>
      | Partial<FirewallProps>
      | Partial<DnsProps>
      | Partial<ArtifactProps>
      | Partial<BuildProps>
      | Partial<KmsProps>
      | Partial<InternetProps>
      | Partial<RunProps>
      | Partial<PubsubProps>
      | Partial<BigqueryProps>
      | Partial<SpannerProps>
      | Partial<FirestoreProps>
      | Partial<BigtableProps>
      | Partial<FirebaseProps>
      | Partial<WorkbenchProps>
      | Partial<NotebookProps>
      | Partial<SparkProps>
      | Partial<AirflowProps>
      | Partial<DataflowProps>
      | Partial<ModelRegistryProps>
      | Partial<TuningProps>
      | Partial<EvaluationProps>
      | Partial<EndpointsProps>
      | Partial<BatchInferenceProps>
      | Partial<FeatureStoreProps>
      | Partial<ExperimentsProps>
      | Partial<TrainingProps>
      | Partial<PipelinesProps>
      | Partial<MlMonitoringProps>
      | Partial<ZoneProps>
      | Partial<FolderProps>
      | Partial<ProjectProps>
      | Partial<EntraProps>
      | Partial<InfocardProps>
      | Partial<PcUserProps>
      | Partial<OnpremProps>
      | Partial<GithubProps>
      | Partial<LoadBalancerProps>
      | Partial<CdnProps>
      | Partial<OrgPolicyProps>
      | Partial<PscProps>
      | Partial<SecretManagerProps>
      | Partial<CertificateManagerProps>
      | Partial<ApigeeProps>
      | Partial<MemorystoreProps>
      | Partial<AlloydbProps>
      | Partial<CloudShellProps>
      | Partial<MonitoringProps>
      | Partial<CloudLoggingProps>
      | Partial<CloudArmorProps>
      | Partial<KnowledgeCatalogProps>
      | Partial<UserGroupProps>
      | Partial<IamProps>,
  ) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  bringNodeToFront: (id: string) => void;
  sendNodeToBack: (id: string) => void;
  setSubnetCidr: (id: string, cidr: string) => boolean;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<DiagramEdge, "id"> & { id?: string }) => void;
  removeEdge: (id: string) => void;
  updateEdgeLineStyle: (id: string, lineStyle: EdgeLineStyle) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  loadDocument: (document: DiagramDocument | LegacyDiagramDocument) => void;
  reset: () => void;
  getDocument: () => DiagramDocument;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
};

export type DiagramStore = DiagramState & DiagramActions;

const initialState: DiagramState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  past: [],
  future: [],
  historyTransactionDepth: 0,
};

function pushHistorySnapshot(
  get: () => DiagramStore,
  set: (
    partial:
      | Partial<DiagramState>
      | ((state: DiagramState) => Partial<DiagramState>),
  ) => void,
): void {
  if (isHistoryApplying() || get().historyTransactionDepth > 0) return;

  const { nodes, edges, past } = get();
  const snapshot = cloneDiagramSnapshot(nodes, edges);
  const last = past[past.length - 1];
  if (last && snapshotsEqual(last, snapshot)) return;

  set({
    past: trimHistory([...past, snapshot]),
    future: [],
  });
}

function pushPropertyEditHistory(
  get: () => DiagramStore,
  set: (
    partial:
      | Partial<DiagramState>
      | ((state: DiagramState) => Partial<DiagramState>),
  ) => void,
): void {
  if (isHistoryApplying() || get().historyTransactionDepth > 0) return;

  const { nodes, edges } = get();
  recordPropertyEditHistory(cloneDiagramSnapshot(nodes, edges), (snapshot) => {
    const last = get().past[get().past.length - 1];
    if (last && snapshotsEqual(last, snapshot)) return;
    set({
      past: trimHistory([...get().past, snapshot]),
      future: [],
    });
  });
}

function clearHistoryState(): Partial<DiagramState> {
  resetPropertyEditHistoryArm();
  clearPropertyEditHistoryTimers();
  return {
    past: [],
    future: [],
    historyTransactionDepth: 0,
  };
}

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
    case "router":
      return {
        ...base,
        kind: "router",
        data: { ...defaultResourceData("router", resourceContext), ...data },
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
    case "interconnect":
      return {
        ...base,
        kind: "interconnect",
        data: {
          ...defaultResourceData("interconnect", resourceContext),
          ...data,
        },
      };
    case "firewall":
      return {
        ...base,
        kind: "firewall",
        data: { ...defaultResourceData("firewall", resourceContext), ...data },
      };
    case "dns":
      return {
        ...base,
        kind: "dns",
        data: { ...defaultResourceData("dns", resourceContext), ...data },
      };
    case "artifact":
      return {
        ...base,
        kind: "artifact",
        data: { ...defaultResourceData("artifact", resourceContext), ...data },
      };
    case "build":
      return {
        ...base,
        kind: "build",
        data: { ...defaultResourceData("build", resourceContext), ...data },
      };
    case "kms":
      return {
        ...base,
        kind: "kms",
        data: { ...defaultResourceData("kms", resourceContext), ...data },
      };
    case "iam":
      return {
        ...base,
        kind: "iam",
        data: { ...defaultResourceData("iam", resourceContext), ...data },
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
    case "eventarc":
      return {
        ...base,
        kind: "eventarc",
        data: { ...defaultResourceData("eventarc", resourceContext), ...data },
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
    case "firestore":
      return {
        ...base,
        kind: "firestore",
        data: { ...defaultResourceData("firestore", resourceContext), ...data },
      };
    case "bigtable":
      return {
        ...base,
        kind: "bigtable",
        data: { ...defaultResourceData("bigtable", resourceContext), ...data },
      };
    case "firebase":
      return {
        ...base,
        kind: "firebase",
        data: { ...defaultResourceData("firebase", resourceContext), ...data },
      };
    case "workbench":
      return {
        ...base,
        kind: "workbench",
        data: { ...defaultResourceData("workbench", resourceContext), ...data },
      };
    case "notebook":
      return {
        ...base,
        kind: "notebook",
        data: { ...defaultResourceData("notebook", resourceContext), ...data },
      };
    case "spark":
      return {
        ...base,
        kind: "spark",
        data: { ...defaultResourceData("spark", resourceContext), ...data },
      };
    case "airflow":
      return {
        ...base,
        kind: "airflow",
        data: { ...defaultResourceData("airflow", resourceContext), ...data },
      };
    case "dataflow":
      return {
        ...base,
        kind: "dataflow",
        data: { ...defaultResourceData("dataflow", resourceContext), ...data },
      };
    case "modelregistry":
      return {
        ...base,
        kind: "modelregistry",
        data: {
          ...defaultResourceData("modelregistry", resourceContext),
          ...data,
        },
      };
    case "tuning":
      return {
        ...base,
        kind: "tuning",
        data: {
          ...defaultResourceData("tuning", resourceContext),
          ...data,
        },
      };
    case "evaluation":
      return {
        ...base,
        kind: "evaluation",
        data: {
          ...defaultResourceData("evaluation", resourceContext),
          ...data,
        },
      };
    case "endpoints":
      return {
        ...base,
        kind: "endpoints",
        data: {
          ...defaultResourceData("endpoints", resourceContext),
          ...data,
        },
      };
    case "batchinference":
      return {
        ...base,
        kind: "batchinference",
        data: {
          ...defaultResourceData("batchinference", resourceContext),
          ...data,
        },
      };
    case "featurestore":
      return {
        ...base,
        kind: "featurestore",
        data: {
          ...defaultResourceData("featurestore", resourceContext),
          ...data,
        },
      };
    case "experiments":
      return {
        ...base,
        kind: "experiments",
        data: {
          ...defaultResourceData("experiments", resourceContext),
          ...data,
        },
      };
    case "training":
      return {
        ...base,
        kind: "training",
        data: {
          ...defaultResourceData("training", resourceContext),
          ...data,
        },
      };
    case "pipelines":
      return {
        ...base,
        kind: "pipelines",
        data: {
          ...defaultResourceData("pipelines", resourceContext),
          ...data,
        },
      };
    case "mlmonitoring":
      return {
        ...base,
        kind: "mlmonitoring",
        data: {
          ...defaultResourceData("mlmonitoring", resourceContext),
          ...data,
        },
      };
    case "zone":
      return {
        ...base,
        kind: "zone",
        data: { ...defaultResourceData("zone", resourceContext), ...data },
      };
    case "folder":
      return {
        ...base,
        kind: "folder",
        data: { ...defaultResourceData("folder", resourceContext), ...data },
      };
    case "project":
      return {
        ...base,
        kind: "project",
        data: { ...defaultResourceData("project", resourceContext), ...data },
      };
    case "entra":
      return {
        ...base,
        kind: "entra",
        data: { ...defaultResourceData("entra", resourceContext), ...data },
      };
    case "infocard":
      return {
        ...base,
        kind: "infocard",
        data: { ...defaultResourceData("infocard", resourceContext), ...data },
      };
    case "pcuser":
      return {
        ...base,
        kind: "pcuser",
        data: { ...defaultResourceData("pcuser", resourceContext), ...data },
      };
    case "onprem":
      return {
        ...base,
        kind: "onprem",
        data: { ...defaultResourceData("onprem", resourceContext), ...data },
      };
    case "github":
      return {
        ...base,
        kind: "github",
        data: { ...defaultResourceData("github", resourceContext), ...data },
      };
    case "loadbalancer":
      return {
        ...base,
        kind: "loadbalancer",
        data: {
          ...defaultResourceData("loadbalancer", resourceContext),
          ...data,
        },
      };
    case "cdn":
      return {
        ...base,
        kind: "cdn",
        data: {
          ...defaultResourceData("cdn", resourceContext),
          ...data,
        },
      };
    case "orgpolicy":
      return {
        ...base,
        kind: "orgpolicy",
        data: { ...defaultResourceData("orgpolicy", resourceContext), ...data },
      };
    case "psc":
      return {
        ...base,
        kind: "psc",
        data: { ...defaultResourceData("psc", resourceContext), ...data },
      };
    case "secretmanager":
      return {
        ...base,
        kind: "secretmanager",
        data: {
          ...defaultResourceData("secretmanager", resourceContext),
          ...data,
        },
      };
    case "certificatemanager":
      return {
        ...base,
        kind: "certificatemanager",
        data: {
          ...defaultResourceData("certificatemanager", resourceContext),
          ...data,
        },
      };
    case "apigee":
      return {
        ...base,
        kind: "apigee",
        data: {
          ...defaultResourceData("apigee", resourceContext),
          ...data,
        },
      };
    case "memorystore":
      return {
        ...base,
        kind: "memorystore",
        data: {
          ...defaultResourceData("memorystore", resourceContext),
          ...data,
        },
      };
    case "alloydb":
      return {
        ...base,
        kind: "alloydb",
        data: {
          ...defaultResourceData("alloydb", resourceContext),
          ...data,
        },
      };
    case "cloudshell":
      return {
        ...base,
        kind: "cloudshell",
        data: {
          ...defaultResourceData("cloudshell", resourceContext),
          ...data,
        },
      };
    case "monitoring":
      return {
        ...base,
        kind: "monitoring",
        data: {
          ...defaultResourceData("monitoring", resourceContext),
          ...data,
        },
      };
    case "cloudlogging":
      return {
        ...base,
        kind: "cloudlogging",
        data: {
          ...defaultResourceData("cloudlogging", resourceContext),
          ...data,
        },
      };
    case "cloudarmor":
      return {
        ...base,
        kind: "cloudarmor",
        data: {
          ...defaultResourceData("cloudarmor", resourceContext),
          ...data,
        },
      };
    case "knowledgecatalog":
      return {
        ...base,
        kind: "knowledgecatalog",
        data: {
          ...defaultResourceData("knowledgecatalog", resourceContext),
          ...data,
        },
      };
    case "usergroup":
      return {
        ...base,
        kind: "usergroup",
        data: {
          ...defaultResourceData("usergroup", resourceContext),
          ...data,
        },
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
    | Partial<RouterProps>
    | Partial<PeeringProps>
    | Partial<VpnProps>
    | Partial<InterconnectProps>
    | Partial<ArtifactProps>
    | Partial<BuildProps>
    | Partial<KmsProps>
    | Partial<InternetProps>
    | Partial<RunProps>
    | Partial<PubsubProps>
    | Partial<EventarcProps>
    | Partial<BigqueryProps>
    | Partial<SpannerProps>
    | Partial<FirestoreProps>
    | Partial<BigtableProps>
    | Partial<FirebaseProps>
    | Partial<WorkbenchProps>
    | Partial<NotebookProps>
    | Partial<SparkProps>
    | Partial<AirflowProps>
    | Partial<DataflowProps>
    | Partial<ModelRegistryProps>
    | Partial<TuningProps>
    | Partial<EvaluationProps>
    | Partial<EndpointsProps>
    | Partial<BatchInferenceProps>
    | Partial<FeatureStoreProps>
    | Partial<ExperimentsProps>
    | Partial<TrainingProps>
    | Partial<PipelinesProps>
    | Partial<MlMonitoringProps>
    | Partial<ZoneProps>
    | Partial<FolderProps>
    | Partial<EntraProps>
    | Partial<InfocardProps>
    | Partial<PcUserProps>
    | Partial<OnpremProps>
    | Partial<GithubProps>
    | Partial<LoadBalancerProps>
    | Partial<OrgPolicyProps>
    | Partial<PscProps>
    | Partial<SecretManagerProps>
    | Partial<CertificateManagerProps>
    | Partial<ApigeeProps>
    | Partial<MemorystoreProps>
    | Partial<AlloydbProps>
    | Partial<CloudShellProps>
    | Partial<MonitoringProps>
    | Partial<CloudLoggingProps>
    | Partial<CloudArmorProps>
    | Partial<KnowledgeCatalogProps>
    | Partial<UserGroupProps>
    | Partial<IamProps>,
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
    case "router":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<RouterProps>) },
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
    case "interconnect":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<InterconnectProps>) },
      };
    case "firewall":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FirewallProps>) },
      };
    case "dns":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<DnsProps>) },
      };
    case "artifact":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ArtifactProps>) },
      };
    case "build":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<BuildProps>) },
      };
    case "kms":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<KmsProps>) },
      };
    case "iam":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<IamProps>) },
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
    case "eventarc":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<EventarcProps>) },
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
    case "firestore":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FirestoreProps>) },
      };
    case "bigtable":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<BigtableProps>) },
      };
    case "firebase":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FirebaseProps>) },
      };
    case "workbench":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<WorkbenchProps>) },
      };
    case "notebook":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<NotebookProps>) },
      };
    case "spark":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<SparkProps>) },
      };
    case "airflow":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<AirflowProps>) },
      };
    case "dataflow":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<DataflowProps>) },
      };
    case "modelregistry":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ModelRegistryProps>) },
      };
    case "tuning":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<TuningProps>) },
      };
    case "evaluation":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<EvaluationProps>) },
      };
    case "endpoints":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<EndpointsProps>) },
      };
    case "batchinference":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<BatchInferenceProps>) },
      };
    case "featurestore":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FeatureStoreProps>) },
      };
    case "experiments":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ExperimentsProps>) },
      };
    case "training":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<TrainingProps>) },
      };
    case "pipelines":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<PipelinesProps>) },
      };
    case "mlmonitoring":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<MlMonitoringProps>) },
      };
    case "zone":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ZoneProps>) },
      };
    case "folder":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<FolderProps>) },
      };
    case "project":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ProjectProps>) },
      };
    case "entra":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<EntraProps>) },
      };
    case "infocard":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<InfocardProps>) },
      };
    case "pcuser":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<PcUserProps>) },
      };
    case "onprem":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<OnpremProps>) },
      };
    case "github":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<GithubProps>) },
      };
    case "loadbalancer":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<LoadBalancerProps>) },
      };
    case "cdn":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<CdnProps>) },
      };
    case "orgpolicy":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<OrgPolicyProps>) },
      };
    case "psc":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<PscProps>) },
      };
    case "secretmanager":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<SecretManagerProps>) },
      };
    case "certificatemanager":
      return {
        ...node,
        data: {
          ...node.data,
          ...(patch as Partial<CertificateManagerProps>),
        },
      };
    case "apigee":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<ApigeeProps>) },
      };
    case "memorystore":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<MemorystoreProps>) },
      };
    case "alloydb":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<AlloydbProps>) },
      };
    case "cloudshell":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<CloudShellProps>) },
      };
    case "monitoring":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<MonitoringProps>) },
      };
    case "cloudlogging":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<CloudLoggingProps>) },
      };
    case "cloudarmor":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<CloudArmorProps>) },
      };
    case "knowledgecatalog":
      return {
        ...node,
        data: {
          ...node.data,
          ...(patch as Partial<KnowledgeCatalogProps>),
        },
      };
    case "usergroup":
      return {
        ...node,
        data: { ...node.data, ...(patch as Partial<UserGroupProps>) },
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
  next = reassignSubnetNotebookIps(subnetId, next, edges);
  next = reassignSubnetPscIps(subnetId, next, edges);
  next = reassignSubnetMemorystoreIps(subnetId, next, edges);
  next = reassignSubnetAlloydbIps(subnetId, next, edges);
  return next;
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  ...initialState,

  addNode: (kind, position, data) => {
    pushHistorySnapshot(get, set);
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
    pushHistorySnapshot(get, set);
    set((state) => ({
      nodes: bringNodeToFront(state.nodes, id),
    }));
  },

  sendNodeToBack: (id) => {
    pushHistorySnapshot(get, set);
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
    pushPropertyEditHistory(get, set);
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
    pushPropertyEditHistory(get, set);
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
    pushHistorySnapshot(get, set);
    set((state) => {
      const affectedSubnetIds = new Set<string>();
      for (const edge of state.edges) {
        if (
          (edge.kind === "vm-subnet" ||
            edge.kind === "sql-subnet" ||
            edge.kind === "gke-subnet" ||
            edge.kind === "run-subnet" ||
            edge.kind === "workbench-subnet" ||
            edge.kind === "notebook-subnet" ||
            edge.kind === "psc-subnet" ||
            edge.kind === "memorystore-subnet" ||
            edge.kind === "alloydb-subnet") &&
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
    pushHistorySnapshot(get, set);
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
        next.kind === "workbench-subnet" ||
        next.kind === "notebook-subnet" ||
        next.kind === "psc-subnet" ||
        next.kind === "memorystore-subnet" ||
        next.kind === "alloydb-subnet" ||
        next.kind === "spark-subnet" ||
        next.kind === "airflow-subnet" ||
        next.kind === "dataflow-subnet"
      ) {
        if (next.kind === "vm-subnet") {
          nodes = assignIpToVm(next.source, next.target, nodes, edges);
        }
        if (next.kind === "spark-subnet") {
          nodes = assignSparkSubnetRegion(next.source, next.target, nodes);
        }
        if (next.kind === "airflow-subnet") {
          nodes = assignAirflowSubnetRegion(next.source, next.target, nodes);
        }
        if (next.kind === "dataflow-subnet") {
          nodes = assignDataflowSubnetRegion(next.source, next.target, nodes);
        }
        if (
          next.kind !== "spark-subnet" &&
          next.kind !== "airflow-subnet" &&
          next.kind !== "dataflow-subnet"
        ) {
          nodes = reassignSubnetHostIps(next.target, nodes, edges);
        }
      }

      return { edges, nodes };
    });
  },

  removeEdge: (id) => {
    pushHistorySnapshot(get, set);
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

      if (removed?.kind === "notebook-subnet") {
        nodes = clearNotebookNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "psc-subnet") {
        nodes = clearPscNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "memorystore-subnet") {
        nodes = clearMemorystoreNetwork(removed.source, nodes);
        nodes = reassignSubnetHostIps(removed.target, nodes, edges);
      }

      if (removed?.kind === "alloydb-subnet") {
        nodes = clearAlloydbNetwork(removed.source, nodes);
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

  updateEdgeLineStyle: (id, lineStyle) => {
    pushPropertyEditHistory(get, set);
    set((state) => ({
      edges: state.edges.map((edge) => {
        if (edge.id !== id) return edge;
        if (lineStyle === "solid") {
          const { lineStyle: _removed, ...rest } = edge;
          return rest;
        }
        return { ...edge, lineStyle: "dashed" };
      }),
    }));
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
      ...clearHistoryState(),
    });
  },

  reset: () => set({ ...initialState, ...clearHistoryState() }),

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const current = cloneDiagramSnapshot(nodes, edges);

    setApplyingHistory(true);
    set({
      nodes: structuredClone(previous.nodes),
      edges: structuredClone(previous.edges),
      past: past.slice(0, -1),
      future: [current, ...future],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    resetPropertyEditHistoryArm();
    setApplyingHistory(false);
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const current = cloneDiagramSnapshot(nodes, edges);

    setApplyingHistory(true);
    set({
      nodes: structuredClone(next.nodes),
      edges: structuredClone(next.edges),
      past: [...past, current],
      future: future.slice(1),
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    resetPropertyEditHistoryArm();
    setApplyingHistory(false);
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  beginHistoryTransaction: () => {
    const depth = get().historyTransactionDepth;
    if (depth === 0) {
      pushHistorySnapshot(get, set);
    }
    set({ historyTransactionDepth: depth + 1 });
  },

  endHistoryTransaction: () => {
    set({
      historyTransactionDepth: Math.max(0, get().historyTransactionDepth - 1),
    });
  },

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
