import type { NodeProps } from "@xyflow/react";
import { GCP_RESOURCE_ICONS } from "../../assets/gcpIcons";
import { NodeHandles } from "./NodeHandles";
import "./nodes.css";

export type AzDoPipelineNodeData = {
  kind: "azdopipeline";
  label: string;
  issueCount?: number;
};

export function AzDoPipelineNode({ id, data, selected }: NodeProps) {
  const { label, issueCount } = (data ?? {}) as AzDoPipelineNodeData;
  const displayName = label.trim() || "pipeline";
  const hasIssues = (issueCount ?? 0) > 0;

  return (
    <div
      className={`gcp-node gcp-node--compact gcp-node--azdopipeline${selected ? " gcp-node--selected" : ""}${hasIssues ? " gcp-node--has-issues" : ""}`}
      aria-selected={selected}
      aria-label={displayName}
      data-selected={selected ? "true" : undefined}
    >
      {hasIssues ? (
        <span
          className="gcp-node__badge"
          title={`${issueCount} problema${issueCount !== 1 ? "s" : ""} de validação`}
          aria-label={`${issueCount} problemas`}
        >
          {issueCount}
        </span>
      ) : null}
      <img
        className="gcp-node__icon"
        src={GCP_RESOURCE_ICONS.azdopipeline}
        alt=""
        width={32}
        height={32}
        draggable={false}
      />
      <div className="gcp-node__body">
        <span className="gcp-node__label">{displayName}</span>
      </div>
      <NodeHandles nodeId={id} />
    </div>
  );
}
