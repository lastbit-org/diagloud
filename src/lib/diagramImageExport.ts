import { toPng, toSvg } from "html-to-image";
import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import type { Node } from "@xyflow/react";

export type DiagramImageFormat = "png" | "svg";

export class DiagramImageExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagramImageExportError";
  }
}

const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;
const EXPORT_PADDING = 0.12;

function getDiagramViewportElement(): HTMLElement {
  const el = document.querySelector(
    ".diagram-canvas .react-flow__viewport",
  ) as HTMLElement | null;
  if (!el) {
    throw new DiagramImageExportError("Canvas do diagrama não encontrado.");
  }
  return el;
}

function getExportBackgroundColor(): string {
  const canvas = document.querySelector(".diagram-canvas");
  if (!canvas) return "#ffffff";
  const bg = getComputedStyle(canvas).backgroundColor;
  return bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#ffffff";
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = window.document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function exportFilename(format: DiagramImageFormat): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `diagloud-${stamp}.${format}`;
}

function captureOptions(
  nodes: Node[],
  backgroundColor: string,
): {
  backgroundColor: string;
  width: number;
  height: number;
  style: Record<string, string>;
  filter: (domNode: HTMLElement) => boolean;
} {
  const bounds = getNodesBounds(nodes);
  const viewport = getViewportForBounds(
    bounds,
    EXPORT_WIDTH,
    EXPORT_HEIGHT,
    0.25,
    2,
    EXPORT_PADDING,
  );

  return {
    backgroundColor,
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    style: {
      width: `${EXPORT_WIDTH}px`,
      height: `${EXPORT_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
    filter: (domNode) => {
      if (!(domNode instanceof HTMLElement)) return true;
      if (domNode.classList.contains("react-flow__controls")) return false;
      if (domNode.classList.contains("react-flow__panel")) return false;
      if (domNode.classList.contains("connection-feedback")) return false;
      return true;
    },
  };
}

export async function exportDiagramImage(
  nodes: Node[],
  format: DiagramImageFormat,
): Promise<void> {
  if (nodes.length === 0) {
    throw new DiagramImageExportError(
      "Adicione recursos ao diagrama antes de exportar a imagem.",
    );
  }

  const viewportEl = getDiagramViewportElement();
  const backgroundColor = getExportBackgroundColor();
  const options = captureOptions(nodes, backgroundColor);

  const canvas = document.querySelector(".diagram-canvas");
  canvas?.classList.add("diagram-canvas--exporting");

  try {
    if (format === "png") {
      const dataUrl = await toPng(viewportEl, options);
      downloadDataUrl(dataUrl, exportFilename("png"));
      return;
    }

    const dataUrl = await toSvg(viewportEl, options);
    downloadDataUrl(dataUrl, exportFilename("svg"));
  } finally {
    canvas?.classList.remove("diagram-canvas--exporting");
  }
}
