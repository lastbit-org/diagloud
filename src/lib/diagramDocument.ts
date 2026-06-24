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
  type InstanceGroupProps,
  type InstanceGroupType,
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
  type TuningProps,
  type EvaluationProps,
  type EndpointsProps,
  type BatchInferenceProps,
  type FeatureStoreProps,
  type ExperimentsProps,
  type TrainingProps,
  type PipelinesProps,
  type MlMonitoringProps,
  type ZoneProps,
  type FolderProps,
  type ProjectProps,
  type EntraProps,
  type InfocardProps,
  type PcUserProps,
  type OnpremProps,
  type GithubProps,
  type AzDoRepoProps,
  type AzDoPipelineProps,
  type LoadBalancerProps,
  type LoadBalancerType,
  type CdnProps,
  type CdnOriginType,
  type OrgPolicyProps,
  type PscProps,
  type SecretManagerProps,
  type CertificateManagerProps,
  type CertificateType,
  type ApigeeProps,
  type ApigeeEnvType,
  type MemorystoreProps,
  type MemorystoreEngine,
  type MemorystoreTier,
  type AlloydbProps,
  type CloudShellProps,
  type MonitoringProps,
  type CloudLoggingProps,
  type CloudArmorProps,
  type KnowledgeCatalogProps,
  type UserGroupProps,
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

const SQL_ENGINES = new Set([
  "MYSQL_8_0",
  "POSTGRES_15",
  "SQLSERVER_2019_STANDARD",
]);

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

const INSTANCE_GROUP_TYPES = new Set<InstanceGroupType>(["managed", "unmanaged"]);

function parseInstanceGroupData(raw: unknown): InstanceGroupProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    (raw.groupType !== "managed" && raw.groupType !== "unmanaged") ||
    typeof raw.machineType !== "string" ||
    typeof raw.targetSize !== "number" ||
    !Number.isInteger(raw.targetSize) ||
    raw.targetSize < 1
  ) {
    throw new DiagramParseError("Dados de Instance Group inválidos.");
  }
  if (!INSTANCE_GROUP_TYPES.has(raw.groupType)) {
    throw new DiagramParseError("Dados de Instance Group inválidos.");
  }
  const data: InstanceGroupProps = {
    name: raw.name,
    groupType: raw.groupType,
    targetSize: raw.targetSize,
    machineType: raw.machineType,
  };
  if (typeof raw.region === "string") {
    data.region = raw.region;
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
  const action = raw.action === "deny" ? "deny" : "allow";
  return {
    name: raw.name,
    direction: raw.direction === "egress" ? "egress" : "ingress",
    showDetails: raw.showDetails === true,
    action,
    source: typeof raw.source === "string" ? raw.source : "0.0.0.0/0",
    destination: typeof raw.destination === "string" ? raw.destination : "",
    protocols:
      typeof raw.protocols === "string" ? raw.protocols : "tcp:80,443",
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
  const sourceType =
    raw.sourceType === "docker" ||
    raw.sourceType === "github" ||
    raw.sourceType === "function"
      ? raw.sourceType
      : "docker";
  const data: RunProps = {
    name: raw.name,
    sourceType,
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

function parseAgentPlatformLocationData(
  raw: unknown,
  label: string,
): { name: string; location: string } {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError(`Dados de ${label} inválidos.`);
  }
  return {
    name: raw.name,
    location: raw.location,
  };
}

function parseModelRegistryData(raw: unknown): ModelRegistryProps {
  return parseAgentPlatformLocationData(raw, "Model Registry");
}

function parseTuningData(raw: unknown): TuningProps {
  return parseAgentPlatformLocationData(raw, "Tuning");
}

function parseEvaluationData(raw: unknown): EvaluationProps {
  return parseAgentPlatformLocationData(raw, "Evaluation");
}

function parseEndpointsData(raw: unknown): EndpointsProps {
  return parseAgentPlatformLocationData(raw, "Endpoints");
}

function parseBatchInferenceData(raw: unknown): BatchInferenceProps {
  return parseAgentPlatformLocationData(raw, "Batch inference");
}

function parseFeatureStoreData(raw: unknown): FeatureStoreProps {
  return parseAgentPlatformLocationData(raw, "Feature Store");
}

function parseExperimentsData(raw: unknown): ExperimentsProps {
  return parseAgentPlatformLocationData(raw, "Experiments");
}

function parseTrainingData(raw: unknown): TrainingProps {
  return parseAgentPlatformLocationData(raw, "Training");
}

function parsePipelinesData(raw: unknown): PipelinesProps {
  return parseAgentPlatformLocationData(raw, "Pipelines");
}

function parseMlMonitoringData(raw: unknown): MlMonitoringProps {
  return parseAgentPlatformLocationData(raw, "Monitoring");
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

function parseAzDoRepoData(raw: unknown): AzDoRepoProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.organization !== "string" ||
    typeof raw.project !== "string" ||
    typeof raw.repository !== "string"
  ) {
    throw new DiagramParseError("Dados de Azure DevOps Repo inválidos.");
  }
  return {
    name: raw.name,
    organization: raw.organization,
    project: raw.project,
    repository: raw.repository,
  };
}

function parseAzDoPipelineData(raw: unknown): AzDoPipelineProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.organization !== "string" ||
    typeof raw.project !== "string" ||
    typeof raw.pipelineName !== "string"
  ) {
    throw new DiagramParseError("Dados de Azure DevOps Pipeline inválidos.");
  }
  return {
    name: raw.name,
    organization: raw.organization,
    project: raw.project,
    pipelineName: raw.pipelineName,
  };
}

function parseCloudShellData(raw: unknown): CloudShellProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud Shell inválidos.");
  }
  return { name: raw.name };
}

function parseMonitoringData(raw: unknown): MonitoringProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud Monitoring inválidos.");
  }
  return { name: raw.name };
}

function parseCloudLoggingData(raw: unknown): CloudLoggingProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud Logging inválidos.");
  }
  return {
    name: raw.name,
    location: typeof raw.location === "string" ? raw.location : "global",
  };
}

function parseCloudArmorData(raw: unknown): CloudArmorProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud Armor inválidos.");
  }
  return { name: raw.name };
}

function parseKnowledgeCatalogData(raw: unknown): KnowledgeCatalogProps {
  return parseAgentPlatformLocationData(raw, "Knowledge Catalog");
}

function parseUserGroupData(raw: unknown): UserGroupProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Grupo de usuários inválidos.");
  }
  return {
    name: raw.name,
    groupEmail:
      typeof raw.groupEmail === "string"
        ? raw.groupEmail
        : "eng-platform@example.com",
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

const CDN_ORIGIN_TYPES = new Set<CdnOriginType>([
  "storage",
  "loadbalancer",
  "custom",
]);

function parseCdnData(raw: unknown): CdnProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Cloud CDN inválidos.");
  }
  const originType =
    raw.originType === "storage" ||
    raw.originType === "loadbalancer" ||
    raw.originType === "custom"
      ? raw.originType
      : "storage";
  if (!CDN_ORIGIN_TYPES.has(originType)) {
    throw new DiagramParseError("Dados de Cloud CDN inválidos.");
  }
  return {
    name: raw.name,
    region:
      typeof raw.region === "string" && raw.region.trim()
        ? raw.region
        : "southamerica-east1",
    originType,
  };
}

function parseOrgPolicyData(raw: unknown): OrgPolicyProps {
  if (!isRecord(raw)) {
    throw new DiagramParseError("Dados de Organization Policy inválidos.");
  }
  return {
    name: "Organization Policy",
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

const CERTIFICATE_TYPES = new Set<CertificateType>(["managed", "self_managed"]);

function parseCertificateManagerData(raw: unknown): CertificateManagerProps {
  if (
    !isRecord(raw) ||
    typeof raw.name !== "string" ||
    typeof raw.location !== "string"
  ) {
    throw new DiagramParseError("Dados de Certificate Manager inválidos.");
  }
  const certificateType =
    raw.certificateType === "managed" || raw.certificateType === "self_managed"
      ? raw.certificateType
      : "managed";
  if (!CERTIFICATE_TYPES.has(certificateType)) {
    throw new DiagramParseError("Dados de Certificate Manager inválidos.");
  }
  return {
    name: raw.name,
    location: raw.location,
    certificateType,
  };
}

const APIGEE_ENV_TYPES = new Set<ApigeeEnvType>(["x", "hybrid"]);

function parseApigeeData(raw: unknown): ApigeeProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Apigee inválidos.");
  }
  const envType =
    raw.envType === "x" || raw.envType === "hybrid" ? raw.envType : "x";
  if (!APIGEE_ENV_TYPES.has(envType)) {
    throw new DiagramParseError("Dados de Apigee inválidos.");
  }
  return {
    name: raw.name,
    region:
      typeof raw.region === "string" && raw.region.trim()
        ? raw.region
        : "southamerica-east1",
    envType,
  };
}

const MEMORYSTORE_ENGINES = new Set<MemorystoreEngine>(["redis", "memcached"]);
const MEMORYSTORE_TIERS = new Set<MemorystoreTier>(["basic", "standard"]);

function parseMemorystoreData(raw: unknown): MemorystoreProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de Memorystore inválidos.");
  }
  const engine =
    raw.engine === "redis" || raw.engine === "memcached"
      ? raw.engine
      : "redis";
  const tier =
    raw.tier === "basic" || raw.tier === "standard" ? raw.tier : "standard";
  if (!MEMORYSTORE_ENGINES.has(engine) || !MEMORYSTORE_TIERS.has(tier)) {
    throw new DiagramParseError("Dados de Memorystore inválidos.");
  }
  return {
    name: raw.name,
    region:
      typeof raw.region === "string" && raw.region.trim()
        ? raw.region
        : "southamerica-east1",
    engine,
    tier,
    ...(typeof raw.internalIp === "string" ? { internalIp: raw.internalIp } : {}),
  };
}

function parseAlloydbData(raw: unknown): AlloydbProps {
  if (!isRecord(raw) || typeof raw.name !== "string") {
    throw new DiagramParseError("Dados de AlloyDB inválidos.");
  }
  return {
    name: raw.name,
    region:
      typeof raw.region === "string" && raw.region.trim()
        ? raw.region
        : "southamerica-east1",
    ...(typeof raw.internalIp === "string" ? { internalIp: raw.internalIp } : {}),
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
    case "instancegroup":
      if (!nodeIdMatchesKind(nodeId, "instancegroup")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Instance Group.`,
        );
      }
      return {
        id: nodeId,
        kind: "instancegroup",
        position: parsedPosition,
        zIndex,
        data: parseInstanceGroupData(data),
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
    case "tuning":
      if (!nodeIdMatchesKind(nodeId, "tuning")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Tuning.`,
        );
      }
      return {
        id: nodeId,
        kind: "tuning",
        position: parsedPosition,
        zIndex,
        data: parseTuningData(data),
      };
    case "evaluation":
      if (!nodeIdMatchesKind(nodeId, "evaluation")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Evaluation.`,
        );
      }
      return {
        id: nodeId,
        kind: "evaluation",
        position: parsedPosition,
        zIndex,
        data: parseEvaluationData(data),
      };
    case "endpoints":
      if (!nodeIdMatchesKind(nodeId, "endpoints")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Endpoints.`,
        );
      }
      return {
        id: nodeId,
        kind: "endpoints",
        position: parsedPosition,
        zIndex,
        data: parseEndpointsData(data),
      };
    case "batchinference":
      if (!nodeIdMatchesKind(nodeId, "batchinference")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Batch inference.`,
        );
      }
      return {
        id: nodeId,
        kind: "batchinference",
        position: parsedPosition,
        zIndex,
        data: parseBatchInferenceData(data),
      };
    case "featurestore":
      if (!nodeIdMatchesKind(nodeId, "featurestore")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Feature Store.`,
        );
      }
      return {
        id: nodeId,
        kind: "featurestore",
        position: parsedPosition,
        zIndex,
        data: parseFeatureStoreData(data),
      };
    case "experiments":
      if (!nodeIdMatchesKind(nodeId, "experiments")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Experiments.`,
        );
      }
      return {
        id: nodeId,
        kind: "experiments",
        position: parsedPosition,
        zIndex,
        data: parseExperimentsData(data),
      };
    case "training":
      if (!nodeIdMatchesKind(nodeId, "training")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Training.`,
        );
      }
      return {
        id: nodeId,
        kind: "training",
        position: parsedPosition,
        zIndex,
        data: parseTrainingData(data),
      };
    case "pipelines":
      if (!nodeIdMatchesKind(nodeId, "pipelines")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Pipelines.`,
        );
      }
      return {
        id: nodeId,
        kind: "pipelines",
        position: parsedPosition,
        zIndex,
        data: parsePipelinesData(data),
      };
    case "mlmonitoring":
      if (!nodeIdMatchesKind(nodeId, "mlmonitoring")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Monitoring.`,
        );
      }
      return {
        id: nodeId,
        kind: "mlmonitoring",
        position: parsedPosition,
        zIndex,
        data: parseMlMonitoringData(data),
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
    case "azdorepo":
      if (!nodeIdMatchesKind(nodeId, "azdorepo")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Azure DevOps Repo.`,
        );
      }
      return {
        id: nodeId,
        kind: "azdorepo",
        position: parsedPosition,
        zIndex,
        data: parseAzDoRepoData(data),
      };
    case "azdopipeline":
      if (!nodeIdMatchesKind(nodeId, "azdopipeline")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Azure DevOps Pipeline.`,
        );
      }
      return {
        id: nodeId,
        kind: "azdopipeline",
        position: parsedPosition,
        zIndex,
        data: parseAzDoPipelineData(data),
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
    case "cdn":
      if (!nodeIdMatchesKind(nodeId, "cdn")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud CDN.`,
        );
      }
      return {
        id: nodeId,
        kind: "cdn",
        position: parsedPosition,
        zIndex,
        data: parseCdnData(data),
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
    case "certificatemanager":
      if (!nodeIdMatchesKind(nodeId, "certificatemanager")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Certificate Manager.`,
        );
      }
      return {
        id: nodeId,
        kind: "certificatemanager",
        position: parsedPosition,
        zIndex,
        data: parseCertificateManagerData(data),
      };
    case "apigee":
      if (!nodeIdMatchesKind(nodeId, "apigee")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Apigee.`,
        );
      }
      return {
        id: nodeId,
        kind: "apigee",
        position: parsedPosition,
        zIndex,
        data: parseApigeeData(data),
      };
    case "memorystore":
      if (!nodeIdMatchesKind(nodeId, "memorystore")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Memorystore.`,
        );
      }
      return {
        id: nodeId,
        kind: "memorystore",
        position: parsedPosition,
        zIndex,
        data: parseMemorystoreData(data),
      };
    case "alloydb":
      if (!nodeIdMatchesKind(nodeId, "alloydb")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo AlloyDB.`,
        );
      }
      return {
        id: nodeId,
        kind: "alloydb",
        position: parsedPosition,
        zIndex,
        data: parseAlloydbData(data),
      };
    case "cloudshell":
      if (!nodeIdMatchesKind(nodeId, "cloudshell")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Shell.`,
        );
      }
      return {
        id: nodeId,
        kind: "cloudshell",
        position: parsedPosition,
        zIndex,
        data: parseCloudShellData(data),
      };
    case "monitoring":
      if (!nodeIdMatchesKind(nodeId, "monitoring")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Monitoring.`,
        );
      }
      return {
        id: nodeId,
        kind: "monitoring",
        position: parsedPosition,
        zIndex,
        data: parseMonitoringData(data),
      };
    case "cloudlogging":
      if (!nodeIdMatchesKind(nodeId, "cloudlogging")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Logging.`,
        );
      }
      return {
        id: nodeId,
        kind: "cloudlogging",
        position: parsedPosition,
        zIndex,
        data: parseCloudLoggingData(data),
      };
    case "cloudarmor":
      if (!nodeIdMatchesKind(nodeId, "cloudarmor")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Cloud Armor.`,
        );
      }
      return {
        id: nodeId,
        kind: "cloudarmor",
        position: parsedPosition,
        zIndex,
        data: parseCloudArmorData(data),
      };
    case "knowledgecatalog":
      if (!nodeIdMatchesKind(nodeId, "knowledgecatalog")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Knowledge Catalog.`,
        );
      }
      return {
        id: nodeId,
        kind: "knowledgecatalog",
        position: parsedPosition,
        zIndex,
        data: parseKnowledgeCatalogData(data),
      };
    case "usergroup":
      if (!nodeIdMatchesKind(nodeId, "usergroup")) {
        throw new DiagramParseError(
          `ID "${nodeId}" não corresponde ao tipo Grupo de usuários.`,
        );
      }
      return {
        id: nodeId,
        kind: "usergroup",
        position: parsedPosition,
        zIndex,
        data: parseUserGroupData(data),
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
    kind !== "vm-instancegroup" &&
    kind !== "vm-storage" &&
    kind !== "vm-iam" &&
    kind !== "vm-nat" &&
    kind !== "vm-firewall" &&
    kind !== "vm-vm" &&
    kind !== "vm-bigquery" &&
    kind !== "sql-subnet" &&
    kind !== "gke-subnet" &&
    kind !== "instancegroup-subnet" &&
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
    kind !== "azdorepo-azdopipeline" &&
    kind !== "azdorepo-build" &&
    kind !== "azdorepo-run" &&
    kind !== "azdorepo-gke" &&
    kind !== "azdopipeline-build" &&
    kind !== "azdopipeline-run" &&
    kind !== "azdopipeline-gke" &&
    kind !== "cloudshell-project" &&
    kind !== "cloudshell-vm" &&
    kind !== "cloudshell-gke" &&
    kind !== "cloudshell-run" &&
    kind !== "cloudshell-storage" &&
    kind !== "cloudshell-bigquery" &&
    kind !== "cloudshell-sql" &&
    kind !== "cloudshell-build" &&
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
    kind !== "workbench-tuning" &&
    kind !== "notebook-tuning" &&
    kind !== "tuning-modelregistry" &&
    kind !== "workbench-evaluation" &&
    kind !== "notebook-evaluation" &&
    kind !== "evaluation-modelregistry" &&
    kind !== "modelregistry-endpoints" &&
    kind !== "endpoints-run" &&
    kind !== "endpoints-gke" &&
    kind !== "batchinference-modelregistry" &&
    kind !== "batchinference-storage" &&
    kind !== "featurestore-bigquery" &&
    kind !== "featurestore-storage" &&
    kind !== "workbench-experiments" &&
    kind !== "notebook-experiments" &&
    kind !== "experiments-modelregistry" &&
    kind !== "training-modelregistry" &&
    kind !== "pipelines-training" &&
    kind !== "pipelines-modelregistry" &&
    kind !== "mlmonitoring-experiments" &&
    kind !== "mlmonitoring-endpoints" &&
    kind !== "vm-cloudlogging" &&
    kind !== "gke-cloudlogging" &&
    kind !== "run-cloudlogging" &&
    kind !== "cloudlogging-monitoring" &&
    kind !== "vm-monitoring" &&
    kind !== "gke-monitoring" &&
    kind !== "run-monitoring" &&
    kind !== "instancegroup-cloudlogging" &&
    kind !== "instancegroup-monitoring" &&
    kind !== "instancegroup-iam" &&
    kind !== "instancegroup-firewall" &&
    kind !== "loadbalancer-cloudarmor" &&
    kind !== "cdn-cloudarmor" &&
    kind !== "knowledgecatalog-bigquery" &&
    kind !== "knowledgecatalog-storage" &&
    kind !== "knowledgecatalog-featurestore" &&
    kind !== "usergroup-iam" &&
    kind !== "usergroup-project" &&
    kind !== "usergroup-vm" &&
    kind !== "usergroup-run" &&
    kind !== "usergroup-gke" &&
    kind !== "pcuser-usergroup" &&
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
    kind !== "loadbalancer-instancegroup" &&
    kind !== "loadbalancer-gke" &&
    kind !== "loadbalancer-run" &&
    kind !== "loadbalancer-vpc" &&
    kind !== "internet-cdn" &&
    kind !== "cdn-storage" &&
    kind !== "cdn-loadbalancer" &&
    kind !== "cdn-vm" &&
    kind !== "cdn-gke" &&
    kind !== "cdn-run" &&
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
    kind !== "loadbalancer-certificatemanager" &&
    kind !== "cdn-certificatemanager" &&
    kind !== "certificatemanager-dns" &&
    kind !== "internet-apigee" &&
    kind !== "apigee-vm" &&
    kind !== "apigee-gke" &&
    kind !== "apigee-run" &&
    kind !== "apigee-vpc" &&
    kind !== "apigee-dns" &&
    kind !== "memorystore-subnet" &&
    kind !== "vm-memorystore" &&
    kind !== "gke-memorystore" &&
    kind !== "run-memorystore" &&
    kind !== "memorystore-kms" &&
    kind !== "alloydb-subnet" &&
    kind !== "vm-alloydb" &&
    kind !== "gke-alloydb" &&
    kind !== "run-alloydb" &&
    kind !== "alloydb-kms" &&
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
      instancegroup:
        typeof patterns.instancegroup === "string"
          ? patterns.instancegroup
          : DEFAULT_NAMING_PATTERNS.instancegroup,
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
      tuning:
        typeof patterns.tuning === "string"
          ? patterns.tuning
          : DEFAULT_NAMING_PATTERNS.tuning,
      evaluation:
        typeof patterns.evaluation === "string"
          ? patterns.evaluation
          : DEFAULT_NAMING_PATTERNS.evaluation,
      endpoints:
        typeof patterns.endpoints === "string"
          ? patterns.endpoints
          : DEFAULT_NAMING_PATTERNS.endpoints,
      batchinference:
        typeof patterns.batchinference === "string"
          ? patterns.batchinference
          : DEFAULT_NAMING_PATTERNS.batchinference,
      featurestore:
        typeof patterns.featurestore === "string"
          ? patterns.featurestore
          : DEFAULT_NAMING_PATTERNS.featurestore,
      experiments:
        typeof patterns.experiments === "string"
          ? patterns.experiments
          : DEFAULT_NAMING_PATTERNS.experiments,
      training:
        typeof patterns.training === "string"
          ? patterns.training
          : DEFAULT_NAMING_PATTERNS.training,
      pipelines:
        typeof patterns.pipelines === "string"
          ? patterns.pipelines
          : DEFAULT_NAMING_PATTERNS.pipelines,
      mlmonitoring:
        typeof patterns.mlmonitoring === "string"
          ? patterns.mlmonitoring
          : DEFAULT_NAMING_PATTERNS.mlmonitoring,
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
      azdorepo:
        typeof patterns.azdorepo === "string"
          ? patterns.azdorepo
          : DEFAULT_NAMING_PATTERNS.azdorepo,
      azdopipeline:
        typeof patterns.azdopipeline === "string"
          ? patterns.azdopipeline
          : DEFAULT_NAMING_PATTERNS.azdopipeline,
      loadbalancer:
        typeof patterns.loadbalancer === "string"
          ? patterns.loadbalancer
          : DEFAULT_NAMING_PATTERNS.loadbalancer,
      cdn:
        typeof patterns.cdn === "string"
          ? patterns.cdn
          : DEFAULT_NAMING_PATTERNS.cdn,
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
      certificatemanager:
        typeof patterns.certificatemanager === "string"
          ? patterns.certificatemanager
          : DEFAULT_NAMING_PATTERNS.certificatemanager,
      apigee:
        typeof patterns.apigee === "string"
          ? patterns.apigee
          : DEFAULT_NAMING_PATTERNS.apigee,
      memorystore:
        typeof patterns.memorystore === "string"
          ? patterns.memorystore
          : DEFAULT_NAMING_PATTERNS.memorystore,
      alloydb:
        typeof patterns.alloydb === "string"
          ? patterns.alloydb
          : DEFAULT_NAMING_PATTERNS.alloydb,
      cloudshell:
        typeof patterns.cloudshell === "string"
          ? patterns.cloudshell
          : DEFAULT_NAMING_PATTERNS.cloudshell,
      monitoring:
        typeof patterns.monitoring === "string"
          ? patterns.monitoring
          : DEFAULT_NAMING_PATTERNS.monitoring,
      cloudlogging:
        typeof patterns.cloudlogging === "string"
          ? patterns.cloudlogging
          : DEFAULT_NAMING_PATTERNS.cloudlogging,
      cloudarmor:
        typeof patterns.cloudarmor === "string"
          ? patterns.cloudarmor
          : DEFAULT_NAMING_PATTERNS.cloudarmor,
      knowledgecatalog:
        typeof patterns.knowledgecatalog === "string"
          ? patterns.knowledgecatalog
          : DEFAULT_NAMING_PATTERNS.knowledgecatalog,
      usergroup:
        typeof patterns.usergroup === "string"
          ? patterns.usergroup
          : DEFAULT_NAMING_PATTERNS.usergroup,
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
    a.patterns.instancegroup === b.patterns.instancegroup &&
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
    a.patterns.tuning === b.patterns.tuning &&
    a.patterns.evaluation === b.patterns.evaluation &&
    a.patterns.endpoints === b.patterns.endpoints &&
    a.patterns.batchinference === b.patterns.batchinference &&
    a.patterns.featurestore === b.patterns.featurestore &&
    a.patterns.experiments === b.patterns.experiments &&
    a.patterns.training === b.patterns.training &&
    a.patterns.pipelines === b.patterns.pipelines &&
    a.patterns.mlmonitoring === b.patterns.mlmonitoring &&
    a.patterns.zone === b.patterns.zone &&
    a.patterns.folder === b.patterns.folder &&
    a.patterns.project === b.patterns.project &&
    a.patterns.entra === b.patterns.entra &&
    a.patterns.infocard === b.patterns.infocard &&
    a.patterns.pcuser === b.patterns.pcuser &&
    a.patterns.onprem === b.patterns.onprem &&
    a.patterns.github === b.patterns.github &&
    a.patterns.azdorepo === b.patterns.azdorepo &&
    a.patterns.azdopipeline === b.patterns.azdopipeline &&
    a.patterns.loadbalancer === b.patterns.loadbalancer &&
    a.patterns.cdn === b.patterns.cdn &&
    a.patterns.orgpolicy === b.patterns.orgpolicy &&
    a.patterns.psc === b.patterns.psc &&
    a.patterns.secretmanager === b.patterns.secretmanager &&
    a.patterns.certificatemanager === b.patterns.certificatemanager &&
    a.patterns.apigee === b.patterns.apigee &&
    a.patterns.memorystore === b.patterns.memorystore &&
    a.patterns.alloydb === b.patterns.alloydb &&
    a.patterns.cloudshell === b.patterns.cloudshell &&
    a.patterns.monitoring === b.patterns.monitoring &&
    a.patterns.cloudlogging === b.patterns.cloudlogging &&
    a.patterns.cloudarmor === b.patterns.cloudarmor &&
    a.patterns.knowledgecatalog === b.patterns.knowledgecatalog &&
    a.patterns.usergroup === b.patterns.usergroup
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
