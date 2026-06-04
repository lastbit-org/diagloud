import type { NodeProps } from "@xyflow/react";
import {
  GCP_RESOURCE_ICONS,
  GCP_RESOURCE_LABELS,
} from "../../assets/gcpIcons";
import type { ResourceKind } from "../../types";
import { NodeHandles } from "./NodeHandles";
import "./nodes.css";

export type GcpNodeData = {
  kind: ResourceKind;
  label: string;
  subtitle?: string;
};

type BaseNodeProps = NodeProps & {
  kind: ResourceKind;
};

export function BaseNode({ data, selected, kind }: BaseNodeProps) {
  const { label, subtitle } = (data ?? {}) as GcpNodeData;
  const iconSrc = GCP_RESOURCE_ICONS[kind];
  const typeLabel = GCP_RESOURCE_LABELS[kind];

  return (
    <div
      className={`gcp-node${selected ? " gcp-node--selected" : ""}`}
      aria-selected={selected}
      data-selected={selected ? "true" : undefined}
    >
      <img
        className="gcp-node__icon"
        src={iconSrc}
        alt=""
        width={32}
        height={32}
        draggable={false}
      />
      <div className="gcp-node__body">
        <span className="gcp-node__type">{typeLabel}</span>
        <span className="gcp-node__label">{label || typeLabel}</span>
        {subtitle ? (
          <span className="gcp-node__subtitle">{subtitle}</span>
        ) : null}
      </div>
      <NodeHandles kind={kind} />
    </div>
  );
}
