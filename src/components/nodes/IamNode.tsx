import type { NodeProps } from "@xyflow/react";
import { GCP_RESOURCE_ICONS } from "../../assets/gcpIcons";
import type { IamVariant } from "../../types";
import { NodeHandles } from "./NodeHandles";
import "./nodes.css";

export type IamNodeData = {
  kind: "iam";
  label: string;
  variant: IamVariant;
  serviceAccountEmail: string;
  workloadPoolId: string;
  workloadProviderId: string;
  groupEmail: string;
  issueCount?: number;
};

const VARIANT_TYPE_LABELS: Record<IamVariant, string> = {
  iam: "Conta de serviço",
  workload_identity: "Workload Identity",
  group: "Grupo",
};

function iamDetail(data: IamNodeData): string {
  switch (data.variant) {
    case "iam":
      return data.serviceAccountEmail.trim() || "sa@projeto.iam.gserviceaccount.com";
    case "workload_identity":
      if (data.workloadPoolId.trim() && data.workloadProviderId.trim()) {
        return `${data.workloadPoolId}/${data.workloadProviderId}`;
      }
      return data.workloadPoolId.trim() || "pool / provider";
    case "group":
      return data.groupEmail.trim() || "grupo@example.com";
  }
}

export function IamNode({ id, data, selected }: NodeProps) {
  const nodeData = (data ?? {}) as IamNodeData;
  const displayName = nodeData.label.trim() || "IAM";
  const typeLabel = VARIANT_TYPE_LABELS[nodeData.variant] ?? "IAM";
  const detail = iamDetail(nodeData);
  const hasIssues = (nodeData.issueCount ?? 0) > 0;

  return (
    <div
      className={`gcp-node${selected ? " gcp-node--selected" : ""}${hasIssues ? " gcp-node--has-issues" : ""}`}
      aria-selected={selected}
      aria-label={displayName}
      data-selected={selected ? "true" : undefined}
    >
      {hasIssues ? (
        <span
          className="gcp-node__badge"
          title={`${nodeData.issueCount} problema${nodeData.issueCount !== 1 ? "s" : ""} de validação`}
          aria-label={`${nodeData.issueCount} problemas`}
        >
          {nodeData.issueCount}
        </span>
      ) : null}
      <img
        className="gcp-node__icon"
        src={GCP_RESOURCE_ICONS.iam}
        alt=""
        width={32}
        height={32}
        draggable={false}
      />
      <div className="gcp-node__body">
        <span className="gcp-node__type">{typeLabel}</span>
        <span className="gcp-node__label">{displayName}</span>
        <span className="gcp-node__subtitle">{detail}</span>
      </div>
      <NodeHandles nodeId={id} />
    </div>
  );
}
