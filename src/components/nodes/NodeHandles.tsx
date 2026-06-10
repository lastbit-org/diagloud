import { Handle } from "@xyflow/react";
import { useMemo } from "react";
import {
  countOnSide,
  getVisibleHandlesForNode,
  handleStyle,
  sideToPosition,
} from "../../lib/dynamicHandles";
import { useDiagramStore } from "../../store/diagramStore";

type NodeHandlesProps = {
  nodeId: string;
};

export function NodeHandles({ nodeId }: NodeHandlesProps) {
  const edges = useDiagramStore((s) => s.edges);

  const handles = useMemo(
    () => getVisibleHandlesForNode(nodeId, edges),
    [nodeId, edges],
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
