import { canonicalizeEdgeEndpoints } from "./connections";
import {
  subnetCidrErrorMessage,
  validateSubnetCidr,
} from "./subnet";
import type { DiagramEdge, DiagramNode } from "../types";

export type DiagramIssueCode =
  | "orphan-vm"
  | "orphan-gke"
  | "orphan-storage"
  | "orphan-sql-private"
  | "orphan-nat"
  | "orphan-router"
  | "orphan-vpn"
  | "orphan-interconnect"
  | "orphan-firewall"
  | "orphan-dns"
  | "orphan-peering"
  | "orphan-peering-incomplete"
  | "orphan-run-vpc"
  | "orphan-eventarc"
  | "subnet-without-vpc"
  | "subnet-invalid-cidr"
  | "subnet-cidr-overlap";

export type DiagramIssueSeverity = "error" | "warning";

export type DiagramIssue = {
  code: DiagramIssueCode;
  severity: DiagramIssueSeverity;
  nodeId: string;
  message: string;
};

export function collectDiagramIssues(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramIssue[] {
  const issues: DiagramIssue[] = [];

  const vmIdsOnSubnet = new Set(
    edges
      .filter((edge) => edge.kind === "vm-subnet")
      .map((edge) => edge.source),
  );

  const storageIdsOnVm = new Set(
    edges
      .filter((edge) => edge.kind === "vm-storage")
      .map((edge) => edge.target),
  );

  const sqlIdsOnSubnet = new Set(
    edges
      .filter((edge) => edge.kind === "sql-subnet")
      .map((edge) => edge.source),
  );

  const gkeIdsOnSubnet = new Set(
    edges
      .filter((edge) => edge.kind === "gke-subnet")
      .map((edge) => edge.source),
  );

  const natIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "nat-vpc")
      .map((edge) => edge.source),
  );

  const routerIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "router-vpc")
      .map((edge) => edge.source),
  );

  const vpnIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "vpn-vpc")
      .map((edge) => edge.source),
  );

  const interconnectIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "interconnect-vpc")
      .map((edge) => edge.source),
  );

  const firewallIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "firewall-vpc")
      .map((edge) => edge.source),
  );

  const dnsIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "dns-vpc")
      .map((edge) => {
        const { source } = canonicalizeEdgeEndpoints(edge, nodes);
        return source;
      }),
  );

  const peeringVpcCounts = new Map<string, number>();
  for (const edge of edges) {
    if (edge.kind !== "peering-vpc") continue;
    const { source } = canonicalizeEdgeEndpoints(edge, nodes);
    peeringVpcCounts.set(source, (peeringVpcCounts.get(source) ?? 0) + 1);
  }

  const runIdsOnSubnet = new Set(
    edges
      .filter((edge) => edge.kind === "run-subnet")
      .map((edge) => edge.source),
  );

  const eventarcIdsWithDestination = new Set(
    edges
      .filter(
        (edge) => edge.kind === "eventarc-run" || edge.kind === "eventarc-gke",
      )
      .map((edge) => edge.source),
  );

  for (const node of nodes) {
    if (node.kind === "vm" && !vmIdsOnSubnet.has(node.id)) {
      issues.push({
        code: "orphan-vm",
        severity: "error",
        nodeId: node.id,
        message: `VM "${node.data.name}" não está ligada a uma sub-rede.`,
      });
    }

    if (
      node.kind === "storage" &&
      node.data.accessMode === "vm" &&
      !storageIdsOnVm.has(node.id)
    ) {
      issues.push({
        code: "orphan-storage",
        severity: "warning",
        nodeId: node.id,
        message: `Bucket "${node.data.name}" está em modo VM mas não está ligado a nenhuma VM.`,
      });
    }

    if (node.kind === "gke" && !gkeIdsOnSubnet.has(node.id)) {
      issues.push({
        code: "orphan-gke",
        severity: "error",
        nodeId: node.id,
        message: `Cluster GKE "${node.data.name}" não está ligado a uma sub-rede.`,
      });
    }

    if (node.kind === "nat" && !natIdsOnVpc.has(node.id)) {
      issues.push({
        code: "orphan-nat",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud NAT "${node.data.name}" não está ligado a uma VPC.`,
      });
    }

    if (node.kind === "router" && !routerIdsOnVpc.has(node.id)) {
      issues.push({
        code: "orphan-router",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud Router "${node.data.name}" não está ligado a uma VPC.`,
      });
    }

    if (node.kind === "vpn" && !vpnIdsOnVpc.has(node.id)) {
      issues.push({
        code: "orphan-vpn",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud VPN "${node.data.name}" não está ligado a uma VPC.`,
      });
    }

    if (node.kind === "interconnect" && !interconnectIdsOnVpc.has(node.id)) {
      issues.push({
        code: "orphan-interconnect",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud Interconnect "${node.data.name}" não está ligado a uma VPC.`,
      });
    }

    if (node.kind === "firewall" && !firewallIdsOnVpc.has(node.id)) {
      issues.push({
        code: "orphan-firewall",
        severity: "warning",
        nodeId: node.id,
        message: `Firewall "${node.data.name}" não está ligado a uma VPC.`,
      });
    }

    if (
      node.kind === "dns" &&
      node.data.visibility === "private" &&
      !dnsIdsOnVpc.has(node.id)
    ) {
      issues.push({
        code: "orphan-dns",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud DNS "${node.data.name}" (privada) não está ligado a uma VPC.`,
      });
    }

    if (node.kind === "peering") {
      const vpcCount = peeringVpcCounts.get(node.id) ?? 0;
      if (vpcCount === 0) {
        issues.push({
          code: "orphan-peering",
          severity: "warning",
          nodeId: node.id,
          message: `VPC Peering "${node.data.name}" não está ligado a nenhuma VPC.`,
        });
      } else if (vpcCount === 1) {
        issues.push({
          code: "orphan-peering-incomplete",
          severity: "warning",
          nodeId: node.id,
          message: `VPC Peering "${node.data.name}" precisa ligar duas VPCs.`,
        });
      }
    }

    if (
      node.kind === "sql" &&
      node.data.accessMode === "private" &&
      !sqlIdsOnSubnet.has(node.id)
    ) {
      issues.push({
        code: "orphan-sql-private",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud SQL "${node.data.name}" está em modo privado mas não está ligado a uma sub-rede.`,
      });
    }

    if (
      node.kind === "run" &&
      node.data.accessMode === "vpc" &&
      !runIdsOnSubnet.has(node.id)
    ) {
      issues.push({
        code: "orphan-run-vpc",
        severity: "warning",
        nodeId: node.id,
        message: `Cloud Run "${node.data.name}" está em modo VPC mas não está ligado a uma sub-rede.`,
      });
    }

    if (node.kind === "eventarc" && !eventarcIdsWithDestination.has(node.id)) {
      issues.push({
        code: "orphan-eventarc",
        severity: "warning",
        nodeId: node.id,
        message: `Eventarc "${node.data.name}" não tem destino (Cloud Run ou GKE).`,
      });
    }
  }

  const subnetIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "subnet-vpc")
      .map((edge) => canonicalizeEdgeEndpoints(edge, nodes).source),
  );

  for (const node of nodes) {
    if (node.kind !== "subnet") continue;

    if (!subnetIdsOnVpc.has(node.id)) {
      issues.push({
        code: "subnet-without-vpc",
        severity: "error",
        nodeId: node.id,
        message: `Sub-rede "${node.data.name}" não está ligada a uma VPC.`,
      });
    }

    const cidrValidation = validateSubnetCidr(node.data.cidr, node.id, nodes);
    if (!cidrValidation.valid) {
      issues.push({
        code:
          cidrValidation.error === "invalid-format"
            ? "subnet-invalid-cidr"
            : "subnet-cidr-overlap",
        severity: "error",
        nodeId: node.id,
        message: subnetCidrErrorMessage(cidrValidation.error),
      });
    }
  }

  return issues;
}

export function issuesForNode(
  nodeId: string,
  issues: DiagramIssue[],
): DiagramIssue[] {
  return issues.filter((issue) => issue.nodeId === nodeId);
}

export function issueCountForNode(
  nodeId: string,
  issues: DiagramIssue[],
): number {
  return issuesForNode(nodeId, issues).length;
}

export function issuesByNodeId(
  issues: DiagramIssue[],
): Map<string, DiagramIssue[]> {
  const map = new Map<string, DiagramIssue[]>();
  for (const issue of issues) {
    const list = map.get(issue.nodeId);
    if (list) list.push(issue);
    else map.set(issue.nodeId, [issue]);
  }
  return map;
}
