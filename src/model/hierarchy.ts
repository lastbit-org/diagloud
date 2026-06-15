import { canonicalizeEdgeEndpoints } from "./connections";
import type { DiagramDocument, DiagramEdge } from "../types";

const KMS_EDGE_KINDS = [
  "vm-kms",
  "gke-kms",
  "run-kms",
  "storage-kms",
  "sql-kms",
  "bigquery-kms",
  "firestore-kms",
  "spanner-kms",
  "bigtable-kms",
  "spark-kms",
  "airflow-kms",
  "dataflow-kms",
  "modelregistry-kms",
  "secretmanager-kms",
  "iam-kms",
] as const;

export type ResolvedGraph = {
  vpcForSubnet: Map<string, string>;
  subnetForVm: Map<string, string>;
  vpcForNat: Map<string, string>;
  vpcForRouter: Map<string, string>;
  vpcForFirewall: Map<string, string>;
  vpcForDns: Map<string, string[]>;
  vpcForVpn: Map<string, string>;
  vpcForInterconnect: Map<string, string>;
  vpcForPeering: Map<string, string[]>;
  vpcForLoadBalancer: Map<string, string>;
  storageForCdn: Map<string, string>;
  loadBalancerForCdn: Map<string, string>;
  subnetForPsc: Map<string, string>;
  subnetForGke: Map<string, string>;
  subnetForRun: Map<string, string>;
  subnetForSql: Map<string, string>;
  subnetForWorkbench: Map<string, string>;
  subnetForNotebook: Map<string, string>;
  subnetForSpark: Map<string, string>;
  subnetForAirflow: Map<string, string>;
  subnetForDataflow: Map<string, string>;
  natForSubnet: Map<string, string>;
  kmsForNode: Map<string, string>;
  parentFolderForFolder: Map<string, string>;
  parentFolderForProject: Map<string, string>;
};

function isKmsEdgeKind(
  kind: DiagramEdge["kind"],
): kind is (typeof KMS_EDGE_KINDS)[number] {
  return (KMS_EDGE_KINDS as readonly string[]).includes(kind);
}

function applyEdge(
  graph: ResolvedGraph,
  edge: DiagramEdge,
  source: string,
  target: string,
): void {
  switch (edge.kind) {
    case "subnet-vpc":
      graph.vpcForSubnet.set(source, target);
      break;
    case "vm-subnet":
      graph.subnetForVm.set(source, target);
      break;
    case "nat-vpc":
      graph.vpcForNat.set(source, target);
      break;
    case "router-vpc":
      graph.vpcForRouter.set(source, target);
      break;
    case "firewall-vpc":
      graph.vpcForFirewall.set(source, target);
      break;
    case "dns-vpc": {
      const list = graph.vpcForDns.get(source) ?? [];
      list.push(target);
      graph.vpcForDns.set(source, list);
      break;
    }
    case "vpn-vpc":
      graph.vpcForVpn.set(source, target);
      break;
    case "interconnect-vpc":
      graph.vpcForInterconnect.set(source, target);
      break;
    case "peering-vpc": {
      const list = graph.vpcForPeering.get(source) ?? [];
      list.push(target);
      graph.vpcForPeering.set(source, list);
      break;
    }
    case "loadbalancer-vpc":
      graph.vpcForLoadBalancer.set(source, target);
      break;
    case "cdn-storage":
      graph.storageForCdn.set(source, target);
      break;
    case "cdn-loadbalancer":
      graph.loadBalancerForCdn.set(source, target);
      break;
    case "psc-subnet":
      graph.subnetForPsc.set(source, target);
      break;
    case "gke-subnet":
      graph.subnetForGke.set(source, target);
      break;
    case "run-subnet":
      graph.subnetForRun.set(source, target);
      break;
    case "sql-subnet":
      graph.subnetForSql.set(source, target);
      break;
    case "workbench-subnet":
      graph.subnetForWorkbench.set(source, target);
      break;
    case "notebook-subnet":
      graph.subnetForNotebook.set(source, target);
      break;
    case "spark-subnet":
      graph.subnetForSpark.set(source, target);
      break;
    case "airflow-subnet":
      graph.subnetForAirflow.set(source, target);
      break;
    case "dataflow-subnet":
      graph.subnetForDataflow.set(source, target);
      break;
    case "subnet-nat":
      graph.natForSubnet.set(source, target);
      break;
    case "folder-folder":
      graph.parentFolderForFolder.set(source, target);
      break;
    case "folder-project":
      graph.parentFolderForProject.set(source, target);
      break;
    default:
      if (isKmsEdgeKind(edge.kind)) {
        graph.kmsForNode.set(source, target);
      }
      break;
  }
}

export function resolveGraph(document: DiagramDocument): ResolvedGraph {
  const graph: ResolvedGraph = {
    vpcForSubnet: new Map(),
    subnetForVm: new Map(),
    vpcForNat: new Map(),
    vpcForRouter: new Map(),
    vpcForFirewall: new Map(),
    vpcForDns: new Map(),
    vpcForVpn: new Map(),
    vpcForInterconnect: new Map(),
    vpcForPeering: new Map(),
    vpcForLoadBalancer: new Map(),
    storageForCdn: new Map(),
    loadBalancerForCdn: new Map(),
    subnetForPsc: new Map(),
    subnetForGke: new Map(),
    subnetForRun: new Map(),
    subnetForSql: new Map(),
    subnetForWorkbench: new Map(),
    subnetForNotebook: new Map(),
    subnetForSpark: new Map(),
    subnetForAirflow: new Map(),
    subnetForDataflow: new Map(),
    natForSubnet: new Map(),
    kmsForNode: new Map(),
    parentFolderForFolder: new Map(),
    parentFolderForProject: new Map(),
  };

  for (const edge of document.edges) {
    const { source, target } = canonicalizeEdgeEndpoints(
      edge,
      document.nodes,
    );
    applyEdge(graph, edge, source, target);
  }

  return graph;
}
