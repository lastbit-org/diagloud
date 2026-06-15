import type { NodeProps } from "@xyflow/react";
import { GCP_RESOURCE_ICONS, GCP_RESOURCE_LABELS } from "../../assets/gcpIcons";
import type { FirewallAction, FirewallDirection } from "../../types";
import { BaseNode } from "./BaseNode";
import { NodeHandles } from "./NodeHandles";
import "./nodes.css";

export type FirewallNodeData = {
  kind: "firewall";
  label: string;
  showDetails: boolean;
  direction: FirewallDirection;
  action: FirewallAction;
  source: string;
  destination: string;
  protocols: string;
  issueCount?: number;
};

function compactValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function formatDirection(direction: FirewallDirection): string {
  return direction === "ingress" ? "ingress" : "egress";
}

function formatAction(action: FirewallAction): string {
  return action === "deny" ? "deny" : "allow";
}

export function FirewallNode(props: NodeProps) {
  const nodeData = (props.data ?? {}) as FirewallNodeData;

  if (!nodeData.showDetails) {
    return <BaseNode {...props} kind="firewall" />;
  }

  const displayName = nodeData.label.trim() || GCP_RESOURCE_LABELS.firewall;
  const hasIssues = (nodeData.issueCount ?? 0) > 0;
  const source = compactValue(nodeData.source, "—");
  const destination = compactValue(nodeData.destination, "—");
  const protocols = compactValue(nodeData.protocols, "—");

  return (
    <div
      className={`gcp-node gcp-node--compact gcp-node--firewall-detail${props.selected ? " gcp-node--selected" : ""}${hasIssues ? " gcp-node--has-issues" : ""}`}
      aria-selected={props.selected}
      aria-label={displayName}
      data-selected={props.selected ? "true" : undefined}
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
        className="gcp-node__icon gcp-node__icon--compact"
        src={GCP_RESOURCE_ICONS.firewall}
        alt=""
        width={24}
        height={24}
        draggable={false}
      />
      <div className="gcp-node__body gcp-node__body--firewall-detail">
        <span className="gcp-node__label gcp-node__label--compact">{displayName}</span>
        <span className="gcp-firewall-detail__summary">
          {formatDirection(nodeData.direction)} · {formatAction(nodeData.action)}
        </span>
        <span className="gcp-firewall-detail__row">
          <span className="gcp-firewall-detail__key">src</span>
          <span className="gcp-firewall-detail__value">{source}</span>
        </span>
        <span className="gcp-firewall-detail__row">
          <span className="gcp-firewall-detail__key">dst</span>
          <span className="gcp-firewall-detail__value">{destination}</span>
        </span>
        <span className="gcp-firewall-detail__row">
          <span className="gcp-firewall-detail__key">proto</span>
          <span className="gcp-firewall-detail__value">{protocols}</span>
        </span>
      </div>
      <NodeHandles nodeId={props.id} />
    </div>
  );
}
