import { getNodeDisplayName } from "../../lib/naming";
import type { DiagramNode } from "../../types";

export function tfName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return normalized || "resource";
}

export function uniqueTfResourceName(
  node: DiagramNode,
  used: Set<string>,
): string {
  const base = tfName(getNodeDisplayName(node));
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  const suffix = tfName(node.id.slice(-12));
  let candidate = `${base}_${suffix}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}_${suffix}_${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

export function escapeHclString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function defaultZone(region: string): string {
  return `${region}-a`;
}

export function hclBlock(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

export function sectionHeader(title: string): string {
  return `# ${title}\n`;
}
