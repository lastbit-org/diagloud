import { suggestSubnetCidr } from "./cidr";
import { DEFAULT_WORKBENCH_MACHINE_TYPE } from "./workbenchMachineTypes";
import { generateResourceName } from "./naming";
import { getNamingConfig } from "../store/namingStore";
import type {
  DiagramNode,
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
  FirestoreProps,
  WorkbenchProps,
  ZoneProps,
} from "../types";

export function defaultResourceData<K extends ResourceKind>(
  kind: K,
  context?: { existingSubnetCidrs?: string[]; nodes?: DiagramNode[] },
): ResourcePropsByKind[K] {
  const nodes = context?.nodes ?? [];
  const naming = getNamingConfig();
  const name = naming.isActive
    ? generateResourceName(
        kind,
        naming.patterns,
        { area: naming.area, ambiente: naming.ambiente },
        nodes,
      )
    : legacyDefaultName(kind, nodes);

  switch (kind) {
    case "vpc":
      return { name } as VpcProps as ResourcePropsByKind[K];
    case "subnet":
      return {
        name,
        region: "southamerica-east1",
        cidr: suggestSubnetCidr(context?.existingSubnetCidrs ?? []),
      } as SubnetProps as ResourcePropsByKind[K];
    case "vm":
      return {
        name,
        machineType: "e2-micro",
      } as VmProps as ResourcePropsByKind[K];
    case "storage":
      return {
        name,
        location: "southamerica-east1",
        storageClass: "STANDARD",
        accessMode: "public",
      } as StorageProps as ResourcePropsByKind[K];
    case "sql":
      return {
        name,
        region: "southamerica-east1",
        engine: "POSTGRES_15",
        accessMode: "public",
      } as SqlProps as ResourcePropsByKind[K];
    case "gke":
      return {
        name,
        nodeCount: 3,
        machineType: "e2-medium",
      } as GkeProps as ResourcePropsByKind[K];
    case "nat":
      return {
        name,
        region: "southamerica-east1",
      } as NatProps as ResourcePropsByKind[K];
    case "peering":
      return {
        name,
      } as PeeringProps as ResourcePropsByKind[K];
    case "vpn":
      return {
        name,
        region: "southamerica-east1",
      } as VpnProps as ResourcePropsByKind[K];
    case "firewall":
      return {
        name,
        direction: "ingress",
      } as FirewallProps as ResourcePropsByKind[K];
    case "artifact":
      return {
        name,
        location: "southamerica-east1",
        format: "DOCKER",
      } as ArtifactProps as ResourcePropsByKind[K];
    case "internet":
      return {
        name: name || "Internet",
      } as InternetProps as ResourcePropsByKind[K];
    case "run":
      return {
        name,
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "public",
      } as RunProps as ResourcePropsByKind[K];
    case "pubsub":
      return {
        name,
      } as PubsubProps as ResourcePropsByKind[K];
    case "bigquery":
      return {
        name,
        location: "southamerica-east1",
      } as BigqueryProps as ResourcePropsByKind[K];
    case "spanner":
      return {
        name,
        config: "regional-southamerica-east1",
      } as SpannerProps as ResourcePropsByKind[K];
    case "firestore":
      return {
        name,
        location: "southamerica-east1",
      } as FirestoreProps as ResourcePropsByKind[K];
    case "workbench":
      return {
        name,
        region: "southamerica-east1",
        machineType: DEFAULT_WORKBENCH_MACHINE_TYPE,
      } as WorkbenchProps as ResourcePropsByKind[K];
    case "zone":
      return {
        name,
        purpose: "project",
        colorId: "slate",
        width: 320,
        height: 200,
      } as ZoneProps as ResourcePropsByKind[K];
  }
}

function legacyDefaultName(kind: ResourceKind, nodes: DiagramNode[]): string {
  const count = nodes.filter((n) => n.kind === kind).length + 1;
  switch (kind) {
    case "vpc":
      return `vpc-${count}`;
    case "subnet":
      return `subnet-${count}`;
    case "vm":
      return `vm-${count}`;
    case "storage":
      return `bucket-${count}`;
    case "sql":
      return `sql-${count}`;
    case "gke":
      return `gke-${count}`;
    case "nat":
      return `nat-${count}`;
    case "peering":
      return `peer-${count}`;
    case "vpn":
      return `vpn-${count}`;
    case "firewall":
      return `fw-${count}`;
    case "artifact":
      return `gar-${count}`;
    case "internet":
      return "Internet";
    case "run":
      return `run-${count}`;
    case "pubsub":
      return `topic-${count}`;
    case "bigquery":
      return `bq-${count}`;
    case "spanner":
      return `spanner-${count}`;
    case "firestore":
      return `fs-${count}`;
    case "workbench":
      return `wb-${count}`;
    case "zone":
      return `zona-${count}`;
  }
}
