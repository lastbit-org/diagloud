import { useRef, useState } from "react";
import {
  DiagramParseError,
  downloadDiagramDocument,
  parseDiagramDocument,
} from "../lib/diagramDocument";
import { useDiagramStore } from "../store/diagramStore";
import "./document-actions.css";

export function DocumentActions() {
  const getDocument = useDiagramStore((s) => s.getDocument);
  const loadDocument = useDiagramStore((s) => s.loadDocument);
  const reset = useDiagramStore((s) => s.reset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2800);
  };

  const handleExport = () => {
    downloadDiagramDocument(getDocument());
    showFeedback("Diagrama exportado como JSON.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const document = parseDiagramDocument(text);
      loadDocument(document);
      showFeedback("Diagrama carregado com sucesso.");
    } catch (error) {
      const message =
        error instanceof DiagramParseError
          ? error.message
          : "Não foi possível carregar o arquivo.";
      showFeedback(message);
    }
  };

  const handleNew = () => {
    if (
      useDiagramStore.getState().nodes.length > 0 &&
      !window.confirm("Limpar o diagrama atual? Alterações não exportadas serão perdidas.")
    ) {
      return;
    }
    reset();
    showFeedback("Diagrama limpo.");
  };

  return (
    <div className="document-actions">
      <button type="button" className="document-actions__btn" onClick={handleExport}>
        Exportar JSON
      </button>
      <button
        type="button"
        className="document-actions__btn"
        onClick={handleImportClick}
      >
        Importar JSON
      </button>
      <button type="button" className="document-actions__btn" onClick={handleNew}>
        Novo
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="document-actions__file-input"
        onChange={handleFileChange}
        aria-hidden
        tabIndex={-1}
      />
      {feedback && (
        <span className="document-actions__feedback" role="status">
          {feedback}
        </span>
      )}
    </div>
  );
}
