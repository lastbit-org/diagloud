import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { exportDiagramImage } from "../../lib/diagramImageExport";
import {
  registerDiagramImageExporter,
  unregisterDiagramImageExporter,
} from "../../lib/diagramImageExportBridge";

/** Registra exportação PNG/SVG usando o React Flow ativo no canvas. */
export function DiagramImageExporter() {
  const { getNodes } = useReactFlow();

  useEffect(() => {
    registerDiagramImageExporter((format) => exportDiagramImage(getNodes(), format));
    return () => unregisterDiagramImageExporter();
  }, [getNodes]);

  return null;
}
