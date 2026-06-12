import { assignDefaultZIndices, MISSING_Z_INDEX } from "./nodeLayers";
import { isZoneColorId } from "./zoneColors";
import { isZoneBorderStyle, isZoneBorderWidth } from "./zoneBorder";
import { resolveEdgeHandles } from "./dynamicHandles";
import { validateConnection } from "../model/connections";
import { migrateSqlVpcEdge } from "../model/sqlSubnet";
import {
  isValidDiagramId,
  nodeIdMatchesKind,
} from "./id";
import { DEFAULT_NAMING_PATTERNS } from "../types/naming";
import {
  DIAGRAM_DOCUMENT_VERSION,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramMetadata,
  type DiagramNamingMetadata,
  type DiagramNode,
  type LegacyDiagramDocument,
  type GkeProps,
  type SqlProps,
  type StorageProps,
  type SubnetProps,
  type VmProps,
  type VpcProps,
  type NatProps,
  type RouterProps,
  type PeeringProps,
  type VpnProps,
  type InterconnectProps,
  type FirewallProps,
  type DnsProps,
  type ArtifactProps,
  type BuildProps,
  type KmsProps,
  type IamProps,
  type IamVariant,
  type InternetProps,
  type RunProps,
  type PubsubProps,
  type EventarcProps,
  type BigqueryProps,
  type SpannerProps,
  type FirestoreProps,
  type BigtableProps,
  type FirebaseProps,
  type WorkbenchProps,
  type NotebookProps,
  type SparkProps,
  type AirflowProps,
  type DataflowProps,
  type ModelRegistryProps,
  type ZoneProps,
  type FolderProps,
  type ProjectProps,
  type EntraProps,
  type InfocardProps,
  type PcUserProps,
  type OnpremProps,
  type GithubProps,
  type LoadBalancerProps,
  type LoadBalancerType,
  type OrgPolicyProps,
  type PscProps,
  type SecretManagerProps,
} from "../types";

export const DIAGRAM_STORAGE_KEY = "diagloud-diagram";

export class DiagramParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagramParseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePosition(raw: unknown): { x: number; y: number } {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó com posição inválida.");
  }
  const { x, y } = raw;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
    throw new DiagramParseError("Nó com posição inválida.");
  }
  return { x, y };
}

function parseVpcData(raw: unknown): VpcProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de VPC inválidos.");
  }
  return { name: raw.name };
}

function parseSubnetData(raw: unknown): SubnetProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.cidr !== "string"
  ) {
    throw new DiagramParseError("Dados de sub-rede inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
    cidr: raw.cidr,
  };
}

function parseVmData(raw: unknown): VmProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.machineType !== "string"
  ) {
    throw new DiagramParseError("Dados de VM inválidos.");
  }
  const data: VmProps = {
    name: raw.name,
    machineType: raw.machineType,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

const STORAGE_CLASSES = new Set([
  "STANDARD",
  "NEARLINE",
  "COLDLINE",
  "ARCHIVE",
]);

function parseStorageData(raw: unknown): StorageProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string" ||
    typeof raw.storageClass !== "string" ||
    !STORAGE_CLASSES.has(raw.storageClass)
  ) {
    throw new DiagramParseError("Dados de Cloud Storage inválidos.");
  }
  const accessMode =
    raw.accessMode === "vm" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";

  return {
    name: raw.name,
    location: raw.location,
    storageClass: raw.storageClass as StorageProps["storageClass"],
    accessMode,
  };
}

const SQL_ENGINES = new Set(["MYSQL_8_0", "POSTGRES_15"]);

function parseSqlData(raw: unknown): SqlProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.engine !== "string" ||
    !SQL_ENGINES.has(raw.engine)
  ) {
    throw new DiagramParseError("Dados de Cloud SQL inválidos.");
  }
  const accessMode =
    raw.accessMode === "private" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";
  const data: SqlProps = {
    name: raw.name,
    region: raw.region,
    engine: raw.engine as SqlProps["engine"],
    accessMode,
  };
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parseGkeData(raw: unknown): GkeProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.machineType !== "string" ||
    typeof raw.nodeCount !== "number" ||
    !Number.isInteger(raw.nodeCount) ||
    raw.nodeCount < 1
  ) {
    throw new DiagramParseError("Dados de GKE inválidos.");
  }
  const data: GkeProps = {
    name: raw.name,
    nodeCount: raw.nodeCount,
    machineType: raw.machineType,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parseNatData(raw: unknown): NatProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud NAT inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

function parseRouterData(raw: unknown): RouterProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud Router inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

const ARTIFACT_FORMATS = new Set(["DOCKER", "MAVEN", "NPM"]);

function parseArtifactData(raw: unknown): ArtifactProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string" ||
    typeof raw.format !== "string" ||
    !ARTIFACT_FORMATS.has(raw.format)
  ) {
    throw new DiagramParseError("Dados de Artifact Registry inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
    format: raw.format as ArtifactProps["format"],
  };
}

function parseBuildData(raw: unknown): BuildProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud Build inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseKmsData(raw: unknown): KmsProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud KMS inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseIamVariant(raw: unknown): IamVariant {
  if (raw === "workload_identity" || raw === "group" || raw === "iam") {
    return raw;
  }
  return "iam";
}

function parseIamRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((role): role is string => typeof role === "string")
      .map((role) => role.trim())
      .filter(Boolean);
  }
  return [];
}

function parseIamData(raw: unknown): IamProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de IAM inválidos.");
  }
  return {
    name: raw.name,
    variant: parseIamVariant(raw.variant),
    serviceAccountEmail:
      typeof raw.serviceAccountEmail === "string"
        ? raw.serviceAccountEmail
        : "sa-app@projeto.iam.gserviceaccount.com",
    workloadPoolId:
      typeof raw.workloadPoolId === "string" ? raw.workloadPoolId : "pool-external",
    workloadProviderId:
      typeof raw.workloadProviderId === "string"
        ? raw.workloadProviderId
        : "provider-github",
    groupEmail:
      typeof raw.groupEmail === "string" ? raw.groupEmail : "eng-platform@example.com",
    roles: parseIamRoles(raw.roles),
  };
}

function parsePeeringData(raw: unknown): PeeringProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de VPC Peering inválidos.");
  }
  return { name: raw.name };
}

function parseFirewallData(raw: unknown): FirewallProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Firewall inválidos.");
  }
  return {
    name: raw.name,
    direction: raw.direction === "egress" ? "egress" : "ingress",
  };
}

function parseDnsData(raw: unknown): DnsProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.dnsName !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud DNS inválidos.");
  }
  return {
    name: raw.name,
    dnsName: raw.dnsName,
    visibility: raw.visibility === "public" ? "public" : "private",
  };
}

function parseVpnData(raw: unknown): VpnProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud VPN inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

function parseInterconnectData(raw: unknown): InterconnectProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud Interconnect inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

function parseInternetData(raw: unknown): InternetProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Internet inválidos.");
  }
  return { name: raw.name };
}

function parseRunData(raw: unknown): RunProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.cpu !== "string" ||
    typeof raw.memory !== "string" ||
    typeof raw.minInstances !== "number" ||
    !Number.isInteger(raw.minInstances) ||
    raw.minInstances < 0
  ) {
    throw new DiagramParseError("Dados de Cloud Run inválidos.");
  }
  const accessMode =
    raw.accessMode === "vpc" || raw.accessMode === "public"
      ? raw.accessMode
      : "public";
  const data: RunProps = {
    name: raw.name,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    cpu: raw.cpu,
    memory: raw.memory,
    minInstances: raw.minInstances,
    accessMode,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
  }
  if (typeof raw.internalIp === "string") {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parsePubsubData(raw: unknown): PubsubProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Pub/Sub inválidos.");
  }
  return { name: raw.name };
}

function parseEventarcData(raw: unknown): EventarcProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Eventarc inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseBigqueryData(raw: unknown): BigqueryProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de BigQuery inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseSpannerData(raw: unknown): SpannerProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.config !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud Spanner inválidos.");
  }
  return {
    name: raw.name,
    config: raw.config,
  };
}

function parseFirestoreData(raw: unknown): FirestoreProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Firestore inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseBigtableData(raw: unknown): BigtableProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Cloud Bigtable inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseFirebaseData(raw: unknown): FirebaseProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.projectId !== "string"
  ) {
    throw new DiagramParseError("Dados de Firebase inválidos.");
  }
  return {
    name: raw.name,
    projectId: raw.projectId,
  };
}

function parseWorkbenchData(raw: unknown): WorkbenchProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.machineType !== "string"
  ) {
    throw new DiagramParseError("Dados de Vertex AI Workbench inválidos.");
  }
  const data: WorkbenchProps = {
    name: raw.name,
    region: raw.region,
    machineType: raw.machineType,
  };
  if (typeof raw.internalIp === "string" && raw.internalIp) {
    data.internalIp = raw.internalIp;
  }
  return data;
}

function parseNotebookData(raw: unknown): NotebookProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.machineType !== "string"
  ) {
    throw new DiagramParseError("Dados de Notebook (Vertex AI) inválidos.");
  }
  const data: NotebookProps = {
    name: raw.name,
    region: raw.region,
    machineType: raw.machineType,
  };
  if (typeof raw.internalIp === "string" && raw.internalIp) {
    data.internalIp = raw.internalIp;
  }
  return data;
}

const SPARK_DEPLOY_MODES = new Set(["cluster", "serverless"]);

function parseSparkData(raw: unknown): SparkProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.deployMode !== "string" ||
    !SPARK_DEPLOY_MODES.has(raw.deployMode)
  ) {
    throw new DiagramParseError("Dados de Apache Spark inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
    deployMode: raw.deployMode as SparkProps["deployMode"],
  };
}

function parseModelRegistryData(raw: unknown): ModelRegistryProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Model Registry inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseAirflowData(raw: unknown): AirflowProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Managed Airflow inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
  };
}

const DATAFLOW_PIPELINE_TYPES = new Set(["batch", "streaming"]);

function parseDataflowData(raw: unknown): DataflowProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string" ||
    typeof raw.pipelineType !== "string" ||
    !DATAFLOW_PIPELINE_TYPES.has(raw.pipelineType)
  ) {
    throw new DiagramParseError("Dados de Cloud Dataflow inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
    pipelineType: raw.pipelineType as DataflowProps["pipelineType"],
  };
}

function parseFolderData(raw: unknown): FolderProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de pasta inválidos.");
  }
  return { name: raw.name };
}

function parseProjectData(raw: unknown): ProjectProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de projeto inválidos.");
  }
  return { name: raw.name };
}

function parseEntraData(raw: unknown): EntraProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Microsoft Entra ID inválidos.");
  }
  return { name: raw.name };
}

function parseInfocardData(raw: unknown): InfocardProps {
  if (
    !isRecord(raw) ||
    typeof raw.caption !== "string" ||
    typeof raw.title !== "string"
  ) {
    throw new DiagramParseError("Dados de identificação inválidos.");
  }
  return {
    caption: raw.caption,
    title: raw.title,
  };
}

function parsePcUserData(raw: unknown): PcUserProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de usuário inválidos.");
  }
  return { name: raw.name };
}

function parseOnpremData(raw: unknown): OnpremProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de on-premises inválidos.");
  }
  return {
    name: raw.name,
    location:
      typeof raw.location === "string" && raw.location
        ? raw.location
        : "Datacenter local",
  };
}

function parseGithubData(raw: unknown): GithubProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.repository !== "string"
  ) {
    throw new DiagramParseError("Dados de repositório GitHub inválidos.");
  }
  return {
    name: raw.name,
    repository: raw.repository,
  };
}

const LOAD_BALANCER_TYPES = new Set<LoadBalancerType>(["external", "internal"]);

function parseLoadBalancerData(raw: unknown): LoadBalancerProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud Load Balancing inválidos.");
  }
  const type =
    raw.type === "internal" || raw.type === "external"
      ? raw.type
      : "external";
  if (!LOAD_BALANCER_TYPES.has(type)) {
    throw new DiagramParseError("Dados de Cloud Load Balancing inválidos.");
  }
  return {
    name: raw.name,
    type,
    region:
      typeof raw.region === "string" && raw.region.trim()
        ? raw.region
        : "southamerica-east1",
  };
}

function parseOrgPolicyData(raw: unknown): OrgPolicyProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.constraintId !== "string"
  ) {
    throw new DiagramParseError("Dados de Organization Policy inválidos.");
  }
  return {
    name: raw.name,
    constraintId: raw.constraintId,
  };
}

function parsePscData(raw: unknown): PscProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.region !== "string"
  ) {
    throw new DiagramParseError("Dados de Private Service Connect inválidos.");
  }
  return {
    name: raw.name,
    region: raw.region,
    ...(typeof raw.internalIp === "string" ? { internalIp: raw.internalIp } : {}),
  };
}

function parseSecretManagerData(raw: unknown): SecretManagerProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Secret Manager inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseZoneData(raw: unknown): ZoneProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de zona inválidos.");
  }

  const width =
    typeof raw.width === "number" && Number.isFinite(raw.width)
      ? Math.max(120, Math.round(raw.width))
      : 320;
  const height =
    typeof raw.height === "number" && Number.isFinite(raw.height)
      ? Math.max(80, Math.round(raw.height))
      : 200;
  const colorId =
    typeof raw.colorId === "string" && isZoneColorId(raw.colorId)
      ? raw.colorId
      : "slate";
  const borderWidth =
    typeof raw.borderWidth === "string" && isZoneBorderWidth(raw.borderWidth)
      ? raw.borderWidth
      : "normal";
  const borderStyle =
    typeof raw.borderStyle === "string" && isZoneBorderStyle(raw.borderStyle)
      ? raw.borderStyle
      : "solid";

  return {
    name: raw.name,
    colorId,
    borderWidth,
    borderStyle,
    width,
    height,
  };
}

function parseZIndex(raw: Record<string, unknown>): number {
  if (typeof raw.zIndex === "number" && Number.isFinite(raw.zIndex)) {
    return Math.round(raw.zIndex);
  }
  return MISSING_Z_INDEX;
}

function parseNode(raw: unknown): DiagramNode {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Nó inválido no documento.");
  }

  const { id, kind, position, data } = raw;
  const zIndex = parseZIndex(raw);
  if (typeof id !== "string" || !isValidDiagramId(id)) {
    throw new DiagramParseError(`ID de nó inválido: ${String(id)}`);
  }

  const parsedPosition = parsePosition(position);
  const nodeId = id;

  switch (kind) {
    case "vpc":
      if (!nodeIdMatchesKind(nodeId, "vpc")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo VPC.`);
      }
      return {
        id: nodeId,
        kind: "vpc",
        position: parsedPosition,
        zIndex,
        data: parseVpcData(data),
      };
    case "subnet":
      if (!nodeIdMatchesKind(nodeId, "subnet")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo sub-rede.`);
      }
      return {
        id: nodeId,
        kind: "subnet",
        position: parsedPosition,
        zIndex,
        data: parseSubnetData(data),
      };
    case "vm":
      if (!nodeIdMatchesKind(nodeId, "vm")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo VM.`);
      }
      return {
        id: nodeId,
        kind: "vm",
        position: parsedPosition,
        zIndex,
        data: parseVmData(data),
      };
    case "storage":
      if (!nodeIdMatchesKind(nodeId, "storage")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Storage.`,
        );
      }
      return {
        id: nodeId,
        kind: "storage",
        position: parsedPosition,
        zIndex,
        data: parseStorageData(data),
      };
    case "sql":
      if (!nodeIdMatchesKind(nodeId, "sql")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud SQL.`,
        );
      }
      return {
        id: nodeId,
        kind: "sql",
        position: parsedPosition,
        zIndex,
        data: parseSqlData(data),
      };
    case "gke":
      if (!nodeIdMatchesKind(nodeId, "gke")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo GKE.`);
      }
      return {
        id: nodeId,
        kind: "gke",
        position: parsedPosition,
        zIndex,
        data: parseGkeData(data),
      };
    case "nat":
      if (!nodeIdMatchesKind(nodeId, "nat")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Cloud NAT.`);
      }
      return {
        id: nodeId,
        kind: "nat",
        position: parsedPosition,
        zIndex,
        data: parseNatData(data),
      };
    case "router":
      if (!nodeIdMatchesKind(nodeId, "router")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Router.`,
        );
      }
      return {
        id: nodeId,
        kind: "router",
        position: parsedPosition,
        zIndex,
        data: parseRouterData(data),
      };
    case "peering":
      if (!nodeIdMatchesKind(nodeId, "peering")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo VPC Peering.`,
        );
      }
      return {
        id: nodeId,
        kind: "peering",
        position: parsedPosition,
        zIndex,
        data: parsePeeringData(data),
      };
    case "vpn":
      if (!nodeIdMatchesKind(nodeId, "vpn")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud VPN.`,
        );
      }
      return {
        id: nodeId,
        kind: "vpn",
        position: parsedPosition,
        zIndex,
        data: parseVpnData(data),
      };
    case "interconnect":
      if (!nodeIdMatchesKind(nodeId, "interconnect")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Interconnect.`,
        );
      }
      return {
        id: nodeId,
        kind: "interconnect",
        position: parsedPosition,
        zIndex,
        data: parseInterconnectData(data),
      };
    case "firewall":
      if (!nodeIdMatchesKind(nodeId, "firewall")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Firewall.`,
        );
      }
      return {
        id: nodeId,
        kind: "firewall",
        position: parsedPosition,
        zIndex,
        data: parseFirewallData(data),
      };
    case "dns":
      if (!nodeIdMatchesKind(nodeId, "dns")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud DNS.`,
        );
      }
      return {
        id: nodeId,
        kind: "dns",
        position: parsedPosition,
        zIndex,
        data: parseDnsData(data),
      };
    case "artifact":
      if (!nodeIdMatchesKind(nodeId, "artifact")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Artifact Registry.`,
        );
      }
      return {
        id: nodeId,
        kind: "artifact",
        position: parsedPosition,
        zIndex,
        data: parseArtifactData(data),
      };
    case "build":
      if (!nodeIdMatchesKind(nodeId, "build")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Build.`,
        );
      }
      return {
        id: nodeId,
        kind: "build",
        position: parsedPosition,
        zIndex,
        data: parseBuildData(data),
      };
    case "kms":
      if (!nodeIdMatchesKind(nodeId, "kms")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud KMS.`,
        );
      }
      return {
        id: nodeId,
        kind: "kms",
        position: parsedPosition,
        zIndex,
        data: parseKmsData(data),
      };
    case "iam":
      if (!nodeIdMatchesKind(nodeId, "iam")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo IAM.`);
      }
      return {
        id: nodeId,
        kind: "iam",
        position: parsedPosition,
        zIndex,
        data: parseIamData(data),
      };
    case "internet":
      if (!nodeIdMatchesKind(nodeId, "internet")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Internet.`);
      }
      return {
        id: nodeId,
        kind: "internet",
        position: parsedPosition,
        zIndex,
        data: parseInternetData(data),
      };
    case "run":
      if (!nodeIdMatchesKind(nodeId, "run")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Cloud Run.`);
      }
      return {
        id: nodeId,
        kind: "run",
        position: parsedPosition,
        zIndex,
        data: parseRunData(data),
      };
    case "pubsub":
      if (!nodeIdMatchesKind(nodeId, "pubsub")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Pub/Sub.`);
      }
      return {
        id: nodeId,
        kind: "pubsub",
        position: parsedPosition,
        zIndex,
        data: parsePubsubData(data),
      };
    case "eventarc":
      if (!nodeIdMatchesKind(nodeId, "eventarc")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Eventarc.`);
      }
      return {
        id: nodeId,
        kind: "eventarc",
        position: parsedPosition,
        zIndex,
        data: parseEventarcData(data),
      };
    case "bigquery":
      if (!nodeIdMatchesKind(nodeId, "bigquery")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo BigQuery.`);
      }
      return {
        id: nodeId,
        kind: "bigquery",
        position: parsedPosition,
        zIndex,
        data: parseBigqueryData(data),
      };
    case "spanner":
      if (!nodeIdMatchesKind(nodeId, "spanner")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Spanner.`,
        );
      }
      return {
        id: nodeId,
        kind: "spanner",
        position: parsedPosition,
        zIndex,
        data: parseSpannerData(data),
      };
    case "firestore":
      if (!nodeIdMatchesKind(nodeId, "firestore")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Firestore.`,
        );
      }
      return {
        id: nodeId,
        kind: "firestore",
        position: parsedPosition,
        zIndex,
        data: parseFirestoreData(data),
      };
    case "bigtable":
      if (!nodeIdMatchesKind(nodeId, "bigtable")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Bigtable.`,
        );
      }
      return {
        id: nodeId,
        kind: "bigtable",
        position: parsedPosition,
        zIndex,
        data: parseBigtableData(data),
      };
    case "firebase":
      if (!nodeIdMatchesKind(nodeId, "firebase")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Firebase.`,
        );
      }
      return {
        id: nodeId,
        kind: "firebase",
        position: parsedPosition,
        zIndex,
        data: parseFirebaseData(data),
      };
    case "workbench":
      if (!nodeIdMatchesKind(nodeId, "workbench")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Vertex AI Workbench.`,
        );
      }
      return {
        id: nodeId,
        kind: "workbench",
        position: parsedPosition,
        zIndex,
        data: parseWorkbenchData(data),
      };
    case "notebook":
      if (!nodeIdMatchesKind(nodeId, "notebook")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Notebook (Vertex AI).`,
        );
      }
      return {
        id: nodeId,
        kind: "notebook",
        position: parsedPosition,
        zIndex,
        data: parseNotebookData(data),
      };
    case "spark":
      if (!nodeIdMatchesKind(nodeId, "spark")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Apache Spark.`,
        );
      }
      return {
        id: nodeId,
        kind: "spark",
        position: parsedPosition,
        zIndex,
        data: parseSparkData(data),
      };
    case "airflow":
      if (!nodeIdMatchesKind(nodeId, "airflow")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Managed Airflow.`,
        );
      }
      return {
        id: nodeId,
        kind: "airflow",
        position: parsedPosition,
        zIndex,
        data: parseAirflowData(data),
      };
    case "dataflow":
      if (!nodeIdMatchesKind(nodeId, "dataflow")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Dataflow.`,
        );
      }
      return {
        id: nodeId,
        kind: "dataflow",
        position: parsedPosition,
        zIndex,
        data: parseDataflowData(data),
      };
    case "modelregistry":
      if (!nodeIdMatchesKind(nodeId, "modelregistry")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Model Registry.`,
        );
      }
      return {
        id: nodeId,
        kind: "modelregistry",
        position: parsedPosition,
        zIndex,
        data: parseModelRegistryData(data),
      };
    case "zone":
      if (!nodeIdMatchesKind(nodeId, "zone")) {
        throw new DiagramParseError(`ID "${nodeId}" não corresponde ao tipo Zona.`);
      }
      return {
        id: nodeId,
        kind: "zone",
        position: parsedPosition,
        zIndex,
        data: parseZoneData(data),
      };
    case "folder":
      if (!nodeIdMatchesKind(nodeId, "folder")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Pasta.`,
        );
      }
      return {
        id: nodeId,
        kind: "folder",
        position: parsedPosition,
        zIndex,
        data: parseFolderData(data),
      };
    case "project":
      if (!nodeIdMatchesKind(nodeId, "project")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Projeto.`,
        );
      }
      return {
        id: nodeId,
        kind: "project",
        position: parsedPosition,
        zIndex,
        data: parseProjectData(data),
      };
    case "entra":
      if (!nodeIdMatchesKind(nodeId, "entra")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Microsoft Entra ID.`,
        );
      }
      return {
        id: nodeId,
        kind: "entra",
        position: parsedPosition,
        zIndex,
        data: parseEntraData(data),
      };
    case "infocard":
      if (!nodeIdMatchesKind(nodeId, "infocard")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Identificação.`,
        );
      }
      return {
        id: nodeId,
        kind: "infocard",
        position: parsedPosition,
        zIndex,
        data: parseInfocardData(data),
      };
    case "pcuser":
      if (!nodeIdMatchesKind(nodeId, "pcuser")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Usuário.`,
        );
      }
      return {
        id: nodeId,
        kind: "pcuser",
        position: parsedPosition,
        zIndex,
        data: parsePcUserData(data),
      };
    case "onprem":
      if (!nodeIdMatchesKind(nodeId, "onprem")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo On-premises.`,
        );
      }
      return {
        id: nodeId,
        kind: "onprem",
        position: parsedPosition,
        zIndex,
        data: parseOnpremData(data),
      };
    case "github":
      if (!nodeIdMatchesKind(nodeId, "github")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo GitHub.`,
        );
      }
      return {
        id: nodeId,
        kind: "github",
        position: parsedPosition,
        zIndex,
        data: parseGithubData(data),
      };
    case "loadbalancer":
      if (!nodeIdMatchesKind(nodeId, "loadbalancer")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Load Balancing.`,
        );
      }
      return {
        id: nodeId,
        kind: "loadbalancer",
        position: parsedPosition,
        zIndex,
        data: parseLoadBalancerData(data),
      };
    case "orgpolicy":
      if (!nodeIdMatchesKind(nodeId, "orgpolicy")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Organization Policy.`,
        );
      }
      return {
        id: nodeId,
        kind: "orgpolicy",
        position: parsedPosition,
        zIndex,
        data: parseOrgPolicyData(data),
      };
    case "psc":
      if (!nodeIdMatchesKind(nodeId, "psc")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Private Service Connect.`,
        );
      }
      return {
        id: nodeId,
        kind: "psc",
        position: parsedPosition,
        zIndex,
        data: parsePscData(data),
      };
    case "secretmanager":
      if (!nodeIdMatchesKind(nodeId, "secretmanager")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Secret Manager.`,
        );
      }
      return {
        id: nodeId,
        kind: "secretmanager",
        position: parsedPosition,
        zIndex,
        data: parseSecretManagerData(data),
      };
    default:
      throw new DiagramParseError(`Tipo de recurso desconhecido: ${String(kind)}`);
  }
}

function parseEdge(raw: unknown): DiagramEdge {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Aresta inválida no documento.");
  }

  const { id, source, target, kind, sourceHandle, targetHandle } = raw;
  if (
    typeof id !== "string" ||
    typeof source !== "string" ||
    typeof target !== "string" ||
    !isValidDiagramId(id) ||
    !isValidDiagramId(source) ||
    !isValidDiagramId(target)
  ) {
    throw new DiagramParseError("Aresta com id, source ou target inválido.");
  }

  if (source === target) {
    throw new DiagramParseError("Aresta não pode ligar um nó a si mesmo.");
  }

  if (
    kind !== "subnet-vpc" &&
    kind !== "vm-subnet" &&
    kind !== "vm-storage" &&
    kind !== "vm-iam" &&
    kind !== "vm-nat" &&
    kind !== "vm-firewall" &&
    kind !== "vm-vm" &&
    kind !== "vm-bigquery" &&
    kind !== "sql-subnet" &&
    kind !== "gke-subnet" &&
    kind !== "nat-vpc" &&
    kind !== "router-vpc" &&
    kind !== "peering-vpc" &&
    kind !== "vpn-vpc" &&
    kind !== "interconnect-vpc" &&
    kind !== "firewall-vpc" &&
    kind !== "dns-vpc" &&
    kind !== "dns-vm" &&
    kind !== "dns-gke" &&
    kind !== "dns-dataflow" &&
    kind !== "nat-router" &&
    kind !== "router-vpn" &&
    kind !== "router-interconnect" &&
    kind !== "internet-nat" &&
    kind !== "internet-vpn" &&
    kind !== "internet-interconnect" &&
    kind !== "subnet-nat" &&
    kind !== "gke-artifact" &&
    kind !== "gke-bigquery" &&
    kind !== "vm-artifact" &&
    kind !== "run-subnet" &&
    kind !== "run-artifact" &&
    kind !== "run-bigquery" &&
    kind !== "build-artifact" &&
    kind !== "pubsub-build" &&
    kind !== "storage-build" &&
    kind !== "storage-dataflow" &&
    kind !== "storage-bigquery" &&
    kind !== "storage-gke" &&
    kind !== "storage-run" &&
    kind !== "github-build" &&
    kind !== "github-run" &&
    kind !== "github-gke" &&
    kind !== "pubsub-run" &&
    kind !== "pubsub-storage" &&
    kind !== "pubsub-bigquery" &&
    kind !== "pubsub-vm" &&
    kind !== "pubsub-gke" &&
    kind !== "pubsub-sql" &&
    kind !== "pubsub-workbench" &&
    kind !== "pubsub-notebook" &&
    kind !== "vm-spanner" &&
    kind !== "vm-bigtable" &&
    kind !== "vm-firebase" &&
    kind !== "gke-spanner" &&
    kind !== "gke-bigtable" &&
    kind !== "gke-firebase" &&
    kind !== "run-spanner" &&
    kind !== "run-bigtable" &&
    kind !== "run-firebase" &&
    kind !== "pubsub-spanner" &&
    kind !== "pubsub-bigtable" &&
    kind !== "workbench-subnet" &&
    kind !== "workbench-storage" &&
    kind !== "workbench-bigquery" &&
    kind !== "workbench-spanner" &&
    kind !== "workbench-bigtable" &&
    kind !== "vm-firestore" &&
    kind !== "gke-firestore" &&
    kind !== "run-firestore" &&
    kind !== "pubsub-firestore" &&
    kind !== "workbench-firestore" &&
    kind !== "firebase-firestore" &&
    kind !== "firebase-storage" &&
    kind !== "firebase-run" &&
    kind !== "pcuser-firebase" &&
    kind !== "notebook-subnet" &&
    kind !== "notebook-storage" &&
    kind !== "notebook-bigquery" &&
    kind !== "notebook-spanner" &&
    kind !== "notebook-firestore" &&
    kind !== "notebook-bigtable" &&
    kind !== "notebook-modelregistry" &&
    kind !== "spark-subnet" &&
    kind !== "spark-storage" &&
    kind !== "spark-bigquery" &&
    kind !== "spark-sql" &&
    kind !== "spark-vm" &&
    kind !== "spark-bigtable" &&
    kind !== "spark-kms" &&
    kind !== "airflow-subnet" &&
    kind !== "airflow-storage" &&
    kind !== "airflow-bigquery" &&
    kind !== "airflow-dataflow" &&
    kind !== "airflow-spark" &&
    kind !== "airflow-run" &&
    kind !== "airflow-sql" &&
    kind !== "airflow-kms" &&
    kind !== "pubsub-airflow" &&
    kind !== "dataflow-subnet" &&
    kind !== "dataflow-storage" &&
    kind !== "dataflow-bigquery" &&
    kind !== "dataflow-sql" &&
    kind !== "dataflow-firestore" &&
    kind !== "dataflow-bigtable" &&
    kind !== "dataflow-pubsub" &&
    kind !== "dataflow-kms" &&
    kind !== "pubsub-dataflow" &&
    kind !== "bigquery-storage" &&
    kind !== "bigquery-dataflow" &&
    kind !== "workbench-modelregistry" &&
    kind !== "build-modelregistry" &&
    kind !== "modelregistry-run" &&
    kind !== "modelregistry-gke" &&
    kind !== "modelregistry-storage" &&
    kind !== "modelregistry-kms" &&
    kind !== "pubsub-eventarc" &&
    kind !== "storage-eventarc" &&
    kind !== "eventarc-run" &&
    kind !== "eventarc-gke" &&
    kind !== "vm-kms" &&
    kind !== "gke-kms" &&
    kind !== "run-kms" &&
    kind !== "storage-kms" &&
    kind !== "sql-kms" &&
    kind !== "bigquery-kms" &&
    kind !== "firestore-kms" &&
    kind !== "spanner-kms" &&
    kind !== "bigtable-kms" &&
    kind !== "pcuser-entra" &&
    kind !== "pcuser-vm" &&
    kind !== "pcuser-run" &&
    kind !== "pcuser-onprem" &&
    kind !== "entra-vm" &&
    kind !== "entra-run" &&
    kind !== "entra-gke" &&
    kind !== "onprem-entra" &&
    kind !== "onprem-vpn" &&
    kind !== "onprem-interconnect" &&
    kind !== "onprem-vm" &&
    kind !== "folder-folder" &&
    kind !== "folder-project" &&
    kind !== "iam-project" &&
    kind !== "iam-subnet" &&
    kind !== "iam-kms" &&
    kind !== "iam-bigquery" &&
    kind !== "internet-loadbalancer" &&
    kind !== "loadbalancer-vm" &&
    kind !== "loadbalancer-gke" &&
    kind !== "loadbalancer-run" &&
    kind !== "loadbalancer-vpc" &&
    kind !== "orgpolicy-folder" &&
    kind !== "orgpolicy-project" &&
    kind !== "psc-subnet" &&
    kind !== "psc-sql" &&
    kind !== "vm-psc" &&
    kind !== "gke-psc" &&
    kind !== "run-psc" &&
    kind !== "vm-secretmanager" &&
    kind !== "gke-secretmanager" &&
    kind !== "run-secretmanager" &&
    kind !== "build-secretmanager" &&
    kind !== "airflow-secretmanager" &&
    kind !== "secretmanager-kms" &&
    kind !== "infocard-link" &&
    kind !== "zone-link" &&
    kind !== "sql-vpc"
  ) {
    throw new DiagramParseError(`Tipo de aresta desconhecido: ${String(kind)}`);
  }

  const parsed: DiagramEdge = {
    id,
    source,
    target,
    kind: kind === "sql-vpc" ? "sql-vpc" : kind,
  } as DiagramEdge;

  if (typeof sourceHandle === "string") {
    parsed.sourceHandle = sourceHandle;
  }
  if (typeof targetHandle === "string") {
    parsed.targetHandle = targetHandle;
  }

  const lineStyle = raw.lineStyle;
  if (lineStyle === "dashed") {
    parsed.lineStyle = "dashed";
  }

  return parsed;
}

function assertUniqueNodeIds(nodes: DiagramNode[]): void {
  const seen = new Set<string>();
  for (const node of nodes) {
    if (seen.has(node.id)) {
      throw new DiagramParseError(`ID de nó duplicado: ${node.id}`);
    }
    seen.add(node.id);
  }
}

/** Mantém arestas cujo source/target existem nos nós importados (referências intactas). */
export function filterEdgesWithValidReferences(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
}

function parseNamingMetadata(raw: unknown): DiagramNamingMetadata | undefined {
  if (!isRecord(raw)) return undefined;

  const { area, ambiente, patterns, isActive } = raw;
  if (
    typeof area !== "string" ||
    typeof ambiente !== "string" ||
    typeof isActive !== "boolean" ||
    !isRecord(patterns) ||
    typeof patterns.vpc !== "string" ||
    typeof patterns.subnet !== "string" ||
    typeof patterns.vm !== "string"
  ) {
    return undefined;
  }

  return {
    area,
    ambiente,
    isActive,
    patterns: {
      vpc: patterns.vpc,
      subnet: patterns.subnet,
      vm: patterns.vm,
      storage:
        typeof patterns.storage === "string"
          ? patterns.storage
          : DEFAULT_NAMING_PATTERNS.storage,
      sql:
        typeof patterns.sql === "string"
          ? patterns.sql
          : DEFAULT_NAMING_PATTERNS.sql,
      gke:
        typeof patterns.gke === "string"
          ? patterns.gke
          : DEFAULT_NAMING_PATTERNS.gke,
      nat:
        typeof patterns.nat === "string"
          ? patterns.nat
          : DEFAULT_NAMING_PATTERNS.nat,
      router:
        typeof patterns.router === "string"
          ? patterns.router
          : DEFAULT_NAMING_PATTERNS.router,
      peering:
        typeof patterns.peering === "string"
          ? patterns.peering
          : DEFAULT_NAMING_PATTERNS.peering,
      vpn:
        typeof patterns.vpn === "string"
          ? patterns.vpn
          : DEFAULT_NAMING_PATTERNS.vpn,
      interconnect:
        typeof patterns.interconnect === "string"
          ? patterns.interconnect
          : DEFAULT_NAMING_PATTERNS.interconnect,
      firewall:
        typeof patterns.firewall === "string"
          ? patterns.firewall
          : DEFAULT_NAMING_PATTERNS.firewall,
      dns:
        typeof patterns.dns === "string"
          ? patterns.dns
          : DEFAULT_NAMING_PATTERNS.dns,
      artifact:
        typeof patterns.artifact === "string"
          ? patterns.artifact
          : DEFAULT_NAMING_PATTERNS.artifact,
      build:
        typeof patterns.build === "string"
          ? patterns.build
          : DEFAULT_NAMING_PATTERNS.build,
      kms:
        typeof patterns.kms === "string"
          ? patterns.kms
          : DEFAULT_NAMING_PATTERNS.kms,
      iam:
        typeof patterns.iam === "string"
          ? patterns.iam
          : DEFAULT_NAMING_PATTERNS.iam,
      internet:
        typeof patterns.internet === "string"
          ? patterns.internet
          : DEFAULT_NAMING_PATTERNS.internet,
      run:
        typeof patterns.run === "string"
          ? patterns.run
          : DEFAULT_NAMING_PATTERNS.run,
      pubsub:
        typeof patterns.pubsub === "string"
          ? patterns.pubsub
          : DEFAULT_NAMING_PATTERNS.pubsub,
      eventarc:
        typeof patterns.eventarc === "string"
          ? patterns.eventarc
          : DEFAULT_NAMING_PATTERNS.eventarc,
      bigquery:
        typeof patterns.bigquery === "string"
          ? patterns.bigquery
          : DEFAULT_NAMING_PATTERNS.bigquery,
      spanner:
        typeof patterns.spanner === "string"
          ? patterns.spanner
          : DEFAULT_NAMING_PATTERNS.spanner,
      firestore:
        typeof patterns.firestore === "string"
          ? patterns.firestore
          : DEFAULT_NAMING_PATTERNS.firestore,
      bigtable:
        typeof patterns.bigtable === "string"
          ? patterns.bigtable
          : DEFAULT_NAMING_PATTERNS.bigtable,
      firebase:
        typeof patterns.firebase === "string"
          ? patterns.firebase
          : DEFAULT_NAMING_PATTERNS.firebase,
      workbench:
        typeof patterns.workbench === "string"
          ? patterns.workbench
          : DEFAULT_NAMING_PATTERNS.workbench,
      notebook:
        typeof patterns.notebook === "string"
          ? patterns.notebook
          : DEFAULT_NAMING_PATTERNS.notebook,
      spark:
        typeof patterns.spark === "string"
          ? patterns.spark
          : DEFAULT_NAMING_PATTERNS.spark,
      airflow:
        typeof patterns.airflow === "string"
          ? patterns.airflow
          : DEFAULT_NAMING_PATTERNS.airflow,
      dataflow:
        typeof patterns.dataflow === "string"
          ? patterns.dataflow
          : DEFAULT_NAMING_PATTERNS.dataflow,
      modelregistry:
        typeof patterns.modelregistry === "string"
          ? patterns.modelregistry
          : DEFAULT_NAMING_PATTERNS.modelregistry,
      zone:
        typeof patterns.zone === "string"
          ? patterns.zone
          : DEFAULT_NAMING_PATTERNS.zone,
      folder:
        typeof patterns.folder === "string"
          ? patterns.folder
          : DEFAULT_NAMING_PATTERNS.folder,
      project:
        typeof patterns.project === "string"
          ? patterns.project
          : DEFAULT_NAMING_PATTERNS.project,
      entra:
        typeof patterns.entra === "string"
          ? patterns.entra
          : DEFAULT_NAMING_PATTERNS.entra,
      infocard:
        typeof patterns.infocard === "string"
          ? patterns.infocard
          : DEFAULT_NAMING_PATTERNS.infocard,
      pcuser:
        typeof patterns.pcuser === "string"
          ? patterns.pcuser
          : DEFAULT_NAMING_PATTERNS.pcuser,
      onprem:
        typeof patterns.onprem === "string"
          ? patterns.onprem
          : DEFAULT_NAMING_PATTERNS.onprem,
      github:
        typeof patterns.github === "string"
          ? patterns.github
          : DEFAULT_NAMING_PATTERNS.github,
      loadbalancer:
        typeof patterns.loadbalancer === "string"
          ? patterns.loadbalancer
          : DEFAULT_NAMING_PATTERNS.loadbalancer,
      orgpolicy:
        typeof patterns.orgpolicy === "string"
          ? patterns.orgpolicy
          : DEFAULT_NAMING_PATTERNS.orgpolicy,
      psc:
        typeof patterns.psc === "string"
          ? patterns.psc
          : DEFAULT_NAMING_PATTERNS.psc,
      secretmanager:
        typeof patterns.secretmanager === "string"
          ? patterns.secretmanager
          : DEFAULT_NAMING_PATTERNS.secretmanager,
    },
  };
}

function parseMetadata(raw: unknown): DiagramMetadata {
  if (!isRecord(raw)) {
    return createDocumentMetadata();
  }

  const savedAt =
    typeof raw.savedAt === "string" && raw.savedAt
      ? raw.savedAt
      : new Date().toISOString();
  const generator = raw.generator === "diagloud" ? "diagloud" : "diagloud";
  const naming = parseNamingMetadata(raw.naming);

  return {
    savedAt,
    generator,
    ...(naming ? { naming } : {}),
  };
}

export function createDocumentMetadata(
  partial?: Partial<DiagramMetadata>,
): DiagramMetadata {
  return {
    savedAt: partial?.savedAt ?? new Date().toISOString(),
    generator: "diagloud",
    ...(partial?.naming ? { naming: partial.naming } : {}),
  };
}

export function buildDiagramDocument(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  naming?: DiagramNamingMetadata,
): DiagramDocument {
  return {
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata: createDocumentMetadata(naming ? { naming } : undefined),
  };
}

/** Remove arestas inválidas ou cíclicas ao importar, preservando ordem. */
export function sanitizeDocumentEdges(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramEdge[] {
  const accepted: DiagramEdge[] = [];
  for (const edge of edges) {
    const { sourceHandle, targetHandle } = resolveEdgeHandles(edge);
    const result = validateConnection(
      {
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
      },
      { nodes, edges: accepted },
    );
    if (result.valid) {
      accepted.push({
        ...edge,
        kind: result.edgeKind,
        source: result.source,
        target: result.target,
        sourceHandle: result.sourceHandle ?? sourceHandle,
        targetHandle: result.targetHandle ?? targetHandle,
      });
    }
  }
  return accepted;
}

export function normalizeLoadedDocument(
  input: DiagramDocument | LegacyDiagramDocument,
): DiagramDocument {
  const nodes = assignDefaultZIndices(
    input.nodes.map((node) => structuredClone(node)),
  );
  assertUniqueNodeIds(nodes);

  const clonedEdges = input.edges.map((edge) => structuredClone(edge));
  const migratedEdges = clonedEdges
    .map((edge) => migrateSqlVpcEdge(edge, nodes, clonedEdges))
    .filter((edge): edge is DiagramEdge => edge !== null);
  const referencedEdges = filterEdgesWithValidReferences(nodes, migratedEdges);
  const edges = sanitizeDocumentEdges(nodes, referencedEdges);
  const metadata =
    "metadata" in input && input.metadata
      ? parseMetadata(input.metadata)
      : createDocumentMetadata();

  return {
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata,
  };
}

export function parseDiagramDocument(json: string): DiagramDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DiagramParseError("JSON inválido.");
  }

  if (!isRecord(parsed)) {
    throw new DiagramParseError("Documento deve ser um objeto JSON.");
  }

  if (parsed.version !== DIAGRAM_DOCUMENT_VERSION) {
    throw new DiagramParseError(
      `Versão não suportada: ${String(parsed.version)} (esperado ${DIAGRAM_DOCUMENT_VERSION}).`,
    );
  }

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new DiagramParseError("Documento deve conter arrays nodes e edges.");
  }

  const nodes = parsed.nodes.map(parseNode);
  const edges = parsed.edges.map(parseEdge);
  const metadata = parseMetadata(parsed.metadata);

  return normalizeLoadedDocument({
    version: DIAGRAM_DOCUMENT_VERSION,
    nodes,
    edges,
    metadata,
  });
}

export function serializeDiagramDocument(document: DiagramDocument): string {
  return JSON.stringify(document, null, 2);
}

function namingMetadataEqual(
  a: DiagramNamingMetadata | undefined,
  b: DiagramNamingMetadata | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.area === b.area &&
    a.ambiente === b.ambiente &&
    a.isActive === b.isActive &&
    a.patterns.vpc === b.patterns.vpc &&
    a.patterns.subnet === b.patterns.subnet &&
    a.patterns.vm === b.patterns.vm &&
    a.patterns.storage === b.patterns.storage &&
    a.patterns.sql === b.patterns.sql &&
    a.patterns.gke === b.patterns.gke &&
    a.patterns.nat === b.patterns.nat &&
    a.patterns.router === b.patterns.router &&
    a.patterns.peering === b.patterns.peering &&
    a.patterns.vpn === b.patterns.vpn &&
    a.patterns.interconnect === b.patterns.interconnect &&
    a.patterns.firewall === b.patterns.firewall &&
    a.patterns.dns === b.patterns.dns &&
    a.patterns.artifact === b.patterns.artifact &&
    a.patterns.build === b.patterns.build &&
    a.patterns.kms === b.patterns.kms &&
    a.patterns.iam === b.patterns.iam &&
    a.patterns.internet === b.patterns.internet &&
    a.patterns.run === b.patterns.run &&
    a.patterns.pubsub === b.patterns.pubsub &&
    a.patterns.eventarc === b.patterns.eventarc &&
    a.patterns.bigquery === b.patterns.bigquery &&
    a.patterns.spanner === b.patterns.spanner &&
    a.patterns.firestore === b.patterns.firestore &&
    a.patterns.bigtable === b.patterns.bigtable &&
    a.patterns.firebase === b.patterns.firebase &&
    a.patterns.workbench === b.patterns.workbench &&
    a.patterns.notebook === b.patterns.notebook &&
    a.patterns.spark === b.patterns.spark &&
    a.patterns.airflow === b.patterns.airflow &&
    a.patterns.dataflow === b.patterns.dataflow &&
    a.patterns.modelregistry === b.patterns.modelregistry &&
    a.patterns.zone === b.patterns.zone &&
    a.patterns.folder === b.patterns.folder &&
    a.patterns.project === b.patterns.project &&
    a.patterns.entra === b.patterns.entra &&
    a.patterns.infocard === b.patterns.infocard &&
    a.patterns.pcuser === b.patterns.pcuser &&
    a.patterns.onprem === b.patterns.onprem &&
    a.patterns.github === b.patterns.github &&
    a.patterns.loadbalancer === b.patterns.loadbalancer &&
    a.patterns.orgpolicy === b.patterns.orgpolicy &&
    a.patterns.psc === b.patterns.psc &&
    a.patterns.secretmanager === b.patterns.secretmanager
  );
}

export function documentsEqual(
  a: DiagramDocument,
  b: DiagramDocument,
  options?: { ignoreSavedAt?: boolean },
): boolean {
  if (a.version !== b.version) return false;
  if (JSON.stringify(a.nodes) !== JSON.stringify(b.nodes)) return false;
  if (JSON.stringify(a.edges) !== JSON.stringify(b.edges)) return false;

  if (a.metadata.generator !== b.metadata.generator) return false;
  if (!namingMetadataEqual(a.metadata.naming, b.metadata.naming)) return false;

  if (!(options?.ignoreSavedAt ?? true)) {
    return a.metadata.savedAt === b.metadata.savedAt;
  }

  return true;
}

export function downloadDiagramDocument(
  diagram: DiagramDocument,
  filename?: string,
): void {
  const blob = new Blob([serializeDiagramDocument(diagram)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const stamp = diagram.metadata.savedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = filename ?? `diagloud-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
