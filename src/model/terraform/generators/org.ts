import { findNode, nodesOfKind, type TerraformGenContext } from "../context";
import { escapeHclString, sectionHeader } from "../hcl";

export function generateOrgTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("Organização")];

  for (const node of nodesOfKind(ctx, "folder")) {
    const resourceName = ctx.getTfResourceName(node);
    const parentFolderId = ctx.graph.parentFolderForFolder.get(node.id);
    const parentFolderNode = parentFolderId
      ? findNode(ctx.document.nodes, parentFolderId)
      : undefined;
    const parent =
      parentFolderNode?.kind === "folder"
        ? `google_folder.${ctx.getTfResourceName(parentFolderNode)}.name`
        : "var.organization_id";

    blocks.push(`resource "google_folder" "${resourceName}" {
  display_name = "${escapeHclString(node.data.name)}"
  parent       = ${parent}
}`);
  }

  for (const node of nodesOfKind(ctx, "project")) {
    const resourceName = ctx.getTfResourceName(node);
    const parentFolderId = ctx.graph.parentFolderForProject.get(node.id);
    const parentFolderNode = parentFolderId
      ? findNode(ctx.document.nodes, parentFolderId)
      : undefined;
    const folderBlock =
      parentFolderNode?.kind === "folder"
        ? `\n  folder_id = google_folder.${ctx.getTfResourceName(parentFolderNode)}.name`
        : "";

    blocks.push(`resource "google_project" "${resourceName}" {
  name       = "${escapeHclString(node.data.name)}"
  project_id = "${escapeHclString(node.data.name)}"${folderBlock}
}`);
  }

  for (const node of nodesOfKind(ctx, "orgpolicy")) {
    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_org_policy_policy" "${resourceName}" {
  # Organization Policy — configure constraint e regras conforme necessidade
  name   = "organizations/\${var.organization_id}/policies/placeholder"
  parent = "organizations/\${var.organization_id}"

  spec {
    rules {
      enforce = true
    }
  }
}`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
