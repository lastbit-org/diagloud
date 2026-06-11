import type { ResourceKind } from "../types";
import artifactIcon from "./google-cloud-legacy-icons/artifact_registry/artifact_registry.svg";
import buildIcon from "./google-cloud-legacy-icons/cloud_build/cloud_build.svg";
import kmsIcon from "./google-cloud-legacy-icons/key_management_service/key_management_service.svg";
import bigqueryIcon from "./google-cloud-legacy-icons/bigquery/bigquery.svg";
import spannerIcon from "./google-cloud-legacy-icons/cloud_spanner/cloud_spanner.svg";
import firestoreIcon from "./google-cloud-legacy-icons/firestore/firestore.svg";
import workbenchIcon from "./google-cloud-legacy-icons/vertexai/vertexai.svg";
import sparkIcon from "./google-cloud-legacy-icons/dataproc/dataproc.svg";
import airflowIcon from "./google-cloud-legacy-icons/cloud_composer/cloud_composer.svg";
import dataflowIcon from "./google-cloud-legacy-icons/dataflow/dataflow.svg";
import modelRegistryIcon from "./google-cloud-legacy-icons/advanced_agent_modeling/advanced_agent_modeling.svg";
import natIcon from "./google-cloud-legacy-icons/cloud_nat/cloud_nat.svg";
import vpnIcon from "./google-cloud-legacy-icons/cloud_vpn/cloud_vpn.svg";
import interconnectIcon from "./google-cloud-legacy-icons/cloud_interconnect/cloud_interconnect.svg";
import firewallIcon from "./google-cloud-legacy-icons/cloud_firewall_rules/cloud_firewall_rules.svg";
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

/** Ícones oficiais GCP (legacy 24px). Sub-rede usa Cloud Network (sem ícone subnet no pacote). */
export const GCP_RESOURCE_ICONS: Record<ResourceKind, string> = {
  vpc: vpcIcon,
  subnet: subnetIcon,
  vm: vmIcon,
  storage: storageIcon,
  sql: sqlIcon,
  gke: gkeIcon,
  nat: natIcon,
  peering: peeringIcon,
  vpn: vpnIcon,
  interconnect: interconnectIcon,
  firewall: firewallIcon,
  artifact: artifactIcon,
  build: buildIcon,
  kms: kmsIcon,
  internet: internetIcon,
  run: runIcon,
  pubsub: pubsubIcon,
  eventarc: eventarcIcon,
  bigquery: bigqueryIcon,
  spanner: spannerIcon,
  firestore: firestoreIcon,
  workbench: workbenchIcon,
  spark: sparkIcon,
  airflow: airflowIcon,
  dataflow: dataflowIcon,
  modelregistry: modelRegistryIcon,
  zone: zoneIcon,
  folder: folderIcon,
  project: projectIcon,
  entra: entraIcon,
  infocard: infocardIcon,
  pcuser: pcUserIcon,
  onprem: onpremIcon,
};

export const GCP_RESOURCE_LABELS: Record<ResourceKind, string> = {
  vpc: "VPC",
  subnet: "Sub-rede",
  vm: "VM",
  storage: "Cloud Storage",
  sql: "Cloud SQL",
  gke: "GKE",
  nat: "Cloud NAT",
  peering: "VPC Peering",
  vpn: "Cloud VPN",
  interconnect: "Cloud Interconnect",
  firewall: "Firewall",
  artifact: "Artifact Registry",
  build: "Cloud Build",
  kms: "Cloud KMS",
  internet: "Internet",
  run: "Cloud Run",
  pubsub: "Pub/Sub",
  eventarc: "Eventarc",
  bigquery: "BigQuery",
  spanner: "Cloud Spanner",
  firestore: "Firestore",
  workbench: "Vertex AI Workbench",
  spark: "Apache Spark",
  airflow: "Managed Airflow",
  dataflow: "Cloud Dataflow",
  modelregistry: "Model Registry",
  zone: "Zona",
  folder: "Pasta",
  project: "Projeto",
  entra: "MICROSOFT ENTRA ID",
  infocard: "Identificação",
  pcuser: "Usuário (PC)",
  onprem: "On-premises",
};
