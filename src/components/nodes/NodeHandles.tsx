import { Handle } from "@xyflow/react";
import { useMemo } from "react";
import {
  countOnSide,
  getVisibleHandlesForNode,
  handleStyle,
  sideToPosition,
} from "../../lib/dynamicHandles";

type NodeHandlesProps = {
  nodeId: string;
};

export function NodeHandles({ nodeId }: NodeHandlesProps) {
  const handles = useMemo(
    () => getVisibleHandlesForNode(nodeId, []),
    [nodeId],
  );

  return (
    <>
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type="source"
          position={sideToPosition(handle.side)}
          id={handle.id}
          className="gcp-handle"
          isConnectableStart
          isConnectableEnd
          style={handleStyle(
            handle.side,
            handle.index,
            countOnSide(handles, handle.side),
          )}
          title="Conectar recurso"
        />
      ))}
    </>
  );
}
