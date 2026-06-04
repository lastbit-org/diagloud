import { useMemo } from "react";
import { collectDiagramIssues } from "../model/validation";
import { useDiagramStore } from "../store/diagramStore";

export function useDiagramValidation() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);

  const issues = useMemo(
    () => collectDiagramIssues(nodes, edges),
    [nodes, edges],
  );

  const issuesByNode = useMemo(() => {
    const map = new Map<string, typeof issues>();
    for (const issue of issues) {
      const list = map.get(issue.nodeId);
      if (list) list.push(issue);
      else map.set(issue.nodeId, [issue]);
    }
    return map;
  }, [issues]);

  return { issues, issuesByNode, issueCount: issues.length };
}
