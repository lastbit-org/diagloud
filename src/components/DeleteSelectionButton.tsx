import { useSelection } from "../hooks/useSelection";
import { useDiagramStore } from "../store/diagramStore";

export function DeleteSelectionButton() {
  const { hasSelection } = useSelection();
  const deleteSelection = useDiagramStore((state) => state.deleteSelection);

  return (
    <button
      type="button"
      className="delete-selection"
      disabled={!hasSelection}
      onClick={deleteSelection}
      aria-label="Excluir seleção"
      title="Excluir (Delete)"
    >
      Excluir
    </button>
  );
}
