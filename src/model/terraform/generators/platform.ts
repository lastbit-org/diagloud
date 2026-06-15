import { findNode, kmsKeyReference, nodesOfKind, type TerraformGenContext } from "../context";
import { escapeHclString, sectionHeader } from "../hcl";

const ARTIFACT_FORMAT_MAP = {
  DOCKER: "DOCKER",
  MAVEN: "MAVEN",
  NPM: "NPM",
} as const;

export function generatePlatformTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("Plataforma e integração")];

  for (const node of nodesOfKind(ctx, "artifact")) {
    const resourceName = ctx.getTfResourceName(node);
    const repoId = tfRepoId(node.data.name);

    blocks.push(`resource "google_artifact_registry_repository" "${resourceName}" {
  location      = "${escapeHclString(node.data.location)}"
  repository_id = "${escapeHclString(repoId)}"
  format        = "${ARTIFACT_FORMAT_MAP[node.data.format]}"
  description   = "Gerado pelo Diagloud"
}`);
  }

  for (const node of nodesOfKind(ctx, "kms")) {
    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_kms_key_ring" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(node.data.location)}"
}

resource "google_kms_crypto_key" "${resourceName}_key" {
  name     = "${escapeHclString(node.data.name)}-key"
  key_ring = google_kms_key_ring.${resourceName}.id

  rotation_period = "7776000s"
}`);
  }

  for (const node of nodesOfKind(ctx, "secretmanager")) {
    const resourceName = ctx.getTfResourceName(node);
    const kmsRef = kmsKeyReference(ctx, node.id);
    const replication = kmsRef
      ? `
  replication {
    user_managed {
      replicas {
        location = "${escapeHclString(node.data.location)}"
        customer_managed_encryption {
          kms_key_name = ${kmsRef}
        }
      }
    }
  }`
      : `
  replication {
    auto {}
  }`;

    blocks.push(`resource "google_secret_manager_secret" "${resourceName}" {
  secret_id = "${escapeHclString(node.data.name)}"${replication}
}`);
  }

  for (const node of nodesOfKind(ctx, "certificatemanager")) {
    const resourceName = ctx.getTfResourceName(node);
    const dnsId = ctx.graph.dnsForCertificateManager.get(node.id);
    const dnsNode = dnsId ? findNode(ctx.document.nodes, dnsId) : undefined;

    if (node.data.certificateType === "managed") {
      const dnsAuthBlock =
        dnsNode?.kind === "dns"
          ? `
  # Autorização DNS via zona "${escapeHclString(dnsNode.data.name)}"`
          : "";

      blocks.push(`resource "google_certificate_manager_certificate" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(node.data.location)}"${dnsAuthBlock}

  managed {
    domains = ["example.com"]
  }
}`);
    } else {
      blocks.push(`resource "google_certificate_manager_certificate" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(node.data.location)}"

  # Certificado próprio — configure self_managed { pem_certificate, pem_private_key }
}`);
    }
  }

  for (const node of nodesOfKind(ctx, "pubsub")) {
    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_pubsub_topic" "${resourceName}" {
  name = "${escapeHclString(node.data.name)}"
}`);
  }

  for (const node of nodesOfKind(ctx, "eventarc")) {
    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_eventarc_trigger" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(node.data.location)}"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  destination {
    workflow = "projects/\${var.project_id}/locations/${escapeHclString(node.data.location)}/workflows/placeholder"
  }

  # Ajuste matching_criteria e destination conforme ligações Pub/Sub, Storage, Run ou GKE no diagrama.
}`);
  }

  for (const node of nodesOfKind(ctx, "build")) {
    const resourceName = ctx.getTfResourceName(node);
    const githubEdge = ctx.document.edges.find(
      (edge) => edge.kind === "github-build" && edge.target === node.id,
    );
    const githubNode = githubEdge
      ? ctx.document.nodes.find(
          (n) => n.id === githubEdge.source && n.kind === "github",
        )
      : undefined;
    const { owner, name } =
      githubNode && githubNode.kind === "github"
        ? parseGithubRepository(githubNode.data.repository)
        : { owner: "your-org", name: "your-repo" };

    blocks.push(`resource "google_cloudbuild_trigger" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(node.data.location)}"

  github {
    owner = "${escapeHclString(owner)}"
    name  = "${escapeHclString(name)}"
    push {
      branch = "^main$"
    }
  }

  filename = "cloudbuild.yaml"
}`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}

function tfRepoId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "repo";
}

function parseGithubRepository(repository: string): {
  owner: string;
  name: string;
} {
  const trimmed = repository.trim();
  const slash = trimmed.indexOf("/");
  if (slash > 0) {
    return {
      owner: trimmed.slice(0, slash),
      name: trimmed.slice(slash + 1),
    };
  }
  return { owner: "your-org", name: trimmed || "your-repo" };
}
