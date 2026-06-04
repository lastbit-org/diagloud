import type { ResourceKind } from "../types";
import subnetIcon from "./google-cloud-legacy-icons/cloud_network/cloud_network.svg";
import gkeIcon from "./google-cloud-legacy-icons/google_kubernetes_engine/google_kubernetes_engine.svg";
import sqlIcon from "./google-cloud-legacy-icons/cloud_sql/cloud_sql.svg";
import storageIcon from "./google-cloud-legacy-icons/cloud_storage/cloud_storage.svg";
import vmIcon from "./google-cloud-legacy-icons/compute_engine/compute_engine.svg";
import vpcIcon from "./google-cloud-legacy-icons/virtual_private_cloud/virtual_private_cloud.svg";

/** Ícones oficiais GCP (legacy 24px). Sub-rede usa Cloud Network (sem ícone subnet no pacote). */
export const GCP_RESOURCE_ICONS: Record<ResourceKind, string> = {
  vpc: vpcIcon,
  subnet: subnetIcon,
  vm: vmIcon,
  storage: storageIcon,
  sql: sqlIcon,
  gke: gkeIcon,
};

export const GCP_RESOURCE_LABELS: Record<ResourceKind, string> = {
  vpc: "VPC",
  subnet: "Sub-rede",
  vm: "VM",
  storage: "Cloud Storage",
  sql: "Cloud SQL",
  gke: "GKE",
};
