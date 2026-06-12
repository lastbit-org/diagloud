import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { ZoneColorId } from "../../lib/zoneColors";
import type { ZoneBorderStyle, ZoneBorderWidth } from "../../lib/zoneBorder";
import { NodeHandles } from "./NodeHandles";
import "./zones.css";

export type ZoneNodeData = {
  kind: "zone";
  label: string;
  colorId: ZoneColorId;
  borderWidth: ZoneBorderWidth;
  borderStyle: ZoneBorderStyle;
  width: number;
  height: number;
};

const DEFAULT_ZONE_LABEL = "Zona";

export function ZoneNode({ id, data, selected }: NodeProps) {
  const { label, colorId, borderWidth, borderStyle } = (data ?? {}) as ZoneNodeData;
  const displayName = label.trim() || DEFAULT_ZONE_LABEL;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        lineClassName="gcp-zone-resizer__line"
        handleClassName="gcp-zone-resizer__handle"
      />
      <div
        className={`gcp-zone gcp-zone--${colorId} gcp-zone--width-${borderWidth ?? "normal"} gcp-zone--style-${borderStyle ?? "solid"}${selected ? " gcp-zone--selected" : ""}`}
        aria-label={displayName}
      >
        <span className="gcp-zone__label">{displayName}</span>
      </div>
      <NodeHandles nodeId={id} />
    </>
  );
}
