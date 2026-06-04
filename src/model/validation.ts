import {
  subnetCidrErrorMessage,
  validateSubnetCidr,
} from "./subnet";
import type { DiagramEdge, DiagramNode } from "../types";

export type DiagramIssueCode =
  | "orphan-vm"
  | "orphan-storage"
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
  }

  const subnetIdsOnVpc = new Set(
    edges
      .filter((edge) => edge.kind === "subnet-vpc")
      .map((edge) => edge.source),
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
