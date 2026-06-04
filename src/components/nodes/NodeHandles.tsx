import { Handle, Position } from "@xyflow/react";
import { HANDLE_IDS } from "../../lib/handles";
import type { ResourceKind } from "../../types";

type NodeHandlesProps = {
  kind: ResourceKind;
};

export function NodeHandles({ kind }: NodeHandlesProps) {
  switch (kind) {
    case "vpc":
      return (
        <Handle
          type="target"
          position={Position.Bottom}
          id={HANDLE_IDS.vpc.in}
          className="gcp-handle gcp-handle--target"
          title="Recebe sub-rede"
        />
      );
    case "subnet":
      return (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id={HANDLE_IDS.subnet.toVpc}
            className="gcp-handle gcp-handle--source"
            title="Conectar à VPC"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id={HANDLE_IDS.subnet.fromVm}
            className="gcp-handle gcp-handle--target"
            title="Recebe VM"
          />
          <Handle
            type="target"
            position={Position.Left}
            id={HANDLE_IDS.subnet.fromSql}
            className="gcp-handle gcp-handle--target"
            title="Recebe Cloud SQL (IP privado)"
          />
        </>
      );
    case "vm":
      return (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id={HANDLE_IDS.vm.toSubnet}
            className="gcp-handle gcp-handle--source"
            title="Conectar à sub-rede"
          />
          <Handle
            type="source"
            position={Position.Right}
            id={HANDLE_IDS.vm.toStorage}
            className="gcp-handle gcp-handle--source"
            title="Conectar ao Cloud Storage"
          />
        </>
      );
    case "storage":
      return (
        <Handle
          type="target"
          position={Position.Left}
          id={HANDLE_IDS.storage.fromVm}
          className="gcp-handle gcp-handle--target"
          title="Recebe VM"
        />
      );
    case "sql":
      return (
        <Handle
          type="source"
          position={Position.Top}
          id={HANDLE_IDS.sql.toSubnet}
          className="gcp-handle gcp-handle--source"
          title="Conectar à sub-rede (modo privado)"
        />
      );
  }
}
