import {
  kmsKeyReference,
  nodesOfKind,
  vpcNodeForSubnet,
  type TerraformGenContext,
} from "../context";
import { escapeHclString, sectionHeader } from "../hcl";

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

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
