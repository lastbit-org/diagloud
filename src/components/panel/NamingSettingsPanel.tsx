import { GCP_RESOURCE_LABELS } from "../../assets/gcpIcons";
import { previewResourceName } from "../../lib/naming";
import { useDiagramStore } from "../../store/diagramStore";
import { useNamingStore } from "../../store/namingStore";
import { NAMING_TOKEN_HINTS } from "../../types/naming";
import type { ResourceKind } from "../../types";

const RESOURCE_ORDER: ResourceKind[] = [
  "vpc",
  "subnet",
  "internet",
  "nat",
  "router",
  "peering",
  "vpn",
  "interconnect",
  "firewall",
  "vm",
  "gke",
  "run",
  "storage",
  "sql",
  "bigquery",
  "spanner",
  "firestore",
  "workbench",
  "spark",
  "airflow",
  "dataflow",
  "modelregistry",
  "pubsub",
  "eventarc",
  "artifact",
  "build",
  "kms",
  "entra",
  "pcuser",
  "onprem",
  "infocard",
  "zone",
  "folder",
  "project",
];

export function NamingSettingsPanel() {
  const nodes = useDiagramStore((s) => s.nodes);
  const area = useNamingStore((s) => s.area);
  const ambiente = useNamingStore((s) => s.ambiente);
  const patterns = useNamingStore((s) => s.patterns);
  const isActive = useNamingStore((s) => s.isActive);
  const setArea = useNamingStore((s) => s.setArea);
  const setAmbiente = useNamingStore((s) => s.setAmbiente);
  const setPattern = useNamingStore((s) => s.setPattern);
  const saveAndActivate = useNamingStore((s) => s.saveAndActivate);
  const resetToDefaults = useNamingStore((s) => s.resetToDefaults);

  const placeholders = { area, ambiente };

  return (
    <div className="naming-settings">
      <p className="naming-settings__intro">
        Defina o padrão de nomes para novos recursos. Após salvar, cada recurso
        criado no diagrama usará essa nomenclatura.
      </p>

      {isActive && (
        <p className="naming-settings__status" role="status">
          Nomenclatura ativa — novos recursos seguem os padrões abaixo.
        </p>
      )}

      <div className="properties-field">
        <label htmlFor="naming-area">Área (AREA)</label>
        <input
          id="naming-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="financeiro"
        />
      </div>

      <div className="properties-field">
        <label htmlFor="naming-ambiente">Ambiente (AMBIENTE)</label>
        <input
          id="naming-ambiente"
          value={ambiente}
          onChange={(e) => setAmbiente(e.target.value)}
          placeholder="prd"
        />
      </div>

      {RESOURCE_ORDER.map((kind) => (
        <div key={kind} className="properties-field">
          <label htmlFor={`naming-pattern-${kind}`}>
            {GCP_RESOURCE_LABELS[kind]}
          </label>
          <input
            id={`naming-pattern-${kind}`}
            value={patterns[kind]}
            onChange={(e) => setPattern(kind, e.target.value)}
            spellCheck={false}
          />
          <span className="properties-field__hint naming-settings__preview">
            Próximo:{" "}
            <code>
              {previewResourceName(kind, patterns, placeholders, nodes)}
            </code>
          </span>
        </div>
      ))}

      <section className="naming-settings__tokens" aria-label="Tokens disponíveis">
        <h3 className="naming-settings__tokens-title">Tokens</h3>
        <ul className="naming-settings__token-list">
          {NAMING_TOKEN_HINTS.map(({ token, description }) => (
            <li key={token}>
              <code>{token}</code> — {description}
            </li>
          ))}
        </ul>
      </section>

      <div className="naming-settings__actions">
        <button
          type="button"
          className="naming-settings__btn naming-settings__btn--primary"
          onClick={saveAndActivate}
        >
          Salvar nomenclatura
        </button>
        <button
          type="button"
          className="naming-settings__btn"
          onClick={resetToDefaults}
        >
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
