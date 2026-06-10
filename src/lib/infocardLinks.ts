import type { ResourceKind } from "../types";

export const INFOCARD_LINK_EDGE_KIND = "infocard-link" as const;

const NON_LINKABLE_KINDS = new Set<ResourceKind>(["zone", "infocard"]);

export function isInfocardLinkable(kind: ResourceKind): boolean {
  return !NON_LINKABLE_KINDS.has(kind);
}

export function resolveInfocardLinkKinds(
  from: ResourceKind,
  to: ResourceKind,
): { infocard: "infocard"; other: ResourceKind } | null {
  if (from === "infocard" && isInfocardLinkable(to)) {
    return { infocard: "infocard", other: to };
  }
  if (to === "infocard" && isInfocardLinkable(from)) {
    return { infocard: "infocard", other: from };
  }
  return null;
}
