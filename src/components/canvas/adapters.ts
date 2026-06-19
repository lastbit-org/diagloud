import type { Edge, Node } from "@xyflow/react";
import { issueCountForNode, type DiagramIssue } from "../../model/validation";
import { resolveEdgeHandles } from "../../lib/dynamicHandles";
import { resolveEdgeLineStyle } from "../../lib/edgeLineStyle";
import type { DiagramEdge, DiagramNode } from "../../types";
import { GCP_RESOURCE_LABELS } from "../../assets/gcpIcons";
import { resolveNodeZIndex } from "../../lib/nodeLayers";
import type {
  FolderNodeData,
  GcpNodeData,
  GithubNodeData,
  IamNodeData,
  FirewallNodeData,
  InfocardNodeData,
  ProjectNodeData,
  ZoneNodeData,
} from "../nodes";

function nodeSubtitle(node: DiagramNode): string | undefined {
  if (node.kind === "zone") {
    return undefined;
  }
  if (
    (node.kind === "vm" ||
      node.kind === "gke" ||
      node.kind === "run" ||
      node.kind === "workbench" ||
      node.kind === "notebook") &&
    node.data.internalIp
  ) {
    return node.data.internalIp;
  }
  if (node.kind === "run") {
    if (node.data.internalIp) {
      return node.data.internalIp;
    }
    if (node.data.sourceType === "github") {
      return "GitHub";
    }
    if (node.data.sourceType === "function") {
      return "Function";
    }
    if (node.data.accessMode === "public") {
      return "Imagem Docker";
    }
    return "VPC connector";
  }
  if (node.kind === "pubsub") {
    return "Tópico";
  }
  if (node.kind === "subnet") {
    return node.data.cidr;
  }
  if (node.kind === "storage") {
    if (node.data.accessMode === "public") {
      return "Público / CLI";
    }
    return node.data.location;
  }
  if (node.kind === "sql") {
    if (node.data.accessMode === "public") {
      return "IP público";
    }
    if (node.data.internalIp) {
      return node.data.internalIp;
    }
    return "Privado (sub-rede)";
  }
  if (node.kind === "nat" || node.kind === "router" || node.kind === "vpn" || node.kind === "interconnect") {
    return node.data.region;
  }
  if (node.kind === "peering") {
    return "Peering";
  }
  if (node.kind === "firewall") {
    return node.data.direction === "ingress" ? "Entrada" : "Saída";
  }
  if (node.kind === "dns") {
    return node.data.dnsName.trim() || "example.com.";
  }
  if (node.kind === "artifact") {
    return `${node.data.format} · ${node.data.location}`;
  }
  if (node.kind === "internet") {
    return "Rede pública";
  }
  if (
    node.kind === "bigquery" ||
    node.kind === "firestore" ||
    node.kind === "bigtable" ||
    node.kind === "eventarc" ||
    node.kind === "build" ||
    node.kind === "kms"
  ) {
    return node.data.location;
  }
  if (node.kind === "firebase") {
    return node.data.projectId;
  }
  if (node.kind === "spanner") {
    return node.data.config;
  }
  if (node.kind === "spark") {
    if (node.data.deployMode === "serverless") {
      return "Serverless";
    }
    return node.data.region;
  }
  if (node.kind === "airflow") {
    return node.data.region;
  }
  if (node.kind === "notebook") {
    return node.data.region;
  }
  if (node.kind === "dataflow") {
    return node.data.pipelineType === "streaming" ? "Streaming" : node.data.region;
  }
  if (node.kind === "modelregistry" || node.kind === "tuning" || node.kind === "evaluation" || node.kind === "endpoints" || node.kind === "batchinference") {
    return node.data.location;
  }
  if (node.kind === "loadbalancer") {
    return node.data.type === "internal" ? "Interno" : node.data.region;
  }
  if (node.kind === "cdn") {
    return node.data.region;
  }
  if (node.kind === "orgpolicy") {
    return undefined;
  }
  if (node.kind === "psc") {
    return node.data.internalIp ?? node.data.region;
  }
  if (node.kind === "secretmanager") {
    return node.data.location;
  }
  if (node.kind === "certificatemanager") {
    return node.data.certificateType === "managed" ? "Gerenciado" : "Próprio";
  }
  if (node.kind === "apigee") {
    return node.data.envType === "hybrid" ? "Hybrid" : node.data.region;
  }
  if (node.kind === "memorystore") {
    return node.data.engine === "redis" ? "Redis" : "Memcached";
  }
  if (node.kind === "alloydb") {
    return node.data.region;
  }
  if (node.kind === "onprem") {
    return node.data.location;
  }
  if (node.kind === "pcuser") {
    return "Usuário";
  }
  if (node.kind === "cloudshell") {
    return "Console GCP";
  }
  return undefined;
}

export function toFlowNode(
  node: DiagramNode,
  selected = false,
  issues: DiagramIssue[] = [],
): Node<
  GcpNodeData | ZoneNodeData | InfocardNodeData | FolderNodeData | ProjectNodeData | GithubNodeData | IamNodeData | FirewallNodeData
> {
  if (node.kind === "zone") {
    return {
      id: node.id,
      type: "zone",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      connectable: true,
      data: {
        kind: "zone",
        label: node.data.name,
        colorId: node.data.colorId,
        borderWidth: node.data.borderWidth,
        borderStyle: node.data.borderStyle,
        width: node.data.width,
        height: node.data.height,
      },
      style: {
        width: node.data.width,
        height: node.data.height,
      },
    };
  }

  if (node.kind === "folder") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "folder",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "folder",
        label: node.data.name,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "project") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "project",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "project",
        label: node.data.name,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "infocard") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "infocard",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "infocard",
        caption: node.data.caption,
        title: node.data.title,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "github") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "github",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "github",
        label: node.data.repository,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "iam") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "iam",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "iam",
        label: node.data.name,
        variant: node.data.variant,
        serviceAccountEmail: node.data.serviceAccountEmail,
        workloadPoolId: node.data.workloadPoolId,
        workloadProviderId: node.data.workloadProviderId,
        groupEmail: node.data.groupEmail,
        roles: node.data.roles,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "firewall") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "firewall",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "firewall",
        label: node.data.name,
        showDetails: node.data.showDetails,
        direction: node.data.direction,
        action: node.data.action,
        source: node.data.source,
        destination: node.data.destination,
        protocols: node.data.protocols,
        subtitle: node.data.showDetails
          ? undefined
          : node.data.direction === "ingress"
            ? "Entrada"
            : "Saída",
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "orgpolicy") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "orgpolicy",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      data: {
        kind: "orgpolicy",
        label: GCP_RESOURCE_LABELS.orgpolicy,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  if (node.kind === "monitoring") {
    const issueCount = issueCountForNode(node.id, issues);
    return {
      id: node.id,
      type: "monitoring",
      position: node.position,
      selected,
      zIndex: resolveNodeZIndex(node),
      connectable: false,
      data: {
        kind: "monitoring",
        label: node.data.name,
        issueCount: issueCount > 0 ? issueCount : undefined,
      },
    };
  }

  const issueCount = issueCountForNode(node.id, issues);
  return {
    id: node.id,
    type: node.kind,
    position: node.position,
    selected,
    zIndex: resolveNodeZIndex(node),
    data: {
      kind: node.kind,
      label: node.data.name,
      subtitle: nodeSubtitle(node),
      issueCount: issueCount > 0 ? issueCount : undefined,
    },
  };
}

export function toFlowEdge(edge: DiagramEdge, selected = false): Edge {
  const { sourceHandle, targetHandle } = resolveEdgeHandles(edge);
  const lineStyle = resolveEdgeLineStyle(edge.lineStyle);
  return {
    id: edge.id,
    type: "smoothstep",
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    selected,
    className:
      lineStyle === "dashed" ? "gcp-edge gcp-edge--dashed" : "gcp-edge",
  };
}
