import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { sqlHostIndexOffset } from "./subnetHosts";
import { getSubnetNode } from "./subnet";
import type { DiagramEdge, DiagramNode, SqlProps } from "../types";

export function getSqlIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "sql-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

export function clearSqlPrivateNetwork(
  sqlId: string,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== sqlId || node.kind !== "sql") return node;
    const data: SqlProps = {
      name: node.data.name,
      region: node.data.region,
      engine: node.data.engine,
      accessMode: node.data.accessMode,
    };
    return { ...node, data };
  });
}

/** IPs privados do Cloud SQL na sub-rede (índices após as VMs). */
export function reassignSubnetSqlIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) {
    return nodes;
  }

  const baseIndex = sqlHostIndexOffset(subnetId, edges);
  const sqlIds = getSqlIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < sqlIds.length; i += 1) {
    const sqlId = sqlIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, baseIndex + i);
    next = next.map((node) => {
      if (node.id !== sqlId || node.kind !== "sql") return node;
      if (!ip) {
        return clearSqlPrivateNetwork(sqlId, [node])[0]!;
      }
      return {
        ...node,
        data: {
          ...node.data,
          internalIp: ip,
          region: subnet.data.region,
        },
      };
    });
  }

  return next;
}

export function canAttachSqlToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const baseIndex = sqlHostIndexOffset(subnetId, edges);
  const sqlCount = getSqlIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, baseIndex + sqlCount) !== null;
}

export function getSubnetIdForSql(
  sqlId: string,
  edges: DiagramEdge[],
): string | null {
  const edge = edges.find(
    (e) => e.kind === "sql-subnet" && e.source === sqlId,
  );
  return edge?.target ?? null;
}

/** Converte aresta legada `sql-vpc` → `sql-subnet` (sub-rede primária da VPC). */
export function migrateSqlVpcEdge(
  edge: DiagramEdge,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramEdge | null {
  if ((edge as { kind: string }).kind !== "sql-vpc") return edge;

  const subnetIds = edges
    .filter((e) => e.kind === "subnet-vpc" && e.target === edge.target)
    .map((e) => e.source)
    .sort();

  for (const subnetId of subnetIds) {
    const subnet = nodes.find((n) => n.id === subnetId && n.kind === "subnet");
    if (subnet?.kind === "subnet" && parseCidr(subnet.data.cidr)) {
      return { ...edge, kind: "sql-subnet", target: subnetId };
    }
  }
  return null;
}
