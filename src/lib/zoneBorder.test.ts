import { describe, expect, it } from "vitest";
import {
  isZoneBorderStyle,
  isZoneBorderWidth,
  ZONE_BORDER_STYLES,
  ZONE_BORDER_WIDTHS,
} from "./zoneBorder";

describe("zoneBorder", () => {
  it("valida grossura e estilo de borda", () => {
    for (const width of ZONE_BORDER_WIDTHS) {
      expect(isZoneBorderWidth(width)).toBe(true);
    }
    for (const style of ZONE_BORDER_STYLES) {
      expect(isZoneBorderStyle(style)).toBe(true);
    }
    expect(isZoneBorderWidth("thick")).toBe(false);
    expect(isZoneBorderStyle("dotted")).toBe(false);
  });
});
