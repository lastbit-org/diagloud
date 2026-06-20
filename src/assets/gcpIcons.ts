import type { ResourceKind } from "../types";
import artifactIcon from "./google-cloud-legacy-icons/artifact_registry/artifact_registry.svg";
import buildIcon from "./google-cloud-legacy-icons/cloud_build/cloud_build.svg";
import kmsIcon from "./google-cloud-legacy-icons/key_management_service/key_management_service.svg";
import iamIcon from "./google-cloud-legacy-icons/identity_and_access_management/identity_and_access_management.svg";
import bigqueryIcon from "./google-cloud-legacy-icons/bigquery/bigquery.svg";
import spannerIcon from "./google-cloud-legacy-icons/cloud_spanner/cloud_spanner.svg";
import firestoreIcon from "./google-cloud-legacy-icons/firestore/firestore.svg";
import bigtableIcon from "./google-cloud-legacy-icons/bigtable/bigtable.svg";
import firebaseIcon from "./firebase/firebase.svg";
import workbenchIcon from "./google-cloud-legacy-icons/vertexai/vertexai.svg";
import sparkIcon from "./google-cloud-legacy-icons/dataproc/dataproc.svg";
import airflowIcon from "./google-cloud-legacy-icons/cloud_composer/cloud_composer.svg";
import dataflowIcon from "./google-cloud-legacy-icons/dataflow/dataflow.svg";
import modelRegistryIcon from "./google-cloud-legacy-icons/advanced_agent_modeling/advanced_agent_modeling.svg";
import natIcon from "./google-cloud-legacy-icons/cloud_nat/cloud_nat.svg";
import routerIcon from "./google-cloud-legacy-icons/cloud_router/cloud_router.svg";
import vpnIcon from "./google-cloud-legacy-icons/cloud_vpn/cloud_vpn.svg";
import interconnectIcon from "./google-cloud-legacy-icons/cloud_interconnect/cloud_interconnect.svg";
import firewallIcon from "./google-cloud-legacy-icons/cloud_firewall_rules/cloud_firewall_rules.svg";
import dnsIcon from "./google-cloud-legacy-icons/cloud_dns/cloud_dns.svg";
import subnetIcon from "./google-cloud-legacy-icons/cloud_network/cloud_network.svg";
import runIcon from "./google-cloud-legacy-icons/cloud_run/cloud_run.svg";
import gkeIcon from "./google-cloud-legacy-icons/google_kubernetes_engine/google_kubernetes_engine.svg";
import pubsubIcon from "./google-cloud-legacy-icons/pubsub/pubsub.svg";
import eventarcIcon from "./google-cloud-legacy-icons/eventarc/eventarc.svg";
import sqlIcon from "./google-cloud-legacy-icons/cloud_sql/cloud_sql.svg";
import storageIcon from "./google-cloud-legacy-icons/cloud_storage/cloud_storage.svg";
import vmIcon from "./google-cloud-legacy-icons/compute_engine/compute_engine.svg";
import vpcIcon from "./google-cloud-legacy-icons/virtual_private_cloud/virtual_private_cloud.svg";
import internetIcon from "./icons/internet.svg";
import peeringIcon from "./icons/vpc-peering.svg";
import zoneIcon from "./icons/zone.svg";
import folderIcon from "./icons/folder.svg";
import projectIcon from "./google-cloud-legacy-icons/project/project.svg";
import entraIcon from "./ms-entra-id/Microsoft Entra ID color icon.svg";
import infocardIcon from "./icons/infocard.svg";
import pcUserIcon from "./icons/pc-user.svg";
import onpremIcon from "./icons/onprem.svg";
import githubIcon from "./github/github.svg";
import loadBalancerIcon from "./google-cloud-legacy-icons/cloud_load_balancing/cloud_load_balancing.svg";
import cdnIcon from "./google-cloud-legacy-icons/cloud_cdn/cloud_cdn.svg";
import orgPolicyIcon from "./google-cloud-legacy-icons/policy_analyzer/policy_analyzer.svg";
import pscIcon from "./google-cloud-legacy-icons/private_service_connect/private_service_connect.svg";
import cloudShellIcon from "./google-cloud-legacy-icons/cloud_shell/cloud_shell.svg";
import secretManagerIcon from "./google-cloud-legacy-icons/secret_manager/secret_manager.svg";
import certificateManagerIcon from "./google-cloud-legacy-icons/certificate_manager/certificate_manager.svg";
import apigeeIcon from "./google-cloud-legacy-icons/apigee_api_platform/apigee_api_platform.svg";
import memorystoreIcon from "./google-cloud-legacy-icons/memorystore/memorystore.svg";
import vertexAiIcon from "./core-products-icons/Unique Icons/Vertex AI/SVG/VertexAI-512-color.svg";
import automlIcon from "./google-cloud-legacy-icons/automl/automl.svg";
import batchIcon from "./google-cloud-legacy-icons/batch/batch.svg";
import traceIcon from "./google-cloud-legacy-icons/trace/trace.svg";
import dataplexIcon from "./google-cloud-legacy-icons/dataplex/dataplex.svg";
import tensorflowIcon from "./google-cloud-legacy-icons/tensorflow_enterprise/tensorflow_enterprise.svg";
import cloudDeployIcon from "./google-cloud-legacy-icons/cloud_deploy/cloud_deploy.svg";
import loggingIcon from "./google-cloud-legacy-icons/cloud_logging/cloud_logging.svg";
import armorIcon from "./google-cloud-legacy-icons/cloud_armor/cloud_armor.svg";
import permissionsIcon from "./google-cloud-legacy-icons/permissions/permissions.svg";
import instanceGroupIcon from "./google-cloud-legacy-icons/gce_systems_management/gce_systems_management.svg";
import monitoringIcon from "./google-cloud-legacy-icons/cloud_monitoring/cloud_monitoring.svg";
import alloydbIcon from "./core-products-icons/Unique Icons/AlloyDB/SVG/AlloyDB-512-color.svg";

/** Ícones oficiais GCP (legacy 24px). Sub-rede usa Cloud Network (sem ícone subnet no pacote). */
export const GCP_RESOURCE_ICONS: Record<ResourceKind, string> = {
  vpc: vpcIcon,
  subnet: subnetIcon,
  vm: vmIcon,
  instancegroup: instanceGroupIcon,
  storage: storageIcon,
  sql: sqlIcon,
  gke: gkeIcon,
  nat: natIcon,
  router: routerIcon,
  peering: peeringIcon,
  vpn: vpnIcon,
  interconnect: interconnectIcon,
  firewall: firewallIcon,
  dns: dnsIcon,
  artifact: artifactIcon,
  build: buildIcon,
  kms: kmsIcon,
  iam: iamIcon,
  internet: internetIcon,
  run: runIcon,
  pubsub: pubsubIcon,
  eventarc: eventarcIcon,
  bigquery: bigqueryIcon,
  spanner: spannerIcon,
  firestore: firestoreIcon,
  bigtable: bigtableIcon,
  firebase: firebaseIcon,
  workbench: workbenchIcon,
  notebook: workbenchIcon,
  spark: sparkIcon,
  airflow: airflowIcon,
  dataflow: dataflowIcon,
  modelregistry: modelRegistryIcon,
  tuning: automlIcon,
  evaluation: vertexAiIcon,
  endpoints: vertexAiIcon,
  batchinference: batchIcon,
  featurestore: dataplexIcon,
  experiments: vertexAiIcon,
  training: tensorflowIcon,
  pipelines: cloudDeployIcon,
  mlmonitoring: traceIcon,
  zone: zoneIcon,
  folder: folderIcon,
  project: projectIcon,
  entra: entraIcon,
  infocard: infocardIcon,
  pcuser: pcUserIcon,
  onprem: onpremIcon,
  github: githubIcon,
  loadbalancer: loadBalancerIcon,
  cdn: cdnIcon,
  orgpolicy: orgPolicyIcon,
  psc: pscIcon,
  secretmanager: secretManagerIcon,
  certificatemanager: certificateManagerIcon,
  apigee: apigeeIcon,
  memorystore: memorystoreIcon,
  alloydb: alloydbIcon,
  cloudshell: cloudShellIcon,
  monitoring: monitoringIcon,
  cloudlogging: loggingIcon,
  cloudarmor: armorIcon,
  knowledgecatalog: dataplexIcon,
  usergroup: permissionsIcon,
};

export const GCP_RESOURCE_LABELS: Record<ResourceKind, string> = {
  vpc: "VPC",
  subnet: "Sub-rede",
  vm: "Compute Engine",
  instancegroup: "Instance Group",
  storage: "Cloud Storage",
  sql: "Cloud SQL",
  gke: "GKE",
  nat: "Cloud Nat",
  router: "Cloud Router",
  peering: "VPC Peering",
  vpn: "Cloud VPN",
  interconnect: "Cloud Interconnect",
  firewall: "Firewall",
  dns: "Cloud DNS",
  artifact: "Artifact Registry",
  build: "Cloud Build",
  kms: "KMS",
  iam: "IAM",
  internet: "Internet",
  run: "Cloud Run",
  pubsub: "Pub/Sub",
  eventarc: "Eventarc",
  bigquery: "BigQuery",
  spanner: "Spanner",
  firestore: "Firestore",
  bigtable: "Cloud Bigtable",
  firebase: "Firebase",
  workbench: "Workbench",
  notebook: "Notebook (Agent Platform)",
  spark: "Managed Apache Spark",
  airflow: "Managed Airflow",
  dataflow: "Dataflow",
  modelregistry: "Model Registry",
  tuning: "Tuning",
  evaluation: "Evaluation",
  endpoints: "Endpoints",
  batchinference: "Batch inference",
  featurestore: "Feature Store",
  experiments: "Experiments",
  training: "Training",
  pipelines: "Pipelines",
  mlmonitoring: "Monitoring",
  zone: "Zona",
  folder: "Pasta",
  project: "Projeto",
  entra: "microsoft entra id",
  infocard: "Identificação",
  pcuser: "Usuário",
  onprem: "On-premises",
  github: "GitHub",
  loadbalancer: "Cloud Load Balancing",
  cdn: "Cloud CDN",
  orgpolicy: "Organization Policy",
  psc: "Private Service Connect",
  secretmanager: "Secret Manager",
  certificatemanager: "Certificate Manager",
  apigee: "Apigee",
  memorystore: "Memorystore",
  alloydb: "AlloyDB",
  cloudshell: "Cloud Shell",
  monitoring: "Cloud Monitoring",
  cloudlogging: "Cloud Logging",
  cloudarmor: "Cloud Armor",
  knowledgecatalog: "Knowledge Catalog",
  usergroup: "Grupo de usuários",
};
