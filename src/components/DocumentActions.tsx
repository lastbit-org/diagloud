import { useEffect, useRef, useState } from "react";
import {
  DiagramParseError,
  downloadDiagramDocument,
  parseDiagramDocument,
} from "../lib/diagramDocument";
import {
  DiagramImageExportError,
} from "../lib/diagramImageExport";
import { requestDiagramImageExport } from "../lib/diagramImageExportBridge";
import { saveDiagramToLocalStorage } from "../lib/diagramPersistence";
import { useDiagramStore } from "../store/diagramStore";
import { TerraformExportDialog } from "./TerraformExportDialog";
import "./document-actions.css";

type ExportKind = "json" | "png" | "svg";

export function DocumentActions() {
  const getDocument = useDiagramStore((s) => s.getDocument);
  const loadDocument = useDiagramStore((s) => s.loadDocument);
  const reset = useDiagramStore((s) => s.reset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [terraformOpen, setTerraformOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);

  useEffect(() => {
    if (!exportOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [exportOpen]);

  const showFeedback = (message: string, isError = false) => {
    setFeedback(message);
    setFeedbackIsError(isError);
    window.setTimeout(() => {
      setFeedback(null);
      setFeedbackIsError(false);
    }, 2800);
  };

  const handleExport = async (kind: ExportKind) => {
    setExportOpen(false);

    try {
      if (kind === "json") {
        downloadDiagramDocument(getDocument());
        showFeedback("Diagrama exportado como JSON.");
        return;
      }

      await requestDiagramImageExport(kind);
      showFeedback(
        kind === "png"
          ? "Imagem PNG exportada para documentação."
          : "Imagem SVG exportada para documentação.",
      );
    } catch (error) {
      const message =
        error instanceof DiagramParseError ||
        error instanceof DiagramImageExportError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Não foi possível exportar.";
      showFeedback(message, true);
    }
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
      showFeedback("Diagrama importado com sucesso.");
    } catch (error) {
      const message =
        error instanceof DiagramParseError
          ? error.message
          : "Não foi possível carregar o arquivo.";
      showFeedback(message, true);
    }
  };

  const handleNew = () => {
    if (
      useDiagramStore.getState().nodes.length > 0 &&
      !window.confirm(
        "Limpar o diagrama atual? Alterações não exportadas serão perdidas.",
      )
    ) {
      return;
    }
    reset();
    saveDiagramToLocalStorage();
    showFeedback("Diagrama limpo.");
  };

  return (
    <div className="document-actions">
      <div className="document-actions__export" ref={exportMenuRef}>
        <button
          type="button"
          className="document-actions__btn document-actions__btn--split"
          onClick={() => setExportOpen((open) => !open)}
          aria-expanded={exportOpen}
          aria-haspopup="menu"
          title="Exportar diagrama (JSON, PNG ou SVG)"
        >
          Exportar
          <span className="document-actions__caret" aria-hidden>
            ▾
          </span>
        </button>
        {exportOpen && (
          <ul className="document-actions__menu" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="document-actions__menu-item"
                onClick={() => handleExport("json")}
              >
                JSON
                <span className="document-actions__menu-hint">
                  Dados editáveis / reimportar
                </span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="document-actions__menu-item"
                onClick={() => handleExport("png")}
              >
                PNG
                <span className="document-actions__menu-hint">
                  Imagem para documentação
                </span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="document-actions__menu-item"
                onClick={() => handleExport("svg")}
              >
                SVG
                <span className="document-actions__menu-hint">
                  Vetor escalável
                </span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="document-actions__menu-item"
                onClick={() => {
                  setExportOpen(false);
                  setTerraformOpen(true);
                }}
              >
                Terraform
                <span className="document-actions__menu-hint">
                  Código HCL para provisionar
                </span>
              </button>
            </li>
          </ul>
        )}
      </div>

      <TerraformExportDialog
        open={terraformOpen}
        onClose={() => setTerraformOpen(false)}
      />

      <button
        type="button"
        className="document-actions__btn"
        onClick={handleImportClick}
        title="Carregar diagrama de um arquivo .json"
        aria-label="Importar diagrama de arquivo JSON"
      >
        Importar
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
        aria-label="Selecionar arquivo JSON do diagrama"
        tabIndex={-1}
      />
      {feedback && (
        <span
          className={`document-actions__feedback${feedbackIsError ? " document-actions__feedback--error" : ""}`}
          role={feedbackIsError ? "alert" : "status"}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
