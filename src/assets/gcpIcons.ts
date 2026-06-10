import type { ResourceKind } from "../types";
import artifactIcon from "./google-cloud-legacy-icons/artifact_registry/artifact_registry.svg";
import bigqueryIcon from "./google-cloud-legacy-icons/bigquery/bigquery.svg";
import spannerIcon from "./google-cloud-legacy-icons/cloud_spanner/cloud_spanner.svg";
import natIcon from "./google-cloud-legacy-icons/cloud_nat/cloud_nat.svg";
import vpnIcon from "./google-cloud-legacy-icons/cloud_vpn/cloud_vpn.svg";
import subnetIcon from "./google-cloud-legacy-icons/cloud_network/cloud_network.svg";
import runIcon from "./google-cloud-legacy-icons/cloud_run/cloud_run.svg";
import gkeIcon from "./google-cloud-legacy-icons/google_kubernetes_engine/google_kubernetes_engine.svg";
import pubsubIcon from "./google-cloud-legacy-icons/pubsub/pubsub.svg";
import sqlIcon from "./google-cloud-legacy-icons/cloud_sql/cloud_sql.svg";
import storageIcon from "./google-cloud-legacy-icons/cloud_storage/cloud_storage.svg";
import vmIcon from "./google-cloud-legacy-icons/compute_engine/compute_engine.svg";
import vpcIcon from "./google-cloud-legacy-icons/virtual_private_cloud/virtual_private_cloud.svg";
import internetIcon from "./icons/internet.svg";
import peeringIcon from "./icons/vpc-peering.svg";
import zoneIcon from "./icons/zone.svg";

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
  artifact: artifactIcon,
  internet: internetIcon,
  run: runIcon,
  pubsub: pubsubIcon,
  bigquery: bigqueryIcon,
  spanner: spannerIcon,
  zone: zoneIcon,
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
  artifact: "Artifact Registry",
  internet: "Internet",
  run: "Cloud Run",
  pubsub: "Pub/Sub",
  bigquery: "BigQuery",
  spanner: "Cloud Spanner",
  zone: "Zona",
};
