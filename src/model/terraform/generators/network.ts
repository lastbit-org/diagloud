import {
  nodesOfKind,
  vpcNodeForSubnet,
  type TerraformGenContext,
} from "../context";
import { escapeHclString, sectionHeader } from "../hcl";

export function generateNetworkTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("Rede")];

  for (const node of nodesOfKind(ctx, "vpc")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`resource "google_compute_network" "${resourceName}" {
  name                    = "${escapeHclString(node.data.name)}"
  auto_create_subnetworks = false
}`);
  }

  for (const node of nodesOfKind(ctx, "subnet")) {
    const chain = vpcNodeForSubnet(ctx, node.id);
    if (!chain) continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(chain.vpc);

    blocks.push(`resource "google_compute_subnetwork" "${resourceName}" {
  name          = "${escapeHclString(node.data.name)}"
  ip_cidr_range = "${escapeHclString(node.data.cidr)}"
  region        = "${escapeHclString(node.data.region)}"
  network       = google_compute_network.${vpcResourceName}.id
}`);
  }

  for (const node of nodesOfKind(ctx, "nat")) {
    const vpcId = ctx.graph.vpcForNat.get(node.id);
    if (!vpcId) continue;
    const vpcNode = ctx.document.nodes.find((n) => n.id === vpcId && n.kind === "vpc");
    if (!vpcNode || vpcNode.kind !== "vpc") continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(vpcNode);
    const routerName = `${resourceName}_router`;

    blocks.push(`resource "google_compute_router" "${routerName}" {
  name    = "router-${escapeHclString(node.data.name)}"
  region  = "${escapeHclString(node.data.region)}"
  network = google_compute_network.${vpcResourceName}.id
}

resource "google_compute_router_nat" "${resourceName}" {
  name                               = "${escapeHclString(node.data.name)}"
  router                             = google_compute_router.${routerName}.name
  region                             = "${escapeHclString(node.data.region)}"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}`);
  }

  for (const node of nodesOfKind(ctx, "firewall")) {
    const vpcId = ctx.graph.vpcForFirewall.get(node.id);
    if (!vpcId) continue;
    const vpcNode = ctx.document.nodes.find((n) => n.id === vpcId && n.kind === "vpc");
    if (!vpcNode || vpcNode.kind !== "vpc") continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(vpcNode);
    const direction =
      node.data.direction === "egress" ? "EGRESS" : "INGRESS";

    blocks.push(`resource "google_compute_firewall" "${resourceName}" {
  name      = "${escapeHclString(node.data.name)}"
  network   = google_compute_network.${vpcResourceName}.name
  direction = "${direction}"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}`);
  }

  for (const node of nodesOfKind(ctx, "vpn")) {
    const vpcId = ctx.graph.vpcForVpn.get(node.id);
    if (!vpcId) continue;
    const vpcNode = ctx.document.nodes.find((n) => n.id === vpcId && n.kind === "vpc");
    if (!vpcNode || vpcNode.kind !== "vpc") continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(vpcNode);

    blocks.push(`resource "google_compute_ha_vpn_gateway" "${resourceName}" {
  name    = "${escapeHclString(node.data.name)}"
  network = google_compute_network.${vpcResourceName}.id
  region  = "${escapeHclString(node.data.region)}"
}`);
  }

  for (const node of nodesOfKind(ctx, "interconnect")) {
    const vpcId = ctx.graph.vpcForInterconnect.get(node.id);
    if (!vpcId) continue;
    const vpcNode = ctx.document.nodes.find((n) => n.id === vpcId && n.kind === "vpc");
    if (!vpcNode || vpcNode.kind !== "vpc") continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcResourceName = ctx.getTfResourceName(vpcNode);

    blocks.push(`resource "google_compute_interconnect_attachment" "${resourceName}" {
  name                     = "${escapeHclString(node.data.name)}"
  region                   = "${escapeHclString(node.data.region)}"
  router                   = google_compute_router.${resourceName}_router.name
  type                     = "PARTNER"
  edge_availability_domain = "AVAILABILITY_DOMAIN_1"
}

# Router dedicado ao Interconnect — ajuste conforme seu parceiro/link.
resource "google_compute_router" "${resourceName}_router" {
  name    = "router-${escapeHclString(node.data.name)}"
  region  = "${escapeHclString(node.data.region)}"
  network = google_compute_network.${vpcResourceName}.id
}`);
  }

  for (const node of nodesOfKind(ctx, "peering")) {
    const vpcIds = ctx.graph.vpcForPeering.get(node.id) ?? [];
    if (vpcIds.length < 2) continue;

    const vpcA = ctx.document.nodes.find((n) => n.id === vpcIds[0] && n.kind === "vpc");
    const vpcB = ctx.document.nodes.find((n) => n.id === vpcIds[1] && n.kind === "vpc");
    if (!vpcA || vpcA.kind !== "vpc" || !vpcB || vpcB.kind !== "vpc") continue;

    const resourceName = ctx.getTfResourceName(node);
    const vpcAName = ctx.getTfResourceName(vpcA);
    const vpcBName = ctx.getTfResourceName(vpcB);

    blocks.push(`resource "google_compute_network_peering" "${resourceName}_a_to_b" {
  name         = "${escapeHclString(node.data.name)}-a-b"
  network      = google_compute_network.${vpcAName}.id
  peer_network = google_compute_network.${vpcBName}.id
}

resource "google_compute_network_peering" "${resourceName}_b_to_a" {
  name         = "${escapeHclString(node.data.name)}-b-a"
  network      = google_compute_network.${vpcBName}.id
  peer_network = google_compute_network.${vpcAName}.id
}`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
