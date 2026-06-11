import type { Connection, Edge, FinalConnectionState } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { connectionErrorMessage } from "../lib/connectionMessages";
import { connectionFromFinalState } from "../lib/connectionFromState";
import { explainConnectionFailure } from "../model/connections";
import type { DiagramEdge, DiagramNode } from "../types";

type ConnectionValidationContext = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export const REJECTED_EDGE_ID = "__rejected-connection__";
const REJECTED_EDGE_MS = 1400;
export const CONNECTION_FEEDBACK_MS = 3200;

export function useInvalidConnectionFeedback(context: ConnectionValidationContext) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rejectedEdge, setRejectedEdge] = useState<Edge | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const rejectTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (rejectTimerRef.current !== null) {
      window.clearTimeout(rejectTimerRef.current);
      rejectTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const showInvalidConnection = useCallback(
    (connection: Connection) => {
      const reason = explainConnectionFailure(connection, context);
      setToastMessage(connectionErrorMessage(reason));

      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
      }, CONNECTION_FEEDBACK_MS);

      if (!connection.source || !connection.target) return;

      setRejectedEdge({
        id: REJECTED_EDGE_ID,
        type: "smoothstep",
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        className: "edge-rejected",
        selectable: false,
        focusable: false,
        interactionWidth: 0,
      });

      if (rejectTimerRef.current !== null) {
        window.clearTimeout(rejectTimerRef.current);
      }
      rejectTimerRef.current = window.setTimeout(() => {
        setRejectedEdge(null);
        rejectTimerRef.current = null;
      }, REJECTED_EDGE_MS);
    },
    [context],
  );

  const handleInvalidConnectEnd = useCallback(
    (connectionState: FinalConnectionState) => {
      if (connectionState.isValid !== false) return;
      const connection = connectionFromFinalState(connectionState);
      if (!connection) return;
      showInvalidConnection(connection);
    },
    [showInvalidConnection],
  );

  return {
    toastMessage,
    rejectedEdge,
    showInvalidConnection,
    handleInvalidConnectEnd,
  };
}
