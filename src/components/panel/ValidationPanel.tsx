import { GCP_RESOURCE_LABELS } from "../../assets/gcpIcons";
import { useDiagramValidation } from "../../hooks/useDiagramValidation";
import { useDiagramStore } from "../../store/diagramStore";
import type { DiagramIssue } from "../../model/validation";
import type { DiagramNode } from "../../types";

function nodeLabel(node: DiagramNode | undefined, nodeId: string): string {
  if (!node) return nodeId;
  return `${GCP_RESOURCE_LABELS[node.kind]}: ${node.data.name}`;
}

function IssueRow({
  issue,
  label,
  onSelect,
}: {
  issue: DiagramIssue;
  label: string;
  onSelect: () => void;
}) {
  return (
    <li className="validation-panel__item">
      <button
        type="button"
        className="validation-panel__item-btn"
        onClick={onSelect}
      >
        <span className="validation-panel__item-label">{label}</span>
        <span className="validation-panel__item-message">{issue.message}</span>
      </button>
    </li>
  );
}

export function ValidationPanel() {
  const { issues, issueCount } = useDiagramValidation();
  const nodes = useDiagramStore((s) => s.nodes);
  const selectNode = useDiagramStore((s) => s.selectNode);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="validation-panel">
      {issueCount === 0 ? (
        <p className="validation-panel__ok" role="status">
          Nenhum problema encontrado no diagrama.
        </p>
      ) : (
        <>
          <p className="validation-panel__summary" role="status">
            {issueCount} problema{issueCount !== 1 ? "s" : ""} encontrado
            {issueCount !== 1 ? "s" : ""}. Clique para ir ao recurso.
          </p>
          <ul className="validation-panel__list">
            {issues.map((issue) => (
              <IssueRow
                key={`${issue.nodeId}-${issue.code}`}
                issue={issue}
                label={nodeLabel(nodeById.get(issue.nodeId), issue.nodeId)}
                onSelect={() => selectNode(issue.nodeId)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
