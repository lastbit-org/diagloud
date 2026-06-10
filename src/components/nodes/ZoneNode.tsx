import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { ZoneColorId } from "../../lib/zoneColors";
import type { ZonePurpose } from "../../types";
import "./zones.css";

export type ZoneNodeData = {
  kind: "zone";
  label: string;
  purpose: ZonePurpose;
  colorId: ZoneColorId;
  width: number;
  height: number;
};

export const ZONE_PURPOSE_LABELS: Record<ZonePurpose, string> = {
  project: "Projeto",
  "vpc-area": "Área VPC",
  perimeter: "Perímetro",
};

export function ZoneNode({ data, selected }: NodeProps) {
  const { label, purpose, colorId } = (data ?? {}) as ZoneNodeData;
  const displayName = label || ZONE_PURPOSE_LABELS[purpose];

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
        className={`gcp-zone gcp-zone--${colorId}${selected ? " gcp-zone--selected" : ""}`}
        aria-label={displayName}
      >
        <span className="gcp-zone__label">{displayName}</span>
      </div>
    </>
  );
}
