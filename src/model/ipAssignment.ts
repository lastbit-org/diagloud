import { getUsableHostAddress } from "../lib/cidr";
import { getVmIdsOnSubnet } from "./subnet";
import type { DiagramEdge, DiagramNode, VmProps } from "../types";

/** Reatribui IPs de todas as VMs da sub-rede (índices 0…n-1, sem buracos). */
export function assignIpToVm(
  _vmId: string,
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  return reassignSubnetVmIps(subnetId, nodes, edges);
}

export function clearVmIp(vmId: string, nodes: DiagramNode[]): DiagramNode[] {
  return nodes.map((node) => {
    if (node.id !== vmId || node.kind !== "vm") return node;
    const data: VmProps = {
      name: node.data.name,
      machineType: node.data.machineType,
    };
    return { ...node, data };
  });
}

/** Reatribui IP e região das VMs ligadas à sub-rede. */
export function reassignSubnetVmIps(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): DiagramNode[] {
  const subnet = nodes.find((n) => n.id === subnetId && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return nodes;

  const vmIds = getVmIdsOnSubnet(subnetId, edges);
  let next = nodes;

  for (let i = 0; i < vmIds.length; i += 1) {
    const vmId = vmIds[i];
    const ip = getUsableHostAddress(subnet.data.cidr, i);
    if (!ip) {
      next = clearVmIp(vmId, next);
      continue;
    }
    next = next.map((node) => {
      if (node.id !== vmId || node.kind !== "vm") return node;
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

export function nextVmIpForSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string | null {
  const subnet = nodes.find((n) => n.id === subnetId && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return null;

  const vmCount = getVmIdsOnSubnet(subnetId, edges).length;
  return getUsableHostAddress(subnet.data.cidr, vmCount);
}
