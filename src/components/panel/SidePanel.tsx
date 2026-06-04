import { useState } from "react";
import { NamingSettingsPanel } from "./NamingSettingsPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import "./side-panel.css";

type SidePanelTab = "properties" | "naming";

export function SidePanel() {
  const [tab, setTab] = useState<SidePanelTab>("properties");

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
    </aside>
  );
}
