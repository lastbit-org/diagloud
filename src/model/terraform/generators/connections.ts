import { getNodeDisplayName } from "../../../lib/naming";
import type { TerraformGenContext } from "../context";
import { sectionHeader } from "../hcl";

const SKIPPED_CONNECTION_KINDS = new Set([
  "infocard-link",
  "zone-link",
  "internet-nat",
  "internet-vpn",
  "internet-interconnect",
  "pcuser-entra",
  "pcuser-vm",
  "pcuser-run",
  "pcuser-onprem",
  "entra-vm",
  "entra-run",
  "entra-gke",
  "onprem-entra",
  "onprem-vpn",
  "onprem-interconnect",
  "onprem-vm",
]);

export function generateConnectionsTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [
    sectionHeader(
      "Ligações do diagrama (referência — configure IAM e eventos manualmente)",
    ),
  ];

  for (const edge of ctx.document.edges) {
    if (SKIPPED_CONNECTION_KINDS.has(edge.kind)) continue;

    const sourceNode = ctx.document.nodes.find((n) => n.id === edge.source);
    const targetNode = ctx.document.nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) continue;

    const sourceName = getNodeDisplayName(sourceNode);
    const targetName = getNodeDisplayName(targetNode);

    blocks.push(
      `# ${edge.kind}: ${sourceNode.kind} "${sourceName}" → ${targetNode.kind} "${targetName}"`,
    );
  }

  return blocks.length > 1 ? blocks.join("\n") : "";
}
