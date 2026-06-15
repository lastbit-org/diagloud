import { getUsableHostAddress, parseCidr } from "../lib/cidr";
import { getSubnetNode, getVmIdsOnSubnet } from "./subnet";
import type { DiagramEdge, DiagramNode } from "../types";

function getSqlIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "sql-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

function getGkeIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "gke-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

function getRunIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "run-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

function getWorkbenchIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter(
      (edge) => edge.kind === "workbench-subnet" && edge.target === subnetId,
    )
    .map((edge) => edge.source);
}

function getNotebookIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter(
      (edge) => edge.kind === "notebook-subnet" && edge.target === subnetId,
    )
    .map((edge) => edge.source);
}

function getPscIdsOnSubnet(subnetId: string, edges: DiagramEdge[]): string[] {
  return edges
    .filter((edge) => edge.kind === "psc-subnet" && edge.target === subnetId)
    .map((edge) => edge.source);
}

function getMemorystoreIdsOnSubnet(
  subnetId: string,
  edges: DiagramEdge[],
): string[] {
  return edges
    .filter(
      (edge) => edge.kind === "memorystore-subnet" && edge.target === subnetId,
    )
    .map((edge) => edge.source);
}

export type SubnetHostCounts = {
  vm: number;
  sql: number;
  gke: number;
  run: number;
  workbench: number;
  notebook: number;
  psc: number;
  memorystore: number;
};

export function countSubnetAttachedHosts(
  subnetId: string,
  edges: DiagramEdge[],
): SubnetHostCounts {
  return {
    vm: getVmIdsOnSubnet(subnetId, edges).length,
    sql: getSqlIdsOnSubnet(subnetId, edges).length,
    gke: getGkeIdsOnSubnet(subnetId, edges).length,
    run: getRunIdsOnSubnet(subnetId, edges).length,
    workbench: getWorkbenchIdsOnSubnet(subnetId, edges).length,
    notebook: getNotebookIdsOnSubnet(subnetId, edges).length,
    psc: getPscIdsOnSubnet(subnetId, edges).length,
    memorystore: getMemorystoreIdsOnSubnet(subnetId, edges).length,
  };
}

export function totalSubnetAttachedHosts(counts: SubnetHostCounts): number {
  return (
    counts.vm +
    counts.sql +
    counts.gke +
    counts.run +
    counts.workbench +
    counts.notebook +
    counts.psc +
    counts.memorystore
  );
}

/** Há IP disponível na sub-rede para mais um recurso (VM, SQL ou GKE). */
export function canAttachHostToSubnet(
  subnetId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): boolean {
  const subnet = getSubnetNode(subnetId, nodes);
  if (!subnet || !parseCidr(subnet.data.cidr)) return false;

  const total = totalSubnetAttachedHosts(
    countSubnetAttachedHosts(subnetId, edges),
  );
  return getUsableHostAddress(subnet.data.cidr, total) !== null;
}

export function sqlHostIndexOffset(subnetId: string, edges: DiagramEdge[]): number {
  return countSubnetAttachedHosts(subnetId, edges).vm;
}

export function gkeHostIndexOffset(subnetId: string, edges: DiagramEdge[]): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return counts.vm + counts.sql;
}

export function runHostIndexOffset(subnetId: string, edges: DiagramEdge[]): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return counts.vm + counts.sql + counts.gke;
}

export function workbenchHostIndexOffset(
  subnetId: string,
  edges: DiagramEdge[],
): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return counts.vm + counts.sql + counts.gke + counts.run;
}

export function notebookHostIndexOffset(
  subnetId: string,
  edges: DiagramEdge[],
): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return counts.vm + counts.sql + counts.gke + counts.run + counts.workbench;
}

export function pscHostIndexOffset(
  subnetId: string,
  edges: DiagramEdge[],
): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return (
    counts.vm +
    counts.sql +
    counts.gke +
    counts.run +
    counts.workbench +
    counts.notebook
  );
}

export function memorystoreHostIndexOffset(
  subnetId: string,
  edges: DiagramEdge[],
): number {
  const counts = countSubnetAttachedHosts(subnetId, edges);
  return (
    counts.vm +
    counts.sql +
    counts.gke +
    counts.run +
    counts.workbench +
    counts.notebook +
    counts.psc
  );
}
