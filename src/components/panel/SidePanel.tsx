import { useState } from "react";
import { useDiagramValidation } from "../../hooks/useDiagramValidation";
import { NamingSettingsPanel } from "./NamingSettingsPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { ValidationPanel } from "./ValidationPanel";
import "./side-panel.css";

type SidePanelTab = "properties" | "naming" | "validation";

export function SidePanel() {
  const [tab, setTab] = useState<SidePanelTab>("properties");
  const { issueCount } = useDiagramValidation();

  return (
    <aside className="side-panel" aria-label="Painel lateral">
      <div className="side-panel__tabs" role="tablist" aria-label="Abas do painel">
        <button
          type="button"
          role="tab"
          id="side-tab-properties"
          aria-selected={tab === "properties"}
          aria-controls="side-panel-properties"
          className={`side-panel__tab${tab === "properties" ? " side-panel__tab--active" : ""}`}
          onClick={() => setTab("properties")}
        >
          Propriedades
        </button>
        <button
          type="button"
          role="tab"
          id="side-tab-naming"
          aria-selected={tab === "naming"}
          aria-controls="side-panel-naming"
          className={`side-panel__tab${tab === "naming" ? " side-panel__tab--active" : ""}`}
          onClick={() => setTab("naming")}
        >
          Nomenclatura
        </button>
        <button
          type="button"
          role="tab"
          id="side-tab-validation"
          aria-selected={tab === "validation"}
          aria-controls="side-panel-validation"
          className={`side-panel__tab${tab === "validation" ? " side-panel__tab--active" : ""}${issueCount > 0 ? " side-panel__tab--alert" : ""}`}
          onClick={() => setTab("validation")}
        >
          Validação
          {issueCount > 0 ? (
            <span className="side-panel__tab-badge" aria-label={`${issueCount} problemas`}>
              {issueCount}
            </span>
          ) : null}
        </button>
      </div>

      <div
        id="side-panel-properties"
        role="tabpanel"
        aria-labelledby="side-tab-properties"
        hidden={tab !== "properties"}
        className="side-panel__panel"
      >
        {tab === "properties" && <PropertiesPanel embedded />}
      </div>

      <div
        id="side-panel-naming"
        role="tabpanel"
        aria-labelledby="side-tab-naming"
        hidden={tab !== "naming"}
        className="side-panel__panel"
      >
        {tab === "naming" && (
          <>
            <h2 className="properties-panel__title">Nomenclatura padrão</h2>
            <NamingSettingsPanel />
          </>
        )}
      </div>

      <div
        id="side-panel-validation"
        role="tabpanel"
        aria-labelledby="side-tab-validation"
        hidden={tab !== "validation"}
        className="side-panel__panel"
      >
        {tab === "validation" && (
          <>
            <h2 className="properties-panel__title">Validação</h2>
            <ValidationPanel />
          </>
        )}
      </div>
    </aside>
  );
}
