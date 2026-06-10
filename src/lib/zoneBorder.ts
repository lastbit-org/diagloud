export const ZONE_BORDER_WIDTHS = ["normal", "thin"] as const;
export type ZoneBorderWidth = (typeof ZONE_BORDER_WIDTHS)[number];

export const ZONE_BORDER_STYLES = ["solid", "dashed"] as const;
export type ZoneBorderStyle = (typeof ZONE_BORDER_STYLES)[number];

export const ZONE_BORDER_WIDTH_LABELS: Record<ZoneBorderWidth, string> = {
  normal: "Normal",
  thin: "Fina",
};

export const ZONE_BORDER_STYLE_LABELS: Record<ZoneBorderStyle, string> = {
  solid: "Sólida",
  dashed: "Tracejada",
};

export function isZoneBorderWidth(value: string): value is ZoneBorderWidth {
  return (ZONE_BORDER_WIDTHS as readonly string[]).includes(value);
}

export function isZoneBorderStyle(value: string): value is ZoneBorderStyle {
  return (ZONE_BORDER_STYLES as readonly string[]).includes(value);
}
