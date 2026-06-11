import type { ResolvedGraph } from "../hierarchy";
import { uniqueTfResourceName } from "./hcl";
import type { DiagramDocument, DiagramNode } from "../../types";
import type { TerraformExportOptions } from "../../types/terraform";

export type TerraformGenContext = {
  document: DiagramDocument;
  graph: ResolvedGraph;
  options: TerraformExportOptions;
  getTfResourceName: (node: DiagramNode) => string;
  defaultRegion: string;
};

export function createTerraformGenContext(
  document: DiagramDocument,
  graph: ResolvedGraph,
  options: TerraformExportOptions,
): TerraformGenContext {
  const usedNames = new Set<string>();
  const tfNamesByNodeId = new Map<string, string>();

  const getTfResourceName = (node: DiagramNode): string => {
    const existing = tfNamesByNodeId.get(node.id);
    if (existing) return existing;
    const name = uniqueTfResourceName(node, usedNames);
    tfNamesByNodeId.set(node.id, name);
    return name;
  };

  return {
    document,
    graph,
    options,
    getTfResourceName,
    defaultRegion: options.defaultRegion,
  };
}

export function findNode(
  nodes: DiagramNode[],
  id: string,
): DiagramNode | undefined {
  return nodes.find((node) => node.id === id);
}

export function nodesOfKind<K extends DiagramNode["kind"]>(
  ctx: TerraformGenContext,
  kind: K,
): Extract<DiagramNode, { kind: K }>[] {
  return ctx.document.nodes.filter(
    (node): node is Extract<DiagramNode, { kind: K }> => node.kind === kind,
  );
}

export function vpcNodeForSubnet(
  ctx: TerraformGenContext,
  subnetId: string,
): { vpc: Extract<DiagramNode, { kind: "vpc" }>; subnet: Extract<DiagramNode, { kind: "subnet" }> } | undefined {
  const subnetNode = findNode(ctx.document.nodes, subnetId);
  if (!subnetNode || subnetNode.kind !== "subnet") return undefined;

  const vpcId = ctx.graph.vpcForSubnet.get(subnetId);
  if (!vpcId) return undefined;

  const vpcNode = findNode(ctx.document.nodes, vpcId);
  if (!vpcNode || vpcNode.kind !== "vpc") return undefined;

  return { vpc: vpcNode, subnet: subnetNode };
}

export function regionFromSubnet(
  ctx: TerraformGenContext,
  subnetId: string,
): string | undefined {
  const subnetNode = findNode(ctx.document.nodes, subnetId);
  if (!subnetNode || subnetNode.kind !== "subnet") return undefined;
  return subnetNode.data.region;
}

export function kmsKeyReference(
  ctx: TerraformGenContext,
  nodeId: string,
): string | undefined {
  const kmsId = ctx.graph.kmsForNode.get(nodeId);
  if (!kmsId) return undefined;
  const kmsNode = findNode(ctx.document.nodes, kmsId);
  if (!kmsNode || kmsNode.kind !== "kms") return undefined;
  const keyRing = ctx.getTfResourceName(kmsNode);
  return `google_kms_crypto_key.${keyRing}_key.id`;
}
