export const EDGE_LINE_STYLES = ["solid", "dashed"] as const;
export type EdgeLineStyle = (typeof EDGE_LINE_STYLES)[number];

export const EDGE_LINE_STYLE_LABELS: Record<EdgeLineStyle, string> = {
  solid: "Sólida",
  dashed: "Tracejada",
};

export function isEdgeLineStyle(value: unknown): value is EdgeLineStyle {
  return value === "solid" || value === "dashed";
}

export function resolveEdgeLineStyle(
  lineStyle: EdgeLineStyle | undefined,
): EdgeLineStyle {
  return lineStyle === "dashed" ? "dashed" : "solid";
}
