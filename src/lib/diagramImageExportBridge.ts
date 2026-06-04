import type { DiagramImageFormat } from "./diagramImageExport";

export type DiagramImageExporter = (
  format: DiagramImageFormat,
) => Promise<void>;

let exporter: DiagramImageExporter | null = null;

export function registerDiagramImageExporter(handler: DiagramImageExporter): void {
  exporter = handler;
}

export function unregisterDiagramImageExporter(): void {
  exporter = null;
}

export function isDiagramImageExporterReady(): boolean {
  return exporter !== null;
}

export async function requestDiagramImageExport(
  format: DiagramImageFormat,
): Promise<void> {
  if (!exporter) {
    throw new Error("O canvas ainda não está pronto para exportar imagens.");
  }
  return exporter(format);
}
