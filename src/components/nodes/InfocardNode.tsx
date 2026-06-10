import type { NodeProps } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import "./infocard.css";

export type InfocardNodeData = {
  kind: "infocard";
  caption: string;
  title: string;
  issueCount?: number;
};

export function InfocardNode({ id, data, selected }: NodeProps) {
  const { caption, title, issueCount } = (data ?? {}) as InfocardNodeData;
  const hasIssues = (issueCount ?? 0) > 0;

  return (
    <div
      className={`gcp-infocard${selected ? " gcp-infocard--selected" : ""}${hasIssues ? " gcp-infocard--has-issues" : ""}`}
      aria-selected={selected}
    >
      {hasIssues ? (
        <span className="gcp-infocard__badge" aria-label={`${issueCount} problemas`}>
          {issueCount}
        </span>
      ) : null}
      <div className="gcp-infocard__body">
        <span className="gcp-infocard__caption">
          {caption.trim() || "Legenda"}
        </span>
        <span className="gcp-infocard__title">{title.trim() || "Título"}</span>
      </div>
      <NodeHandles nodeId={id} />
    </div>
  );
}
