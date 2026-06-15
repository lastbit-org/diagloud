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
  RouterProps,
  NatProps,
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
  ZoneProps,
  FolderProps,
  ProjectProps,
  EntraProps,
  InfocardProps,
  PcUserProps,
  OnpremProps,
  IamProps,
  GithubProps,
  LoadBalancerProps,
  CdnProps,
  OrgPolicyProps,
  PscProps,
  SecretManagerProps,
  CertificateManagerProps,
  ApigeeProps,
  CloudShellProps,
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
    case "router":
      return {
        name,
        region: "southamerica-east1",
      } as RouterProps as ResourcePropsByKind[K];
    case "peering":
      return {
        name,
      } as PeeringProps as ResourcePropsByKind[K];
    case "vpn":
      return {
        name,
        region: "southamerica-east1",
      } as VpnProps as ResourcePropsByKind[K];
    case "interconnect":
      return {
        name,
        region: "southamerica-east1",
      } as InterconnectProps as ResourcePropsByKind[K];
    case "firewall":
      return {
        name,
        direction: "ingress",
      } as FirewallProps as ResourcePropsByKind[K];
    case "dns":
      return {
        name,
        dnsName: "example.com.",
        visibility: "private",
      } as DnsProps as ResourcePropsByKind[K];
    case "artifact":
      return {
        name,
        location: "southamerica-east1",
        format: "DOCKER",
      } as ArtifactProps as ResourcePropsByKind[K];
    case "build":
      return {
        name,
        location: "southamerica-east1",
      } as BuildProps as ResourcePropsByKind[K];
    case "kms":
      return {
        name,
        location: "southamerica-east1",
      } as KmsProps as ResourcePropsByKind[K];
    case "iam":
      return {
        name,
        variant: "iam",
        serviceAccountEmail: "sa-app@projeto.iam.gserviceaccount.com",
        workloadPoolId: "pool-external",
        workloadProviderId: "provider-github",
        groupEmail: "eng-platform@example.com",
        roles: [],
      } as IamProps as ResourcePropsByKind[K];
    case "internet":
      return {
        name: name || "Internet",
      } as InternetProps as ResourcePropsByKind[K];
    case "run":
      return {
        name,
        imageUrl: "",
        cpu: "1",
        memory: "512Mi",
        minInstances: 0,
        accessMode: "public",
      } as RunProps as ResourcePropsByKind[K];
    case "pubsub":
      return {
        name,
      } as PubsubProps as ResourcePropsByKind[K];
    case "eventarc":
      return {
        name,
        location: "southamerica-east1",
      } as EventarcProps as ResourcePropsByKind[K];
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
    case "bigtable":
      return {
        name,
        location: "southamerica-east1",
      } as BigtableProps as ResourcePropsByKind[K];
    case "firebase":
      return {
        name,
        projectId: "meu-app-firebase",
      } as FirebaseProps as ResourcePropsByKind[K];
    case "workbench":
      return {
        name,
        region: "southamerica-east1",
        machineType: DEFAULT_WORKBENCH_MACHINE_TYPE,
      } as WorkbenchProps as ResourcePropsByKind[K];
    case "notebook":
      return {
        name,
        region: "southamerica-east1",
        machineType: DEFAULT_WORKBENCH_MACHINE_TYPE,
      } as NotebookProps as ResourcePropsByKind[K];
    case "spark":
      return {
        name,
        region: "southamerica-east1",
        deployMode: "serverless",
      } as SparkProps as ResourcePropsByKind[K];
    case "airflow":
      return {
        name,
        region: "southamerica-east1",
      } as AirflowProps as ResourcePropsByKind[K];
    case "dataflow":
      return {
        name,
        region: "southamerica-east1",
        pipelineType: "batch",
      } as DataflowProps as ResourcePropsByKind[K];
    case "modelregistry":
      return {
        name,
        location: "southamerica-east1",
      } as ModelRegistryProps as ResourcePropsByKind[K];
    case "zone":
      return {
        name,
        colorId: "slate",
        borderWidth: "normal",
        borderStyle: "solid",
        width: 320,
        height: 200,
      } as ZoneProps as ResourcePropsByKind[K];
    case "folder":
      return { name } as FolderProps as ResourcePropsByKind[K];
    case "project":
      return { name } as ProjectProps as ResourcePropsByKind[K];
    case "entra":
      return { name } as EntraProps as ResourcePropsByKind[K];
    case "infocard":
      return {
        caption: "Legenda",
        title: name,
      } as InfocardProps as ResourcePropsByKind[K];
    case "pcuser":
      return { name } as PcUserProps as ResourcePropsByKind[K];
    case "onprem":
      return {
        name,
        location: "Datacenter local",
      } as OnpremProps as ResourcePropsByKind[K];
    case "github":
      return {
        name,
        repository: "org/repository",
      } as GithubProps as ResourcePropsByKind[K];
    case "loadbalancer":
      return {
        name,
        type: "external",
        region: "southamerica-east1",
      } as LoadBalancerProps as ResourcePropsByKind[K];
    case "cdn":
      return {
        name,
        region: "southamerica-east1",
        originType: "storage",
      } as CdnProps as ResourcePropsByKind[K];
    case "orgpolicy":
      return {
        name,
        constraintId: "constraints/compute.disableSerialPortAccess",
      } as OrgPolicyProps as ResourcePropsByKind[K];
    case "psc":
      return {
        name,
        region: "southamerica-east1",
      } as PscProps as ResourcePropsByKind[K];
    case "secretmanager":
      return {
        name,
        location: "southamerica-east1",
      } as SecretManagerProps as ResourcePropsByKind[K];
    case "certificatemanager":
      return {
        name,
        location: "global",
        certificateType: "managed",
      } as CertificateManagerProps as ResourcePropsByKind[K];
    case "apigee":
      return {
        name,
        region: "southamerica-east1",
        envType: "x",
      } as ApigeeProps as ResourcePropsByKind[K];
    case "cloudshell":
      return { name } as CloudShellProps as ResourcePropsByKind[K];
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
    case "router":
      return `router-${count}`;
    case "peering":
      return `peer-${count}`;
    case "vpn":
      return `vpn-${count}`;
    case "interconnect":
      return `ic-${count}`;
    case "firewall":
      return `fw-${count}`;
    case "dns":
      return `dns-${count}`;
    case "artifact":
      return `gar-${count}`;
    case "build":
      return `cb-${count}`;
    case "kms":
      return `kms-${count}`;
    case "iam":
      return `iam-${count}`;
    case "internet":
      return "Internet";
    case "run":
      return `run-${count}`;
    case "pubsub":
      return `topic-${count}`;
    case "eventarc":
      return `ea-${count}`;
    case "bigquery":
      return `bq-${count}`;
    case "spanner":
      return `spanner-${count}`;
    case "firestore":
      return `fs-${count}`;
    case "bigtable":
      return `bt-${count}`;
    case "firebase":
      return `firebase-${count}`;
    case "workbench":
      return `wb-${count}`;
    case "notebook":
      return `nb-${count}`;
    case "spark":
      return `spark-${count}`;
    case "airflow":
      return `composer-${count}`;
    case "dataflow":
      return `dataflow-${count}`;
    case "modelregistry":
      return `mr-${count}`;
    case "zone":
      return `zona-${count}`;
    case "folder":
      return `folder-${count}`;
    case "project":
      return `proj-${count}`;
    case "entra":
      return `entra-${count}`;
    case "infocard":
      return `info-${count}`;
    case "pcuser":
      return `usuario-${count}`;
    case "onprem":
      return `onprem-${count}`;
    case "github":
      return `github-${count}`;
    case "loadbalancer":
      return `lb-${count}`;
    case "cdn":
      return `cdn-${count}`;
    case "orgpolicy":
      return `orgpol-${count}`;
    case "psc":
      return `psc-${count}`;
    case "secretmanager":
      return `secret-${count}`;
    case "certificatemanager":
      return `cert-${count}`;
    case "apigee":
      return `apigee-${count}`;
    case "cloudshell":
      return `cloudshell-${count}`;
  }
}
