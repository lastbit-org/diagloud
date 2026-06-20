import {
  nodesOfKind,
  vpcNodeForSubnet,
  findNode,
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

  for (const node of nodesOfKind(ctx, "instancegroup")) {
    const subnetId = ctx.graph.subnetForInstanceGroup.get(node.id);
    if (!subnetId) continue;
    const chain = vpcNodeForSubnet(ctx, subnetId);
    if (!chain) continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(chain.vpc);
    const subnetResourceName = ctx.getTfResourceName(chain.subnet);
    const zone = defaultZone(chain.subnet.data.region);

    if (node.data.groupType === "managed") {
      blocks.push(`resource "google_compute_instance_template" "${resourceName}_template" {
  name         = "${escapeHclString(node.data.name)}-template"
  machine_type = "${escapeHclString(node.data.machineType)}"

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
  }

  network_interface {
    subnetwork = google_compute_subnetwork.${subnetResourceName}.id
  }
}

resource "google_compute_instance_group_manager" "${resourceName}" {
  name               = "${escapeHclString(node.data.name)}"
  base_instance_name = "${escapeHclString(node.data.name)}"
  zone               = "${escapeHclString(zone)}"
  target_size        = ${node.data.targetSize}

  version {
    instance_template = google_compute_instance_template.${resourceName}_template.id
  }
}`);
    } else {
      const instanceRefs = ctx.document.edges
        .filter(
          (edge) => edge.kind === "vm-instancegroup" && edge.target === node.id,
        )
        .map((edge) => edge.source)
        .map((vmId) => {
          const vmNode = findNode(ctx.document.nodes, vmId);
          if (!vmNode || vmNode.kind !== "vm") return null;
          if (!ctx.graph.subnetForVm.get(vmId)) return null;
          return `google_compute_instance.${ctx.getTfResourceName(vmNode)}.self_link`;
        })
        .filter((ref): ref is string => ref !== null);

      const instancesBlock =
        instanceRefs.length > 0
          ? `\n  instances = [\n    ${instanceRefs.join(",\n    ")},\n  ]`
          : "";

      blocks.push(`resource "google_compute_instance_group" "${resourceName}" {
  name        = "${escapeHclString(node.data.name)}"
  zone        = "${escapeHclString(zone)}"
  network     = google_compute_network.${vpcResourceName}.id${instancesBlock}
}`);
    }
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

  # Origem no diagrama: ${node.data.sourceType === "github" ? "GitHub" : node.data.sourceType === "function" ? "Function" : "Imagem Docker"}
  template {
    containers {
      image = "${escapeHclString(node.data.sourceType === "docker" ? node.data.imageUrl.trim() || "us-docker.pkg.dev/cloudrun/container/hello" : "us-docker.pkg.dev/cloudrun/container/hello")}"
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
