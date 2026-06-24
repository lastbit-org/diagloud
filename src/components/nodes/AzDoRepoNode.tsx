import type { NodeProps } from "@xyflow/react";
import { GCP_RESOURCE_ICONS } from "../../assets/gcpIcons";
import { NodeHandles } from "./NodeHandles";
import "./nodes.css";

export type AzDoRepoNodeData = {
  kind: "azdorepo";
  label: string;
  issueCount?: number;
};

export function AzDoRepoNode({ id, data, selected }: NodeProps) {
  const { label, issueCount } = (data ?? {}) as AzDoRepoNodeData;
  const displayName = label.trim() || "projeto/repositorio";
  const hasIssues = (issueCount ?? 0) > 0;

  return (
    <div
      className={`gcp-node gcp-node--compact gcp-node--azdorepo${selected ? " gcp-node--selected" : ""}${hasIssues ? " gcp-node--has-issues" : ""}`}
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
        src={GCP_RESOURCE_ICONS.azdorepo}
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
