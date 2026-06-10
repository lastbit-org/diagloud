import { ReactFlowProvider } from "@xyflow/react";
import { DocumentActions } from "./components/DocumentActions";
import { ThemeControls } from "./components/ThemeControls";
import { DeleteSelectionButton } from "./components/DeleteSelectionButton";
import { DiagramCanvas } from "./components/canvas/DiagramCanvas";
import { SidePanel } from "./components/panel/SidePanel";
import { Palette } from "./components/palette/Palette";
import { useDiagramPersistence } from "./hooks/useDiagramPersistence";
import { useSelectedNode } from "./hooks/useSelectedNode";
import { useDiagramStore } from "./store/diagramStore";
import { GCP_RESOURCE_LABELS } from "./assets/gcpIcons";
import "./App.css";

function AppContent() {
  useDiagramPersistence();
  const nodes = useDiagramStore((state) => state.nodes);
  const selectedNode = useSelectedNode();

  const selectionLabel = selectedNode
    ? `${GCP_RESOURCE_LABELS[selectedNode.kind]}: ${selectedNode.data.name}`
    : "Nenhum nó selecionado";

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-start">
          <h1 className="app__title">Diagloud</h1>
          <span
            className={`app__selection${selectedNode ? " app__selection--active" : ""}`}
          >
            {selectionLabel}
          </span>
          <DeleteSelectionButton />
          <DocumentActions />
        </div>
        <div className="app__header-end">
          <span className="app__meta">{nodes.length} nó(s)</span>
          <ThemeControls />
        </div>
      </header>
      <div className="app__body">
        <Palette />
        <main className="app__main">
          <DiagramCanvas />
        </main>
        <SidePanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}
