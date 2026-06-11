import {
  findNode,
  nodesOfKind,
  type TerraformGenContext,
} from "../context";
import { escapeHclString, sectionHeader, tfName } from "../hcl";
import type { DiagramEdge, DiagramNode } from "../../../types";

const IAM_BINDING_EDGE_KINDS = [
  "iam-project",
  "iam-subnet",
  "iam-kms",
  "iam-bigquery",
] as const;

type IamBindingEdgeKind = (typeof IAM_BINDING_EDGE_KINDS)[number];

function isIamBindingEdgeKind(
  kind: DiagramEdge["kind"],
): kind is IamBindingEdgeKind {
  return (IAM_BINDING_EDGE_KINDS as readonly string[]).includes(kind);
}

function normalizeRoles(roles: string[]): string[] {
  return roles.map((role) => role.trim()).filter(Boolean);
}

function roleResourceSuffix(role: string, index: number): string {
  const base = tfName(role.replace(/\//g, "_"));
  return base === "resource" ? `role_${index}` : base;
}

function iamMember(
  node: Extract<DiagramNode, { kind: "iam" }>,
  projectId: string,
): string {
  switch (node.data.variant) {
    case "iam":
      return `serviceAccount:${node.data.serviceAccountEmail.trim()}`;
    case "group":
      return `group:${node.data.groupEmail.trim()}`;
    case "workload_identity":
      return `principalSet://iam.googleapis.com/projects/${projectId}/locations/global/workloadIdentityPools/${node.data.workloadPoolId.trim()}/attribute.provider/${node.data.workloadProviderId.trim()}`;
    default:
      return `serviceAccount:${node.data.serviceAccountEmail.trim()}`;
  }
}

function bindingBlock(
  resourceType: string,
  resourceName: string,
  body: string,
): string {
  return `resource "${resourceType}" "${resourceName}" {
${body}
}`;
}

export function generateIamTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("IAM — roles e permissões")];

  for (const iamNode of nodesOfKind(ctx, "iam")) {
    const roles = normalizeRoles(iamNode.data.roles);
    if (roles.length === 0) continue;

    const iamTf = ctx.getTfResourceName(iamNode);
    const member = iamMember(iamNode, ctx.options.projectId);

    const outgoing = ctx.document.edges.filter(
      (edge) =>
        edge.source === iamNode.id && isIamBindingEdgeKind(edge.kind),
    );

    for (const edge of outgoing) {
      const targetNode = findNode(ctx.document.nodes, edge.target);
      if (!targetNode) continue;

      const targetTf = ctx.getTfResourceName(targetNode);

      for (let i = 0; i < roles.length; i += 1) {
        const role = roles[i]!;
        const roleTf = roleResourceSuffix(role, i);
        const resourceId = `${iamTf}_${targetTf}_${roleTf}`;

        switch (edge.kind) {
          case "iam-project":
            if (targetNode.kind !== "project") continue;
            blocks.push(
              bindingBlock(
                "google_project_iam_member",
                resourceId,
                `  project = google_project.${targetTf}.project_id
  role    = "${escapeHclString(role)}"
  member  = "${escapeHclString(member)}"`,
              ),
            );
            break;
          case "iam-bigquery":
            if (targetNode.kind !== "bigquery") continue;
            blocks.push(
              bindingBlock(
                "google_bigquery_dataset_iam_member",
                resourceId,
                `  dataset_id = google_bigquery_dataset.${targetTf}.dataset_id
  role       = "${escapeHclString(role)}"
  member     = "${escapeHclString(member)}"`,
              ),
            );
            break;
          case "iam-kms":
            if (targetNode.kind !== "kms") continue;
            blocks.push(
              bindingBlock(
                "google_kms_crypto_key_iam_member",
                resourceId,
                `  crypto_key_id = google_kms_crypto_key.${targetTf}_key.id
  role          = "${escapeHclString(role)}"
  member        = "${escapeHclString(member)}"`,
              ),
            );
            break;
          case "iam-subnet":
            if (targetNode.kind !== "subnet") continue;
            blocks.push(
              bindingBlock(
                "google_compute_subnetwork_iam_member",
                resourceId,
                `  subnetwork = google_compute_subnetwork.${targetTf}.name
  region     = "${escapeHclString(targetNode.data.region)}"
  role       = "${escapeHclString(role)}"
  member     = "${escapeHclString(member)}"`,
              ),
            );
            break;
        }
      }
    }
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
