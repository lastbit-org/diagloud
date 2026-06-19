import {
  kmsKeyReference,
  nodesOfKind,
  vpcNodeForSubnet,
  type TerraformGenContext,
} from "../context";
import { defaultZone, escapeHclString, sectionHeader } from "../hcl";

const STORAGE_CLASS_MAP = {
  STANDARD: "STANDARD",
  NEARLINE: "NEARLINE",
  COLDLINE: "COLDLINE",
  ARCHIVE: "ARCHIVE",
} as const;

export function generateDataTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("Dados")];

  for (const node of nodesOfKind(ctx, "storage")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const encryption = kmsRef
      ? `
  encryption {
    default_kms_key_name = ${kmsRef}
  }`
      : "";

    blocks.push(`resource "google_storage_bucket" "${resourceName}" {
  name          = "${escapeHclString(node.data.name)}"
  location      = "${escapeHclString(node.data.location)}"
  storage_class = "${STORAGE_CLASS_MAP[node.data.storageClass]}"
  force_destroy = false${encryption}
}`);
  }

  for (const node of nodesOfKind(ctx, "sql")) {
    const resourceName = ctx.getTfResourceName(node);
    const isPrivate = node.data.accessMode === "private";
    const subnetId = ctx.graph.subnetForSql.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    const vpcResourceName = chain ? ctx.getTfResourceName(chain.vpc) : undefined;

    let ipConfig = "";
    if (isPrivate && vpcResourceName) {
      ipConfig = `
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.${vpcResourceName}.id
    }`;
    } else {
      ipConfig = `
    ip_configuration {
      ipv4_enabled = true
    }`;
    }

    blocks.push(`resource "google_sql_database_instance" "${resourceName}" {
  name             = "${escapeHclString(node.data.name)}"
  database_version = "${escapeHclString(node.data.engine)}"
  region           = "${escapeHclString(node.data.region)}"

  settings {
    tier = "db-f1-micro"${ipConfig}
  }

  deletion_protection = false
}`);
  }

  for (const node of nodesOfKind(ctx, "bigquery")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const defaultEncryption = kmsRef
      ? `
  default_encryption_configuration {
    kms_key_name = ${kmsRef}
  }`
      : "";

    blocks.push(`resource "google_bigquery_dataset" "${resourceName}" {
  dataset_id                  = "${escapeHclString(node.data.name)}"
  friendly_name               = "${escapeHclString(node.data.name)}"
  location                    = "${escapeHclString(node.data.location)}"
  delete_contents_on_destroy  = false${defaultEncryption}
}`);
  }

  for (const node of nodesOfKind(ctx, "spanner")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const encryption = kmsRef
      ? `
  encryption_config {
    kms_key_name = ${kmsRef}
  }`
      : "";

    blocks.push(`resource "google_spanner_instance" "${resourceName}" {
  name         = "${escapeHclString(node.data.name)}"
  config       = "${escapeHclString(node.data.config)}"
  display_name = "${escapeHclString(node.data.name)}"
  num_nodes    = 1${encryption}
}`);
  }

  for (const node of nodesOfKind(ctx, "firestore")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const cmek = kmsRef ? `\n  cmek_config {\n    kms_key_name = ${kmsRef}\n  }` : "";

    blocks.push(`resource "google_firestore_database" "${resourceName}" {
  name        = "${escapeHclString(node.data.name)}"
  location_id = "${escapeHclString(node.data.location)}"
  type        = "FIRESTORE_NATIVE"${cmek}
}`);
  }

  for (const node of nodesOfKind(ctx, "bigtable")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const encryption = kmsRef
      ? `
  cluster {
    cluster_id   = "${escapeHclString(node.data.name)}-cluster"
    zone         = "${escapeHclString(defaultZone(node.data.location))}"
    kms_key_name = ${kmsRef}
  }`
      : `
  cluster {
    cluster_id = "${escapeHclString(node.data.name)}-cluster"
    zone       = "${escapeHclString(defaultZone(node.data.location))}"
  }`;

    blocks.push(`resource "google_bigtable_instance" "${resourceName}" {
  name = "${escapeHclString(node.data.name)}"${encryption}
}`);
  }

  for (const node of nodesOfKind(ctx, "memorystore")) {
    const resourceName = ctx.getTfResourceName(node);
    const subnetId = ctx.graph.subnetForMemorystore.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    const vpcResourceName = chain
      ? ctx.getTfResourceName(chain.vpc)
      : undefined;
    const networkBlock = vpcResourceName
      ? `
  authorized_network = google_compute_network.${vpcResourceName}.id`
      : "";
    const kmsRef = kmsKeyReference(ctx, node.id);
    const redisCustomerManagedKey = kmsRef
      ? `
  customer_managed_key = ${kmsRef}`
      : "";

    if (node.data.engine === "redis") {
      blocks.push(`resource "google_redis_instance" "${resourceName}" {
  name           = "${escapeHclString(node.data.name)}"
  tier           = "${node.data.tier === "standard" ? "STANDARD_HA" : "BASIC"}"
  memory_size_gb = 1
  region         = "${escapeHclString(node.data.region)}"${networkBlock}${redisCustomerManagedKey}
}`);
    } else {
      blocks.push(`resource "google_memcache_instance" "${resourceName}" {
  name       = "${escapeHclString(node.data.name)}"
  node_count = 1
  region     = "${escapeHclString(node.data.region)}"${networkBlock}

  node_config {
    cpu    = 1
    memory = 1024
  }
}`);
    }
  }

  for (const node of nodesOfKind(ctx, "alloydb")) {
    const resourceName = ctx.getTfResourceName(node);
    const subnetId = ctx.graph.subnetForAlloydb.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    const vpcResourceName = chain
      ? ctx.getTfResourceName(chain.vpc)
      : undefined;
    const networkBlock = vpcResourceName
      ? `
  network_config {
    network = google_compute_network.${vpcResourceName}.id
  }`
      : "";
    const kmsRef = kmsKeyReference(ctx, node.id);
    const kmsBlock = kmsRef
      ? `
  encryption_config {
    kms_key_name = ${kmsRef}
  }`
      : "";

    blocks.push(`resource "google_alloydb_cluster" "${resourceName}" {
  cluster_id = "${escapeHclString(node.data.name)}"
  location   = "${escapeHclString(node.data.region)}"${networkBlock}${kmsBlock}
}

resource "google_alloydb_instance" "${resourceName}_primary" {
  cluster       = google_alloydb_cluster.${resourceName}.name
  instance_id   = "${escapeHclString(node.data.name)}-primary"
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 2
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "knowledgecatalog")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Knowledge Catalog: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_dataplex_lake" "${resourceName}" { ... }`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
