import { useReactFlow } from "@xyflow/react";
import type { DragEvent } from "react";
import { placementOffset } from "../../lib/placement";
import { useDiagramStore } from "../../store/diagramStore";
import { PALETTE_DRAG_MIME, type PaletteItemConfig } from "./paletteItems";

type PaletteItemProps = {
  item: PaletteItemConfig;
};

export function PaletteItem({ item }: PaletteItemProps) {
  const addNode = useDiagramStore((state) => state.addNode);
  const nodeCount = useDiagramStore((state) => state.nodes.length);
  const { screenToFlowPosition } = useReactFlow();

  const addAtViewportCenter = () => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const offset = placementOffset(nodeCount);
    addNode(item.kind, {
      x: center.x + offset.x,
      y: center.y + offset.y,
    });
  };

  const onDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(PALETTE_DRAG_MIME, item.kind);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <li>
      <button
        type="button"
        className="palette-item"
        draggable
        onDragStart={onDragStart}
        onClick={addAtViewportCenter}
        aria-label={`Adicionar ${item.label}`}
      >
        <img
          className="palette-item__icon"
          src={item.icon}
          alt=""
          width={28}
          height={28}
          draggable={false}
        />
        <div className="palette-item__text">
          <span className="palette-item__label">{item.label}</span>
          <span className="palette-item__description">{item.description}</span>
        </div>
      </button>
    </li>
  );
}
