import type { ResourceKind } from "../types";

export const ZONE_LINK_EDGE_KIND = "zone-link" as const;

const NON_LINKABLE_KINDS = new Set<ResourceKind>(["zone"]);

export function isZoneLinkable(kind: ResourceKind): boolean {
  return !NON_LINKABLE_KINDS.has(kind);
}

export function resolveZoneLinkKinds(
  from: ResourceKind,
  to: ResourceKind,
): { zone: "zone"; resource: ResourceKind } | null {
  if (from === "zone" && isZoneLinkable(to)) {
    return { zone: "zone", resource: to };
  }
  if (to === "zone" && isZoneLinkable(from)) {
    return { zone: "zone", resource: from };
  }
  return null;
}
