import {
  DIAGRAM_STORAGE_KEY,
  parseDiagramDocument,
  serializeDiagramDocument,
} from "./diagramDocument";
import { useDiagramStore } from "../store/diagramStore";

export { DIAGRAM_STORAGE_KEY };

export function saveDiagramToLocalStorage(): void {
  const document = useDiagramStore.getState().getDocument();
  localStorage.setItem(DIAGRAM_STORAGE_KEY, serializeDiagramDocument(document));
}

/** Restaura o diagrama do localStorage. Retorna false se não houver dados válidos. */
export function loadDiagramFromLocalStorage(): boolean {
  const raw = localStorage.getItem(DIAGRAM_STORAGE_KEY);
  if (!raw) return false;

  try {
    const document = parseDiagramDocument(raw);
    useDiagramStore.getState().loadDocument(document);
    return true;
  } catch {
    localStorage.removeItem(DIAGRAM_STORAGE_KEY);
    return false;
  }
}

export function clearDiagramLocalStorage(): void {
  localStorage.removeItem(DIAGRAM_STORAGE_KEY);
}

export function hasDiagramInLocalStorage(): boolean {
  return localStorage.getItem(DIAGRAM_STORAGE_KEY) !== null;
}
