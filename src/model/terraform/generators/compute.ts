import {
  nodesOfKind,
  vpcNodeForSubnet,
  type TerraformGenContext,
} from "../context";
import { defaultZone, escapeHclString, sectionHeader } from "../hcl";

export function generateComputeTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("Computação")];

  for (const node of nodesOfKind(ctx, "vm")) {
    const subnetId = ctx.graph.subnetForVm.get(node.id);
    if (!subnetId) continue;
    const chain = vpcNodeForSubnet(ctx, subnetId);
    if (!chain) continue;

    const resourceName = ctx.getTfResourceName(node);
    const subnetResourceName = ctx.getTfResourceName(chain.subnet);
    const zone = defaultZone(chain.subnet.data.region);
    const networkIp = node.data.internalIp?.trim()
      ? `\n    network_ip = "${escapeHclString(node.data.internalIp.trim())}"`
      : "";

    blocks.push(`resource "google_compute_instance" "${resourceName}" {
  name         = "${escapeHclString(node.data.name)}"
  machine_type = "${escapeHclString(node.data.machineType)}"
  zone         = "${escapeHclString(zone)}"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.${subnetResourceName}.id${networkIp}
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "gke")) {
    const subnetId = ctx.graph.subnetForGke.get(node.id);
    if (!subnetId) continue;
    const chain = vpcNodeForSubnet(ctx, subnetId);
    if (!chain) continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(chain.vpc);
    const subnetResourceName = ctx.getTfResourceName(chain.subnet);
    const location = chain.subnet.data.region;

    blocks.push(`resource "google_container_cluster" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(location)}"

  network    = google_compute_network.${vpcResourceName}.name
  subnetwork = google_compute_subnetwork.${subnetResourceName}.name

  initial_node_count       = ${node.data.nodeCount}
  remove_default_node_pool = true
}

resource "google_container_node_pool" "${resourceName}_pool" {
  name       = "${escapeHclString(node.data.name)}-pool"
  location   = "${escapeHclString(location)}"
  cluster    = google_container_cluster.${resourceName}.name
  node_count = ${node.data.nodeCount}

  node_config {
    machine_type = "${escapeHclString(node.data.machineType)}"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "run")) {
    const resourceName = ctx.getTfResourceName(node);
    const subnetId = ctx.graph.subnetForRun.get(node.id);
    const region =
      node.data.region ??
      (subnetId
        ? vpcNodeForSubnet(ctx, subnetId)?.subnet.data.region
        : undefined) ??
      ctx.defaultRegion;

    let vpcAccess = "";
    if (node.data.accessMode === "vpc" && subnetId) {
      const chain = vpcNodeForSubnet(ctx, subnetId);
      if (chain) {
        const vpcResourceName = ctx.getTfResourceName(chain.vpc);
        const subnetResourceName = ctx.getTfResourceName(chain.subnet);
        vpcAccess = `
    vpc_access {
      network_interfaces {
        network    = google_compute_network.${vpcResourceName}.id
        subnetwork = google_compute_subnetwork.${subnetResourceName}.id
      }
      egress = "ALL_TRAFFIC"
    }`;
      }
    }

    blocks.push(`resource "google_cloud_run_v2_service" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(region)}"
  ingress  = "${node.data.accessMode === "public" ? "INGRESS_TRAFFIC_ALL" : "INGRESS_TRAFFIC_INTERNAL_ONLY"}"

  template {
    containers {
      image = "${escapeHclString(node.data.imageUrl.trim() || "us-docker.pkg.dev/cloudrun/container/hello")}"
      resources {
        limits = {
          cpu    = "${escapeHclString(node.data.cpu)}"
          memory = "${escapeHclString(node.data.memory)}"
        }
      }
    }

    scaling {
      min_instance_count = ${node.data.minInstances}
    }${vpcAccess}
  }
}`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
