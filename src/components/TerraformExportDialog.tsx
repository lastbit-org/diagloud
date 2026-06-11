import { useEffect, useMemo, useState } from "react";
import {
  combineTerraformFiles,
  generateTerraform,
  TerraformGenerateError,
} from "../model/terraform/generate";
import { downloadTerraformBundle } from "../lib/terraformExport";
import { useDiagramStore } from "../store/diagramStore";
import {
  DEFAULT_TERRAFORM_EXPORT_OPTIONS,
  type TerraformExportOptions,
  type TerraformExportResult,
} from "../types/terraform";
import "./terraform-export.css";
import "./panel/properties.css";

type TerraformExportDialogProps = {
  open: boolean;
  onClose: () => void;
};

function inferProjectId(nodes: ReturnType<typeof useDiagramStore.getState>["nodes"]): string {
  const projectNode = nodes.find((node) => node.kind === "project");
  if (projectNode?.kind === "project") {
    return projectNode.data.name.trim();
  }
  return "";
}

export function TerraformExportDialog({ open, onClose }: TerraformExportDialogProps) {
  const getDocument = useDiagramStore((s) => s.getDocument);
  const nodes = useDiagramStore((s) => s.nodes);

  const [options, setOptions] = useState<TerraformExportOptions>({
    ...DEFAULT_TERRAFORM_EXPORT_OPTIONS,
  });
  const [result, setResult] = useState<TerraformExportResult | null>(null);
  const [previewFile, setPreviewFile] = useState<string>("bundle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setPreviewFile("bundle");
    setOptions((current) => ({
      ...current,
      projectId: inferProjectId(nodes) || current.projectId,
    }));
  }, [open, nodes]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const previewContent = useMemo(() => {
    if (!result) return "";
    if (previewFile === "bundle") {
      return combineTerraformFiles(result.files);
    }
    return result.files[previewFile] ?? "";
  }, [previewFile, result]);

  if (!open) return null;

  const handleGenerate = () => {
    setError(null);
    try {
      const generated = generateTerraform(getDocument(), options);
      setResult(generated);
      setPreviewFile("bundle");
    } catch (err) {
      setResult(null);
      const message =
        err instanceof TerraformGenerateError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Não foi possível gerar Terraform.";
      setError(message);
    }
  };

  const handleDownload = () => {
    setError(null);
    try {
      const generated = result ?? generateTerraform(getDocument(), options);
      if (!result) {
        setResult(generated);
        setPreviewFile("bundle");
      }
      downloadTerraformBundle(generated, options.moduleName);
    } catch (err) {
      const message =
        err instanceof TerraformGenerateError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Não foi possível baixar o arquivo.";
      setError(message);
    }
  };

  const fileNames = result
    ? ["bundle", ...Object.keys(result.files)]
    : [];

  return (
    <div
      className="terraform-export__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="terraform-export__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terraform-export-title"
      >
        <header className="terraform-export__header">
          <h2 id="terraform-export-title" className="terraform-export__title">
            Gerar Terraform
          </h2>
          <button
            type="button"
            className="terraform-export__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="terraform-export__body">
          <p className="terraform-export__intro">
            Gera código HCL para todos os recursos GCP do diagrama (rede,
            computação, dados, integração, IA e organização). Recursos visuais
            (zona, infocard, internet, Entra, on-premises) são ignorados.
          </p>

          <div className="terraform-export__grid">
            <div className="properties-field">
              <label htmlFor="tf-project-id">ID do projeto GCP</label>
              <input
                id="tf-project-id"
                value={options.projectId}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }))
                }
                placeholder="meu-proj-dev"
                autoComplete="off"
              />
            </div>

            <div className="properties-field">
              <label htmlFor="tf-module-name">Nome do módulo</label>
              <input
                id="tf-module-name"
                value={options.moduleName}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    moduleName: event.target.value,
                  }))
                }
                placeholder="diagloud"
                autoComplete="off"
              />
            </div>

            <div className="properties-field">
              <label htmlFor="tf-default-region">Região padrão</label>
              <input
                id="tf-default-region"
                value={options.defaultRegion}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    defaultRegion: event.target.value,
                  }))
                }
                placeholder="southamerica-east1"
                autoComplete="off"
              />
            </div>

            <div className="properties-field">
              <label htmlFor="tf-provider-version">Versão do provider google</label>
              <input
                id="tf-provider-version"
                value={options.providerVersion}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    providerVersion: event.target.value,
                  }))
                }
                placeholder="~> 6.0"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="terraform-export__actions">
            <button
              type="button"
              className="terraform-export__btn terraform-export__btn--primary"
              onClick={handleGenerate}
            >
              Gerar preview
            </button>
            <button
              type="button"
              className="terraform-export__btn"
              onClick={handleDownload}
            >
              Baixar .tf
            </button>
            <button type="button" className="terraform-export__btn" onClick={onClose}>
              Cancelar
            </button>
          </div>

          {error && (
            <p className="terraform-export__feedback terraform-export__feedback--error" role="alert">
              {error}
            </p>
          )}

          {result && result.warnings.length > 0 && (
            <div className="terraform-export__warnings" role="status">
              <strong>Avisos</strong>
              <ul>
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div className="terraform-export__preview">
              <span className="terraform-export__preview-label">Preview</span>
              <div className="terraform-export__file-tabs" role="tablist">
                {fileNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={previewFile === name}
                    className={`terraform-export__file-tab${previewFile === name ? " terraform-export__file-tab--active" : ""}`}
                    onClick={() => setPreviewFile(name)}
                  >
                    {name === "bundle" ? "bundle (.tf)" : name}
                  </button>
                ))}
              </div>
              <pre className="terraform-export__preview-code">{previewContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
