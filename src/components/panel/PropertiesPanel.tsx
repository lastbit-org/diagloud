import { useEffect, useState } from "react";
import { maxVmsForCidr } from "../../lib/cidr";
import { resolveNodeZIndex } from "../../lib/nodeLayers";
import {
  isWorkbenchMachineType,
  WORKBENCH_MACHINE_TYPES,
} from "../../lib/workbenchMachineTypes";
import { ZONE_COLOR_OPTIONS, type ZoneColorId } from "../../lib/zoneColors";
import {
  ZONE_BORDER_STYLE_LABELS,
  ZONE_BORDER_STYLES,
  ZONE_BORDER_WIDTH_LABELS,
  ZONE_BORDER_WIDTHS,
  type ZoneBorderStyle,
  type ZoneBorderWidth,
} from "../../lib/zoneBorder";
import { useSelectedNode } from "../../hooks/useSelectedNode";
import {
  countVmsOnSubnet,
  getVmIdsOnSubnet,
  subnetCidrErrorMessage,
  validateSubnetCidr,
} from "../../model/subnet";
import { getNodeDisplayName } from "../../lib/naming";
import { useDiagramStore } from "../../store/diagramStore";
import type {
  ArtifactFormat,
  DiagramNode,
  RunAccessMode,
  SqlAccessMode,
  SqlEngine,
  FirewallDirection,
  StorageAccessMode,
  StorageClass,
  SparkDeployMode,
  DataflowPipelineType,
  IamVariant,
} from "../../types";
import "./properties.css";

function SubnetCidrEditor({
  subnet,
  allSubnets,
}: {
  subnet: Extract<DiagramNode, { kind: "subnet" }>;
  allSubnets: Extract<DiagramNode, { kind: "subnet" }>[];
}) {
  const setSubnetCidr = useDiagramStore((s) => s.setSubnetCidr);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const edges = useDiagramStore((s) => s.edges);
  const nodes = useDiagramStore((s) => s.nodes);

  const [cidrInput, setCidrInput] = useState(subnet.data.cidr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCidrInput(subnet.data.cidr);
    setError(null);
  }, [subnet.id, subnet.data.cidr]);

  const vmCount = countVmsOnSubnet(subnet.id, edges);
  const maxVms = maxVmsForCidr(subnet.data.cidr);

  const applyCidr = () => {
    const validation = validateSubnetCidr(cidrInput, subnet.id, nodes);
    if (!validation.valid) {
      setError(subnetCidrErrorMessage(validation.error));
      return;
    }
    const ok = setSubnetCidr(subnet.id, validation.normalized);
    if (!ok) {
      setError(subnetCidrErrorMessage("overlaps-existing"));
      return;
    }
    setError(null);
  };

  return (
    <>
      <div className="properties-field">
        <label htmlFor="subnet-cidr">CIDR</label>
        <input
          id="subnet-cidr"
          value={cidrInput}
          onChange={(e) => setCidrInput(e.target.value)}
          onBlur={applyCidr}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyCidr();
          }}
          placeholder="10.0.0.0/24"
        />
        {error ? (
          <span className="properties-field__error">{error}</span>
        ) : (
          <span className="properties-field__hint">
            Formato: 10.0.0.0/24. Não pode sobrepor outra sub-rede.
          </span>
        )}
      </div>

      <dl className="properties-stats">
        <dt>Capacidade de VMs</dt>
        <dd>
          {vmCount} / {maxVms} (reservados GCP: rede, gateway, DNS, futuro +
          broadcast)
        </dd>
        <dt>Primeiro IP de VM</dt>
        <dd>Quarto endereço do bloco (índice +4)</dd>
      </dl>

      <SubnetList
        subnets={allSubnets}
        selectedId={subnet.id}
        onSelect={selectNode}
      />
    </>
  );
}

function SubnetList({
  subnets,
  selectedId,
  onSelect,
}: {
  subnets: Extract<DiagramNode, { kind: "subnet" }>[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const nodes = useDiagramStore((s) => s.nodes);
  const setSubnetCidr = useDiagramStore((s) => s.setSubnetCidr);

  if (subnets.length === 0) return null;

  return (
    <section className="properties-subnet-list">
      <h3 className="properties-subnet-list__title">Todas as sub-redes (CIDR)</h3>
      {subnets.map((subnet) => (
        <SubnetListRow
          key={subnet.id}
          subnet={subnet}
          selected={subnet.id === selectedId}
          nodes={nodes}
          onSelect={() => onSelect(subnet.id)}
          onCidrChange={(cidr) => setSubnetCidr(subnet.id, cidr)}
        />
      ))}
    </section>
  );
}

function SubnetListRow({
  subnet,
  selected,
  nodes,
  onSelect,
  onCidrChange,
}: {
  subnet: Extract<DiagramNode, { kind: "subnet" }>;
  selected: boolean;
  nodes: DiagramNode[];
  onSelect: () => void;
  onCidrChange: (cidr: string) => boolean;
}) {
  const [value, setValue] = useState(subnet.data.cidr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(subnet.data.cidr);
    setError(null);
  }, [subnet.data.cidr]);

  const commit = () => {
    const validation = validateSubnetCidr(value, subnet.id, nodes);
    if (!validation.valid) {
      setError(subnetCidrErrorMessage(validation.error));
      return;
    }
    const ok = onCidrChange(validation.normalized);
    if (!ok) {
      setError(subnetCidrErrorMessage("overlaps-existing"));
      setValue(subnet.data.cidr);
      return;
    }
    setError(null);
  };

  return (
    <div
      className={`properties-subnet-row${selected ? " properties-subnet-row--selected" : ""}`}
    >
      <button
        type="button"
        className="properties-subnet-row__name"
        onClick={onSelect}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          font: "inherit",
        }}
      >
        {subnet.data.name}
      </button>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        aria-label={`CIDR ${subnet.data.name}`}
      />
      {error && <span className="properties-field__error">{error}</span>}
    </div>
  );
}

type PropertiesPanelProps = {
  /** Dentro do painel com abas (sem wrapper aside). */
  embedded?: boolean;
};

export function PropertiesPanel({ embedded = false }: PropertiesPanelProps) {
  const selectedNode = useSelectedNode();
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);
  const bringNodeToFront = useDiagramStore((s) => s.bringNodeToFront);
  const sendNodeToBack = useDiagramStore((s) => s.sendNodeToBack);
  const selectNode = useDiagramStore((s) => s.selectNode);

  const allSubnets = nodes.filter(
    (n): n is Extract<DiagramNode, { kind: "subnet" }> => n.kind === "subnet",
  );

  const content = (
    <>
      <h2 className="properties-panel__title">Propriedades</h2>

      {selectedNode && (
        <div className="properties-field properties-layer-actions">
          <span className="properties-field__label">Camadas</span>
          <div className="properties-layer-actions__buttons">
            <button
              type="button"
              className="properties-layer-actions__button"
              onClick={() => bringNodeToFront(selectedNode.id)}
            >
              Trazer para frente
            </button>
            <button
              type="button"
              className="properties-layer-actions__button"
              onClick={() => sendNodeToBack(selectedNode.id)}
            >
              Enviar para trás
            </button>
          </div>
          <span className="properties-field__hint">
            Ordem no diagrama: {resolveNodeZIndex(selectedNode)}
            {selectedNode.kind === "zone"
              ? " — zonas costumam ficar atrás dos recursos."
              : ""}
          </span>
        </div>
      )}

      {!selectedNode && (
        <>
          <p className="properties-panel__empty">
            Selecione um recurso ou edite os CIDRs das sub-redes abaixo.
          </p>
          <SubnetList
            subnets={allSubnets}
            selectedId={null}
            onSelect={selectNode}
          />
        </>
      )}

      {selectedNode?.kind === "vpc" && (
        <>
          <div className="properties-field">
            <label htmlFor="vpc-name">Nome</label>
            <input
              id="vpc-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <VpcFirewallRulesInfo
            vpc={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "subnet" && (
        <>
          <div className="properties-field">
            <label htmlFor="subnet-name">Nome</label>
            <input
              id="subnet-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="subnet-region">Região</label>
            <input
              id="subnet-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <SubnetCidrEditor subnet={selectedNode} allSubnets={allSubnets} />
        </>
      )}

      {selectedNode?.kind === "vm" && (
        <>
          <div className="properties-field">
            <label htmlFor="vm-name">Nome</label>
            <input
              id="vm-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="vm-type">Machine type</label>
            <input
              id="vm-type"
              value={selectedNode.data.machineType}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  machineType: e.target.value,
                })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="vm-region">Região</label>
            <input
              id="vm-region"
              value={selectedNode.data.region ?? "—"}
              readOnly
              aria-readonly
            />
            <span className="properties-field__hint">
              Preenchida automaticamente com a região da sub-rede ligada.
            </span>
          </div>
          <div className="properties-field">
            <label htmlFor="vm-ip">IP interno</label>
            <input
              id="vm-ip"
              value={selectedNode.data.internalIp ?? "—"}
              readOnly
              aria-readonly
            />
            <span className="properties-field__hint">
              Atribuído ao ligar à sub-rede (primeiro IP utilizável GCP).
            </span>
          </div>
          <VmSubnetInfo vmId={selectedNode.id} edges={edges} nodes={nodes} />
          <VmStorageInfo vmId={selectedNode.id} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "storage" && (
        <>
          <div className="properties-field">
            <label htmlFor="storage-name">Nome</label>
            <input
              id="storage-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="storage-location">Localização</label>
            <input
              id="storage-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1 ou US"
            />
          </div>
          <div className="properties-field">
            <label htmlFor="storage-access">Acesso</label>
            <select
              id="storage-access"
              value={selectedNode.data.accessMode}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  accessMode: e.target.value as StorageAccessMode,
                })
              }
            >
              <option value="public">Público / CLI (sem VM)</option>
              <option value="vm">Via VM</option>
            </select>
            <span className="properties-field__hint">
              Em modo público o bucket pode ficar isolado no diagrama.
            </span>
          </div>
          <div className="properties-field">
            <label htmlFor="storage-class">Classe de armazenamento</label>
            <select
              id="storage-class"
              value={selectedNode.data.storageClass}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  storageClass: e.target.value as StorageClass,
                })
              }
            >
              <option value="STANDARD">Standard</option>
              <option value="NEARLINE">Nearline</option>
              <option value="COLDLINE">Coldline</option>
              <option value="ARCHIVE">Archive</option>
            </select>
          </div>
          <StorageVmInfo
            storage={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "sql" && (
        <>
          <div className="properties-field">
            <label htmlFor="sql-name">Nome</label>
            <input
              id="sql-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="sql-access">Acesso</label>
            <select
              id="sql-access"
              value={selectedNode.data.accessMode}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  accessMode: e.target.value as SqlAccessMode,
                })
              }
            >
              <option value="public">Público (IP público)</option>
              <option value="private">Privado via VPC</option>
            </select>
            <span className="properties-field__hint">
              Modo privado: ligue à sub-rede pelo handle superior do nó.
            </span>
          </div>
          <div className="properties-field">
            <label htmlFor="sql-engine">Motor</label>
            <select
              id="sql-engine"
              value={selectedNode.data.engine}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  engine: e.target.value as SqlEngine,
                })
              }
            >
              <option value="POSTGRES_15">PostgreSQL 15</option>
              <option value="MYSQL_8_0">MySQL 8.0</option>
            </select>
          </div>
          <div className="properties-field">
            <label htmlFor="sql-region">Região</label>
            <input
              id="sql-region"
              value={
                selectedNode.data.accessMode === "private" &&
                selectedNode.data.internalIp
                  ? (selectedNode.data.region ?? "—")
                  : selectedNode.data.region
              }
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
              readOnly={
                selectedNode.data.accessMode === "private" &&
                Boolean(selectedNode.data.internalIp)
              }
              aria-readonly={
                selectedNode.data.accessMode === "private" &&
                Boolean(selectedNode.data.internalIp)
              }
            />
            {selectedNode.data.accessMode === "private" &&
            selectedNode.data.internalIp ? (
              <span className="properties-field__hint">
                Região herdada da sub-rede ligada.
              </span>
            ) : null}
          </div>
          {selectedNode.data.accessMode === "private" && (
            <div className="properties-field">
              <label htmlFor="sql-ip">IP interno (sub-rede)</label>
              <input
                id="sql-ip"
                value={selectedNode.data.internalIp ?? "—"}
                readOnly
                aria-readonly
              />
              <span className="properties-field__hint">
                Atribuído ao ligar à sub-rede (após as VMs no mesmo bloco CIDR).
              </span>
            </div>
          )}
          <SqlSubnetInfo sql={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "gke" && (
        <>
          <div className="properties-field">
            <label htmlFor="gke-name">Nome</label>
            <input
              id="gke-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="gke-nodes">Nós do cluster</label>
            <input
              id="gke-nodes"
              type="number"
              min={1}
              value={selectedNode.data.nodeCount}
              onChange={(e) => {
                const nodeCount = Number.parseInt(e.target.value, 10);
                if (nodeCount >= 1) {
                  updateNodeData(selectedNode.id, { nodeCount });
                }
              }}
            />
          </div>
          <div className="properties-field">
            <label htmlFor="gke-machine">Machine type (nós)</label>
            <input
              id="gke-machine"
              value={selectedNode.data.machineType}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  machineType: e.target.value,
                })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="gke-region">Região</label>
            <input
              id="gke-region"
              value={selectedNode.data.region ?? "—"}
              readOnly
              aria-readonly
            />
            <span className="properties-field__hint">
              Preenchida automaticamente com a região da sub-rede ligada.
            </span>
          </div>
          <div className="properties-field">
            <label htmlFor="gke-ip">IP interno (sub-rede)</label>
            <input
              id="gke-ip"
              value={selectedNode.data.internalIp ?? "—"}
              readOnly
              aria-readonly
            />
            <span className="properties-field__hint">
              Atribuído ao ligar à sub-rede (após VMs e SQL no CIDR).
            </span>
          </div>
          <GkeSubnetInfo gke={selectedNode} edges={edges} nodes={nodes} />
          <GkeEventarcInfo gke={selectedNode} edges={edges} nodes={nodes} />
          <GkeGithubInfo gke={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "run" && (
        <>
          <div className="properties-field">
            <label htmlFor="run-name">Nome</label>
            <input
              id="run-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="run-image">Imagem do container</label>
            <input
              id="run-image"
              value={selectedNode.data.imageUrl}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { imageUrl: e.target.value })
              }
              placeholder="us-docker.pkg.dev/cloudrun/container/hello"
            />
            <span className="properties-field__hint">
              URL completa da imagem (Artifact Registry, GCR ou Docker Hub).
            </span>
          </div>
          <div className="properties-field">
            <label htmlFor="run-access">Acesso</label>
            <select
              id="run-access"
              value={selectedNode.data.accessMode}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  accessMode: e.target.value as RunAccessMode,
                })
              }
            >
              <option value="public">Público (URL)</option>
              <option value="vpc">VPC connector (sub-rede)</option>
            </select>
          </div>
          <div className="properties-field">
            <label htmlFor="run-cpu">CPU</label>
            <input
              id="run-cpu"
              value={selectedNode.data.cpu}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { cpu: e.target.value })
              }
              placeholder="1"
            />
          </div>
          <div className="properties-field">
            <label htmlFor="run-memory">Memória</label>
            <input
              id="run-memory"
              value={selectedNode.data.memory}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { memory: e.target.value })
              }
              placeholder="512Mi"
            />
          </div>
          <div className="properties-field">
            <label htmlFor="run-min">Instâncias mínimas</label>
            <input
              id="run-min"
              type="number"
              min={0}
              value={selectedNode.data.minInstances}
              onChange={(e) => {
                const minInstances = Number.parseInt(e.target.value, 10);
                if (minInstances >= 0) {
                  updateNodeData(selectedNode.id, { minInstances });
                }
              }}
            />
          </div>
          {selectedNode.data.accessMode === "vpc" && (
            <>
              <div className="properties-field">
                <label htmlFor="run-region">Região</label>
                <input
                  id="run-region"
                  value={selectedNode.data.region ?? "—"}
                  readOnly
                  aria-readonly
                />
              </div>
              <div className="properties-field">
                <label htmlFor="run-ip">IP (VPC connector)</label>
                <input
                  id="run-ip"
                  value={selectedNode.data.internalIp ?? "—"}
                  readOnly
                  aria-readonly
                />
                <span className="properties-field__hint">
                  Atribuído ao ligar à sub-rede (após VMs, SQL e GKE).
                </span>
              </div>
            </>
          )}
          <RunSubnetInfo run={selectedNode} edges={edges} nodes={nodes} />
          <RunArtifactInfo run={selectedNode} edges={edges} nodes={nodes} />
          <RunGithubInfo run={selectedNode} edges={edges} nodes={nodes} />
          <RunEventarcInfo run={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "pubsub" && (
        <>
          <div className="properties-field">
            <label htmlFor="pubsub-name">Nome do tópico</label>
            <input
              id="pubsub-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <PubsubDestinationsInfo
            pubsub={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "eventarc" && (
        <>
          <div className="properties-field">
            <label htmlFor="eventarc-name">Nome do trigger</label>
            <input
              id="eventarc-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="eventarc-location">Região</label>
            <input
              id="eventarc-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1"
            />
          </div>
          <EventarcConnectionsInfo
            eventarc={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "bigquery" && (
        <>
          <div className="properties-field">
            <label htmlFor="bigquery-name">Dataset</label>
            <input
              id="bigquery-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="bigquery-location">Localização</label>
            <input
              id="bigquery-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1 ou US"
            />
          </div>
          <BigqueryPubsubInfo
            bigquery={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "spanner" && (
        <>
          <div className="properties-field">
            <label htmlFor="spanner-name">Instância</label>
            <input
              id="spanner-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="spanner-config">Configuração</label>
            <input
              id="spanner-config"
              value={selectedNode.data.config}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { config: e.target.value })
              }
              placeholder="regional-southamerica-east1"
            />
          </div>
          <SpannerClientsInfo
            spanner={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "firestore" && (
        <>
          <div className="properties-field">
            <label htmlFor="firestore-name">Banco de dados</label>
            <input
              id="firestore-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="firestore-location">Localização</label>
            <input
              id="firestore-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1 ou nam5"
            />
          </div>
          <FirestoreClientsInfo
            firestore={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "workbench" && (
        <>
          <div className="properties-field">
            <label htmlFor="workbench-name">Instância</label>
            <input
              id="workbench-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="workbench-region">Região</label>
            <input
              id="workbench-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="workbench-machine">Tipo de máquina</label>
            <select
              id="workbench-machine"
              value={selectedNode.data.machineType}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  machineType: e.target.value,
                })
              }
            >
              {!isWorkbenchMachineType(selectedNode.data.machineType) ? (
                <option value={selectedNode.data.machineType}>
                  {selectedNode.data.machineType} (personalizado)
                </option>
              ) : null}
              {WORKBENCH_MACHINE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <WorkbenchConnectionsInfo
            workbench={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "spark" && (
        <>
          <div className="properties-field">
            <label htmlFor="spark-name">Job / cluster</label>
            <input
              id="spark-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="spark-mode">Modo</label>
            <select
              id="spark-mode"
              value={selectedNode.data.deployMode}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  deployMode: e.target.value as SparkDeployMode,
                })
              }
            >
              <option value="serverless">Serverless</option>
              <option value="cluster">Cluster (VPC)</option>
            </select>
          </div>
          <div className="properties-field">
            <label htmlFor="spark-region">Região</label>
            <input
              id="spark-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
              placeholder="southamerica-east1"
              readOnly={selectedNode.data.deployMode === "cluster"}
              aria-readonly={selectedNode.data.deployMode === "cluster"}
            />
            {selectedNode.data.deployMode === "cluster" ? (
              <span className="properties-field__hint">
                Herdada da sub-rede ao conectar em modo cluster.
              </span>
            ) : null}
          </div>
          <p className="properties-field__hint">
            Managed Apache Spark no GCP. Serverless executa batches sem cluster
            gerenciado; cluster roda na VPC via sub-rede.
          </p>
          <SparkConnectionsInfo
            spark={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "airflow" && (
        <>
          <div className="properties-field">
            <label htmlFor="airflow-name">Ambiente</label>
            <input
              id="airflow-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="airflow-region">Região</label>
            <input
              id="airflow-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
              placeholder="southamerica-east1"
              readOnly
              aria-readonly
            />
            <span className="properties-field__hint">
              Herdada da sub-rede ao conectar o ambiente Composer na VPC.
            </span>
          </div>
          <p className="properties-field__hint">
            Cloud Composer — Apache Airflow gerenciado. Orquestre DAGs que
            consomem dados e disparam cargas em outros serviços.
          </p>
          <AirflowConnectionsInfo
            airflow={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "dataflow" && (
        <>
          <div className="properties-field">
            <label htmlFor="dataflow-name">Job / pipeline</label>
            <input
              id="dataflow-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="dataflow-type">Tipo</label>
            <select
              id="dataflow-type"
              value={selectedNode.data.pipelineType}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  pipelineType: e.target.value as DataflowPipelineType,
                })
              }
            >
              <option value="batch">Batch</option>
              <option value="streaming">Streaming</option>
            </select>
          </div>
          <div className="properties-field">
            <label htmlFor="dataflow-region">Região</label>
            <input
              id="dataflow-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
              placeholder="southamerica-east1"
              readOnly={
                edges.some(
                  (e) =>
                    e.kind === "dataflow-subnet" &&
                    e.source === selectedNode.id,
                )
              }
              aria-readonly={
                edges.some(
                  (e) =>
                    e.kind === "dataflow-subnet" &&
                    e.source === selectedNode.id,
                )
              }
            />
            {edges.some(
              (e) =>
                e.kind === "dataflow-subnet" && e.source === selectedNode.id,
            ) ? (
              <span className="properties-field__hint">
                Herdada da sub-rede ao conectar workers na VPC.
              </span>
            ) : null}
          </div>
          <p className="properties-field__hint">
            Cloud Dataflow — pipelines Apache Beam gerenciados. Batch processa
            conjuntos finitos; streaming consome eventos contínuos (ex.: Pub/Sub).
          </p>
          <DataflowConnectionsInfo
            dataflow={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "modelregistry" && (
        <>
          <div className="properties-field">
            <label htmlFor="modelregistry-name">Modelo</label>
            <input
              id="modelregistry-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="modelregistry-location">Localização</label>
            <input
              id="modelregistry-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1"
            />
          </div>
          <p className="properties-field__hint">
            Vertex AI Model Registry — versionamento e deploy de modelos ML.
            Registre a partir de notebooks ou pipelines e publique em Cloud Run
            ou GKE.
          </p>
          <ModelRegistryConnectionsInfo
            modelregistry={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "nat" && (
        <>
          <div className="properties-field">
            <label htmlFor="nat-name">Nome</label>
            <input
              id="nat-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="nat-region">Região</label>
            <input
              id="nat-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <NatVpcInfo nat={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "router" && (
        <>
          <div className="properties-field">
            <label htmlFor="router-name">Nome</label>
            <input
              id="router-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="router-region">Região</label>
            <input
              id="router-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <RouterVpcInfo router={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "peering" && (
        <>
          <div className="properties-field">
            <label htmlFor="peering-name">Nome</label>
            <input
              id="peering-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <p className="properties-field__hint">
            Ligue o peering a duas VPCs para documentar conectividade privada
            entre redes.
          </p>
          <PeeringVpcInfo peering={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "vpn" && (
        <>
          <div className="properties-field">
            <label htmlFor="vpn-name">Nome</label>
            <input
              id="vpn-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="vpn-region">Região</label>
            <input
              id="vpn-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <VpnVpcInfo vpn={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "interconnect" && (
        <>
          <div className="properties-field">
            <label htmlFor="interconnect-name">Nome</label>
            <input
              id="interconnect-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="interconnect-region">Região</label>
            <input
              id="interconnect-region"
              value={selectedNode.data.region}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { region: e.target.value })
              }
            />
          </div>
          <InterconnectVpcInfo
            interconnect={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "firewall" && (
        <>
          <div className="properties-field">
            <label htmlFor="firewall-name">Nome</label>
            <input
              id="firewall-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="firewall-direction">Direção</label>
            <select
              id="firewall-direction"
              value={selectedNode.data.direction}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  direction: e.target.value as FirewallDirection,
                })
              }
            >
              <option value="ingress">Entrada (ingress)</option>
              <option value="egress">Saída (egress)</option>
            </select>
          </div>
          <FirewallVpcInfo
            firewall={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "artifact" && (
        <>
          <div className="properties-field">
            <label htmlFor="artifact-name">Nome</label>
            <input
              id="artifact-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="artifact-location">Localização</label>
            <input
              id="artifact-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1"
            />
          </div>
          <div className="properties-field">
            <label htmlFor="artifact-format">Formato</label>
            <select
              id="artifact-format"
              value={selectedNode.data.format}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  format: e.target.value as ArtifactFormat,
                })
              }
            >
              <option value="DOCKER">Docker</option>
              <option value="MAVEN">Maven</option>
              <option value="NPM">npm</option>
            </select>
          </div>
          <ArtifactPullInfo artifact={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "build" && (
        <>
          <div className="properties-field">
            <label htmlFor="build-name">Trigger / pipeline</label>
            <input
              id="build-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="build-location">Região</label>
            <input
              id="build-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1"
            />
          </div>
          <p className="properties-field__hint">
            CI/CD gerenciado. Ligue ao GitHub para código-fonte, Artifact Registry
            para push de imagens, Pub/Sub para triggers e Cloud Storage como
            alternativa ao repositório.
          </p>
          <BuildConnectionsInfo
            build={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "kms" && (
        <>
          <div className="properties-field">
            <label htmlFor="kms-name">Key ring / chave</label>
            <input
              id="kms-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="kms-location">Localização</label>
            <input
              id="kms-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="southamerica-east1 ou global"
            />
          </div>
          <KmsConsumersInfo kms={selectedNode} edges={edges} nodes={nodes} />
        </>
      )}

      {selectedNode?.kind === "iam" && (
        <>
          <div className="properties-field">
            <label htmlFor="iam-name">Recurso</label>
            <input
              id="iam-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="iam-variant">Tipo</label>
            <select
              id="iam-variant"
              value={selectedNode.data.variant}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  variant: e.target.value as IamVariant,
                })
              }
            >
              <option value="iam">IAM (conta de serviço)</option>
              <option value="workload_identity">
                Workload Identity Federation
              </option>
              <option value="group">Grupo</option>
            </select>
          </div>
          {selectedNode.data.variant === "iam" && (
            <div className="properties-field">
              <label htmlFor="iam-sa-email">E-mail da conta de serviço</label>
              <input
                id="iam-sa-email"
                value={selectedNode.data.serviceAccountEmail}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    serviceAccountEmail: e.target.value,
                  })
                }
                placeholder="sa-app@projeto.iam.gserviceaccount.com"
              />
            </div>
          )}
          {selectedNode.data.variant === "workload_identity" && (
            <>
              <div className="properties-field">
                <label htmlFor="iam-pool-id">Pool ID</label>
                <input
                  id="iam-pool-id"
                  value={selectedNode.data.workloadPoolId}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      workloadPoolId: e.target.value,
                    })
                  }
                  placeholder="pool-external"
                />
              </div>
              <div className="properties-field">
                <label htmlFor="iam-provider-id">Provider ID</label>
                <input
                  id="iam-provider-id"
                  value={selectedNode.data.workloadProviderId}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      workloadProviderId: e.target.value,
                    })
                  }
                  placeholder="provider-github"
                />
              </div>
            </>
          )}
          {selectedNode.data.variant === "group" && (
            <div className="properties-field">
              <label htmlFor="iam-group-email">E-mail do grupo</label>
              <input
                id="iam-group-email"
                value={selectedNode.data.groupEmail}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, { groupEmail: e.target.value })
                }
                placeholder="eng-platform@example.com"
              />
            </div>
          )}
          <p className="properties-field__hint">
            O ícone permanece o mesmo; o nó exibe o tipo e os detalhes conforme a
            opção selecionada.
          </p>
        </>
      )}

      {selectedNode?.kind === "internet" && (
        <>
          <div className="properties-field">
            <label htmlFor="internet-name">Nome</label>
            <input
              id="internet-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <p className="properties-field__hint">
            Representa a rede pública externa ou on-prem. Ligue ao Cloud NAT
            (egress) ou ao Cloud VPN (túnel híbrido).
          </p>
          <InternetConnectivityInfo
            internet={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "zone" && (
        <>
          <div className="properties-field">
            <label htmlFor="zone-name">Nome</label>
            <input
              id="zone-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
              placeholder="Zona"
            />
          </div>
          <div className="properties-field">
            <span className="properties-field__label">Cor de fundo</span>
            <div className="zone-color-picker" role="radiogroup" aria-label="Cor de fundo">
              {ZONE_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`zone-color-picker__swatch zone-color-picker__swatch--${option.id}${
                    selectedNode.data.colorId === option.id
                      ? " zone-color-picker__swatch--selected"
                      : ""
                  }`}
                  role="radio"
                  aria-checked={selectedNode.data.colorId === option.id}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() =>
                    updateNodeData(selectedNode.id, {
                      colorId: option.id as ZoneColorId,
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div className="properties-field">
            <span className="properties-field__label">Grossura da borda</span>
            <div
              className="zone-option-toggle"
              role="radiogroup"
              aria-label="Grossura da borda"
            >
              {ZONE_BORDER_WIDTHS.map((width) => (
                <button
                  key={width}
                  type="button"
                  className={`zone-option-toggle__btn${
                    selectedNode.data.borderWidth === width
                      ? " zone-option-toggle__btn--selected"
                      : ""
                  }`}
                  role="radio"
                  aria-checked={selectedNode.data.borderWidth === width}
                  onClick={() =>
                    updateNodeData(selectedNode.id, {
                      borderWidth: width as ZoneBorderWidth,
                    })
                  }
                >
                  {ZONE_BORDER_WIDTH_LABELS[width]}
                </button>
              ))}
            </div>
          </div>
          <div className="properties-field">
            <span className="properties-field__label">Estilo da borda</span>
            <div
              className="zone-option-toggle"
              role="radiogroup"
              aria-label="Estilo da borda"
            >
              {ZONE_BORDER_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`zone-option-toggle__btn${
                    selectedNode.data.borderStyle === style
                      ? " zone-option-toggle__btn--selected"
                      : ""
                  }`}
                  role="radio"
                  aria-checked={selectedNode.data.borderStyle === style}
                  onClick={() =>
                    updateNodeData(selectedNode.id, {
                      borderStyle: style as ZoneBorderStyle,
                    })
                  }
                >
                  {ZONE_BORDER_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>
          <p className="properties-field__hint">
            Arraste os cantos para redimensionar. A zona fica atrás dos recursos e
            não aceita conexões.
          </p>
          <dl className="properties-stats">
            <dt>Tamanho</dt>
            <dd>
              {Math.round(selectedNode.data.width)} ×{" "}
              {Math.round(selectedNode.data.height)} px
            </dd>
          </dl>
        </>
      )}

      {selectedNode?.kind === "folder" && (
        <>
          <div className="properties-field">
            <label htmlFor="folder-name">Nome</label>
            <input
              id="folder-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
              placeholder="Pasta"
            />
          </div>
          <p className="properties-field__hint">
            Unidade organizacional na hierarquia de recursos GCP (organização →
            pasta → projeto). Use para documentar a estrutura de governança.
          </p>
          <FolderConnectionsInfo
            folder={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "project" && (
        <>
          <div className="properties-field">
            <label htmlFor="project-name">Nome / ID</label>
            <input
              id="project-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
              placeholder="meu-projeto-gcp"
            />
          </div>
          <p className="properties-field__hint">
            Projeto GCP — container de recursos faturáveis. Documente a qual
            projeto os serviços do diagrama pertencem.
          </p>
          <ProjectConnectionsInfo
            project={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "entra" && (
        <>
          <div className="properties-field">
            <label htmlFor="entra-name">Tenant</label>
            <input
              id="entra-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <p className="properties-field__hint">
            Diretório de identidades Microsoft. Ligue usuários de PC, on-premises
            e cargas de trabalho GCP para documentar autenticação.
          </p>
          <EntraConnectionsInfo
            entra={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "infocard" && (
        <>
          <div className="properties-field">
            <label htmlFor="infocard-caption">Legenda</label>
            <input
              id="infocard-caption"
              value={selectedNode.data.caption}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { caption: e.target.value })
              }
              placeholder="Texto menor em cima"
            />
          </div>
          <div className="properties-field">
            <label htmlFor="infocard-title">Título</label>
            <input
              id="infocard-title"
              value={selectedNode.data.title}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { title: e.target.value })
              }
              placeholder="Texto maior em destaque"
            />
          </div>
          <p className="properties-field__hint">
            Cartão de identificação visual. Ligue a qualquer recurso para
            anotar contexto (exceto zonas).
          </p>
          <InfocardLinksInfo
            infocard={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "pcuser" && (
        <>
          <div className="properties-field">
            <label htmlFor="pcuser-name">Usuário</label>
            <input
              id="pcuser-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <p className="properties-field__hint">
            Representa um usuário em estação de trabalho. Ligue ao Entra ID,
            on-premises, VMs ou Cloud Run.
          </p>
          <PcUserConnectionsInfo
            pcuser={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "onprem" && (
        <>
          <div className="properties-field">
            <label htmlFor="onprem-name">Nome</label>
            <input
              id="onprem-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="onprem-location">Localização</label>
            <input
              id="onprem-location"
              value={selectedNode.data.location}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { location: e.target.value })
              }
              placeholder="Datacenter / site"
            />
          </div>
          <p className="properties-field__hint">
            Ambiente local ou datacenter corporativo. Ligue ao Entra ID, Cloud
            VPN, Cloud Interconnect ou VMs.
          </p>
          <OnpremConnectionsInfo
            onprem={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}

      {selectedNode?.kind === "github" && (
        <>
          <div className="properties-field">
            <label htmlFor="github-name">Recurso</label>
            <input
              id="github-name"
              value={selectedNode.data.name}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { name: e.target.value })
              }
            />
          </div>
          <div className="properties-field">
            <label htmlFor="github-repository">Repositório</label>
            <input
              id="github-repository"
              value={selectedNode.data.repository}
              onChange={(e) =>
                updateNodeData(selectedNode.id, { repository: e.target.value })
              }
              placeholder="org/repository"
            />
          </div>
          <p className="properties-field__hint">
            Representa um repositório GitHub no diagrama. Ligue ao Cloud Build
            (CI), Cloud Run (deploy contínuo) ou GKE (GitOps).
          </p>
          <GithubConnectionsInfo
            github={selectedNode}
            edges={edges}
            nodes={nodes}
          />
        </>
      )}
    </>
  );

  if (embedded) {
    return <div className="properties-panel properties-panel--embedded">{content}</div>;
  }

  return (
    <aside className="properties-panel" aria-label="Propriedades">
      {content}
    </aside>
  );
}

function RunSubnetInfo({
  run,
  edges,
  nodes,
}: {
  run: Extract<DiagramNode, { kind: "run" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  if (run.data.accessMode === "public") {
    return (
      <p className="properties-field__hint">
        Acesso por URL pública — não exige ligação à sub-rede.
      </p>
    );
  }
  const edge = edges.find(
    (e) => e.kind === "run-subnet" && e.source === run.id,
  );
  if (!edge) {
    return (
      <p className="properties-field__hint">
        Ligue este serviço à sub-rede para o VPC connector.
      </p>
    );
  }
  const subnet = nodes.find((n) => n.id === edge.target && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return null;

  return (
    <dl className="properties-stats">
      <dt>Sub-rede</dt>
      <dd>
        {subnet.data.name} ({subnet.data.cidr})
      </dd>
    </dl>
  );
}

function RunArtifactInfo({
  run,
  edges,
  nodes,
}: {
  run: Extract<DiagramNode, { kind: "run" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "run-artifact" && e.source === run.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "artifact"))
    .filter((n): n is Extract<DiagramNode, { kind: "artifact" }> => n != null);

  if (linked.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue ao Artifact Registry para documentar pull de imagens.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      <dt>Artifact Registry</dt>
      <dd>{linked.map((a) => a.data.name).join(", ")}</dd>
    </dl>
  );
}

function RunGithubInfo({
  run,
  edges,
  nodes,
}: {
  run: Extract<DiagramNode, { kind: "run" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "github-run" && e.target === run.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "github"))
    .filter((n): n is Extract<DiagramNode, { kind: "github" }> => n != null);

  if (linked.length === 0) {
    return null;
  }

  return (
    <dl className="properties-stats">
      <dt>GitHub (deploy contínuo)</dt>
      <dd>{linked.map((g) => g.data.repository || g.data.name).join(", ")}</dd>
    </dl>
  );
}

function RunEventarcInfo({
  run,
  edges,
  nodes,
}: {
  run: Extract<DiagramNode, { kind: "run" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const pubsubTopics = edges
    .filter((e) => e.kind === "pubsub-run" && e.target === run.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const eventarcTriggers = edges
    .filter((e) => e.kind === "eventarc-run" && e.target === run.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "eventarc"))
    .filter((n): n is Extract<DiagramNode, { kind: "eventarc" }> => n != null);

  if (pubsubTopics.length === 0 && eventarcTriggers.length === 0) {
    return null;
  }

  return (
    <dl className="properties-stats">
      {pubsubTopics.length > 0 ? (
        <>
          <dt>Pub/Sub (push)</dt>
          <dd>{pubsubTopics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {eventarcTriggers.length > 0 ? (
        <>
          <dt>Eventarc</dt>
          <dd>{eventarcTriggers.map((e) => e.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function GkeEventarcInfo({
  gke,
  edges,
  nodes,
}: {
  gke: Extract<DiagramNode, { kind: "gke" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const eventarcTriggers = edges
    .filter((e) => e.kind === "eventarc-gke" && e.target === gke.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "eventarc"))
    .filter((n): n is Extract<DiagramNode, { kind: "eventarc" }> => n != null);

  if (eventarcTriggers.length === 0) {
    return null;
  }

  return (
    <dl className="properties-stats">
      <dt>Eventarc</dt>
      <dd>{eventarcTriggers.map((e) => e.data.name).join(", ")}</dd>
    </dl>
  );
}

function GkeGithubInfo({
  gke,
  edges,
  nodes,
}: {
  gke: Extract<DiagramNode, { kind: "gke" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "github-gke" && e.target === gke.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "github"))
    .filter((n): n is Extract<DiagramNode, { kind: "github" }> => n != null);

  if (linked.length === 0) {
    return null;
  }

  return (
    <dl className="properties-stats">
      <dt>GitHub (GitOps)</dt>
      <dd>{linked.map((g) => g.data.repository || g.data.name).join(", ")}</dd>
    </dl>
  );
}

function EventarcConnectionsInfo({
  eventarc,
  edges,
  nodes,
}: {
  eventarc: Extract<DiagramNode, { kind: "eventarc" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const pubsubTopics = edges
    .filter((e) => e.kind === "pubsub-eventarc" && e.target === eventarc.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const buckets = edges
    .filter((e) => e.kind === "storage-eventarc" && e.target === eventarc.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "eventarc-run" && e.source === eventarc.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "eventarc-gke" && e.source === eventarc.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);

  if (
    pubsubTopics.length === 0 &&
    buckets.length === 0 &&
    runs.length === 0 &&
    clusters.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue fontes (Pub/Sub, Cloud Storage) e destinos (Cloud Run, GKE) para
        documentar o fluxo de eventos.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {pubsubTopics.length > 0 ? (
        <>
          <dt>Pub/Sub (fonte)</dt>
          <dd>{pubsubTopics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {buckets.length > 0 ? (
        <>
          <dt>Cloud Storage (fonte)</dt>
          <dd>{buckets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run (destino)</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE (destino)</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function PubsubDestinationsInfo({
  pubsub,
  edges,
  nodes,
}: {
  pubsub: Extract<DiagramNode, { kind: "pubsub" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const runs = edges
    .filter((e) => e.kind === "pubsub-run" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const buckets = edges
    .filter((e) => e.kind === "pubsub-storage" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);
  const datasets = edges
    .filter((e) => e.kind === "pubsub-bigquery" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "bigquery"))
    .filter((n): n is Extract<DiagramNode, { kind: "bigquery" }> => n != null);
  const spanners = edges
    .filter((e) => e.kind === "pubsub-spanner" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "spanner"))
    .filter((n): n is Extract<DiagramNode, { kind: "spanner" }> => n != null);
  const firestores = edges
    .filter((e) => e.kind === "pubsub-firestore" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "firestore"))
    .filter((n): n is Extract<DiagramNode, { kind: "firestore" }> => n != null);
  const eventarcTriggers = edges
    .filter((e) => e.kind === "pubsub-eventarc" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "eventarc"))
    .filter((n): n is Extract<DiagramNode, { kind: "eventarc" }> => n != null);
  const airflowEnvs = edges
    .filter((e) => e.kind === "pubsub-airflow" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "airflow"))
    .filter((n): n is Extract<DiagramNode, { kind: "airflow" }> => n != null);
  const dataflowJobs = edges
    .filter((e) => e.kind === "pubsub-dataflow" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "dataflow"))
    .filter((n): n is Extract<DiagramNode, { kind: "dataflow" }> => n != null);
  const builds = edges
    .filter((e) => e.kind === "pubsub-build" && e.source === pubsub.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "build"))
    .filter((n): n is Extract<DiagramNode, { kind: "build" }> => n != null);

  if (
    runs.length === 0 &&
    buckets.length === 0 &&
    datasets.length === 0 &&
    spanners.length === 0 &&
    firestores.length === 0 &&
    eventarcTriggers.length === 0 &&
    airflowEnvs.length === 0 &&
    dataflowJobs.length === 0 &&
    builds.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue a Cloud Run, Cloud Storage, BigQuery, Cloud Spanner, Firestore,
        Eventarc, Managed Airflow, Cloud Dataflow ou Cloud Build para documentar
        subscriptions e exportações.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {buckets.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>{buckets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {datasets.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>{datasets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {spanners.length > 0 ? (
        <>
          <dt>Cloud Spanner</dt>
          <dd>{spanners.map((s) => s.data.name).join(", ")}</dd>
        </>
      ) : null}
      {firestores.length > 0 ? (
        <>
          <dt>Firestore</dt>
          <dd>{firestores.map((f) => f.data.name).join(", ")}</dd>
        </>
      ) : null}
      {eventarcTriggers.length > 0 ? (
        <>
          <dt>Eventarc</dt>
          <dd>{eventarcTriggers.map((e) => e.data.name).join(", ")}</dd>
        </>
      ) : null}
      {airflowEnvs.length > 0 ? (
        <>
          <dt>Managed Airflow</dt>
          <dd>{airflowEnvs.map((a) => a.data.name).join(", ")}</dd>
        </>
      ) : null}
      {dataflowJobs.length > 0 ? (
        <>
          <dt>Cloud Dataflow</dt>
          <dd>{dataflowJobs.map((d) => d.data.name).join(", ")}</dd>
        </>
      ) : null}
      {builds.length > 0 ? (
        <>
          <dt>Cloud Build</dt>
          <dd>{builds.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function WorkbenchConnectionsInfo({
  workbench,
  edges,
  nodes,
}: {
  workbench: Extract<DiagramNode, { kind: "workbench" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const subnetEdge = edges.find(
    (e) => e.kind === "workbench-subnet" && e.source === workbench.id,
  );
  const storageEdges = edges.filter(
    (e) => e.kind === "workbench-storage" && e.source === workbench.id,
  );
  const bigqueryEdges = edges.filter(
    (e) => e.kind === "workbench-bigquery" && e.source === workbench.id,
  );
  const spannerEdges = edges.filter(
    (e) => e.kind === "workbench-spanner" && e.source === workbench.id,
  );
  const firestoreEdges = edges.filter(
    (e) => e.kind === "workbench-firestore" && e.source === workbench.id,
  );
  const modelRegistryEdges = edges.filter(
    (e) => e.kind === "workbench-modelregistry" && e.source === workbench.id,
  );

  if (
    !subnetEdge &&
    storageEdges.length === 0 &&
    bigqueryEdges.length === 0 &&
    spannerEdges.length === 0 &&
    firestoreEdges.length === 0 &&
    modelRegistryEdges.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue à sub-rede (VPC), Cloud Storage, BigQuery, Cloud Spanner,
        Firestore ou Model Registry para documentar o ambiente de notebooks.
      </p>
    );
  }

  const subnet = subnetEdge
    ? nodes.find((n) => n.id === subnetEdge.target && n.kind === "subnet")
    : undefined;

  return (
    <dl className="properties-stats">
      {subnet && subnet.kind === "subnet" ? (
        <>
          <dt>Sub-rede</dt>
          <dd>{subnet.data.name}</dd>
        </>
      ) : null}
      {workbench.data.internalIp ? (
        <>
          <dt>IP interno</dt>
          <dd>{workbench.data.internalIp}</dd>
        </>
      ) : null}
      {storageEdges.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>
            {storageEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "storage"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "storage" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {bigqueryEdges.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>
            {bigqueryEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "bigquery"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "bigquery" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {spannerEdges.length > 0 ? (
        <>
          <dt>Cloud Spanner</dt>
          <dd>
            {spannerEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "spanner"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "spanner" }> =>
                  n != null,
              )
              .map((s) => s.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {firestoreEdges.length > 0 ? (
        <>
          <dt>Firestore</dt>
          <dd>
            {firestoreEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "firestore"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "firestore" }> =>
                  n != null,
              )
              .map((f) => f.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {modelRegistryEdges.length > 0 ? (
        <>
          <dt>Model Registry</dt>
          <dd>
            {modelRegistryEdges
              .map((e) =>
                nodes.find(
                  (n) => n.id === e.target && n.kind === "modelregistry",
                ),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "modelregistry" }> =>
                  n != null,
              )
              .map((m) => m.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
    </dl>
  );
}

function ModelRegistryConnectionsInfo({
  modelregistry,
  edges,
  nodes,
}: {
  modelregistry: Extract<DiagramNode, { kind: "modelregistry" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const workbenches = edges
    .filter(
      (e) =>
        e.kind === "workbench-modelregistry" && e.target === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "workbench"))
    .filter(
      (n): n is Extract<DiagramNode, { kind: "workbench" }> => n != null,
    );
  const builds = edges
    .filter(
      (e) => e.kind === "build-modelregistry" && e.target === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "build"))
    .filter((n): n is Extract<DiagramNode, { kind: "build" }> => n != null);
  const runs = edges
    .filter(
      (e) => e.kind === "modelregistry-run" && e.source === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const clusters = edges
    .filter(
      (e) => e.kind === "modelregistry-gke" && e.source === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);
  const buckets = edges
    .filter(
      (e) =>
        e.kind === "modelregistry-storage" && e.source === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);
  const kmsKeys = edges
    .filter(
      (e) => e.kind === "modelregistry-kms" && e.source === modelregistry.id,
    )
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "kms"))
    .filter((n): n is Extract<DiagramNode, { kind: "kms" }> => n != null);

  if (
    workbenches.length === 0 &&
    builds.length === 0 &&
    runs.length === 0 &&
    clusters.length === 0 &&
    buckets.length === 0 &&
    kmsKeys.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue Vertex AI Workbench ou Cloud Build para registro; Cloud Run, GKE,
        Storage ou Cloud KMS para deploy e artefatos.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {workbenches.length > 0 ? (
        <>
          <dt>Vertex AI Workbench</dt>
          <dd>{workbenches.map((w) => w.data.name).join(", ")}</dd>
        </>
      ) : null}
      {builds.length > 0 ? (
        <>
          <dt>Cloud Build</dt>
          <dd>{builds.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run (deploy)</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE (deploy)</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
      {buckets.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>{buckets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {kmsKeys.length > 0 ? (
        <>
          <dt>Cloud KMS</dt>
          <dd>{kmsKeys.map((k) => k.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function DataflowConnectionsInfo({
  dataflow,
  edges,
  nodes,
}: {
  dataflow: Extract<DiagramNode, { kind: "dataflow" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const subnetEdge = edges.find(
    (e) => e.kind === "dataflow-subnet" && e.source === dataflow.id,
  );
  const storageEdges = edges.filter(
    (e) => e.kind === "dataflow-storage" && e.source === dataflow.id,
  );
  const bigqueryEdges = edges.filter(
    (e) => e.kind === "dataflow-bigquery" && e.source === dataflow.id,
  );
  const kmsEdges = edges.filter(
    (e) => e.kind === "dataflow-kms" && e.source === dataflow.id,
  );
  const pubsubTriggers = edges
    .filter((e) => e.kind === "pubsub-dataflow" && e.target === dataflow.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);

  if (
    !subnetEdge &&
    storageEdges.length === 0 &&
    bigqueryEdges.length === 0 &&
    kmsEdges.length === 0 &&
    pubsubTriggers.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue à sub-rede (VPC), Cloud Storage, BigQuery, Cloud KMS ou Pub/Sub.
      </p>
    );
  }

  const subnet = subnetEdge
    ? nodes.find((n) => n.id === subnetEdge.target && n.kind === "subnet")
    : undefined;

  return (
    <dl className="properties-stats">
      {subnet && subnet.kind === "subnet" ? (
        <>
          <dt>Sub-rede</dt>
          <dd>{subnet.data.name}</dd>
        </>
      ) : null}
      {storageEdges.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>
            {storageEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "storage"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "storage" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {bigqueryEdges.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>
            {bigqueryEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "bigquery"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "bigquery" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {kmsEdges.length > 0 ? (
        <>
          <dt>Cloud KMS</dt>
          <dd>
            {kmsEdges
              .map((e) => nodes.find((n) => n.id === e.target && n.kind === "kms"))
              .filter((n): n is Extract<DiagramNode, { kind: "kms" }> => n != null)
              .map((k) => k.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {pubsubTriggers.length > 0 ? (
        <>
          <dt>Entrada Pub/Sub</dt>
          <dd>{pubsubTriggers.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function AirflowConnectionsInfo({
  airflow,
  edges,
  nodes,
}: {
  airflow: Extract<DiagramNode, { kind: "airflow" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const subnetEdge = edges.find(
    (e) => e.kind === "airflow-subnet" && e.source === airflow.id,
  );
  const storageEdges = edges.filter(
    (e) => e.kind === "airflow-storage" && e.source === airflow.id,
  );
  const bigqueryEdges = edges.filter(
    (e) => e.kind === "airflow-bigquery" && e.source === airflow.id,
  );
  const kmsEdges = edges.filter(
    (e) => e.kind === "airflow-kms" && e.source === airflow.id,
  );
  const pubsubTriggers = edges
    .filter((e) => e.kind === "pubsub-airflow" && e.target === airflow.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);

  if (
    !subnetEdge &&
    storageEdges.length === 0 &&
    bigqueryEdges.length === 0 &&
    kmsEdges.length === 0 &&
    pubsubTriggers.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue à sub-rede (VPC), Cloud Storage, BigQuery, Cloud KMS ou Pub/Sub.
      </p>
    );
  }

  const subnet = subnetEdge
    ? nodes.find((n) => n.id === subnetEdge.target && n.kind === "subnet")
    : undefined;

  return (
    <dl className="properties-stats">
      {subnet && subnet.kind === "subnet" ? (
        <>
          <dt>Sub-rede</dt>
          <dd>{subnet.data.name}</dd>
        </>
      ) : null}
      {storageEdges.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>
            {storageEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "storage"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "storage" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {bigqueryEdges.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>
            {bigqueryEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "bigquery"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "bigquery" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {kmsEdges.length > 0 ? (
        <>
          <dt>Cloud KMS</dt>
          <dd>
            {kmsEdges
              .map((e) => nodes.find((n) => n.id === e.target && n.kind === "kms"))
              .filter((n): n is Extract<DiagramNode, { kind: "kms" }> => n != null)
              .map((k) => k.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {pubsubTriggers.length > 0 ? (
        <>
          <dt>Triggers Pub/Sub</dt>
          <dd>{pubsubTriggers.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function SparkConnectionsInfo({
  spark,
  edges,
  nodes,
}: {
  spark: Extract<DiagramNode, { kind: "spark" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const subnetEdge = edges.find(
    (e) => e.kind === "spark-subnet" && e.source === spark.id,
  );
  const storageEdges = edges.filter(
    (e) => e.kind === "spark-storage" && e.source === spark.id,
  );
  const bigqueryEdges = edges.filter(
    (e) => e.kind === "spark-bigquery" && e.source === spark.id,
  );
  const kmsEdges = edges.filter(
    (e) => e.kind === "spark-kms" && e.source === spark.id,
  );

  if (
    !subnetEdge &&
    storageEdges.length === 0 &&
    bigqueryEdges.length === 0 &&
    kmsEdges.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        {spark.data.deployMode === "cluster"
          ? "Ligue à sub-rede (VPC), Cloud Storage, BigQuery ou Cloud KMS."
          : "Ligue a Cloud Storage, BigQuery ou Cloud KMS."}
      </p>
    );
  }

  const subnet = subnetEdge
    ? nodes.find((n) => n.id === subnetEdge.target && n.kind === "subnet")
    : undefined;

  return (
    <dl className="properties-stats">
      {subnet && subnet.kind === "subnet" ? (
        <>
          <dt>Sub-rede</dt>
          <dd>{subnet.data.name}</dd>
        </>
      ) : null}
      {storageEdges.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>
            {storageEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "storage"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "storage" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {bigqueryEdges.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>
            {bigqueryEdges
              .map((e) =>
                nodes.find((n) => n.id === e.target && n.kind === "bigquery"),
              )
              .filter(
                (n): n is Extract<DiagramNode, { kind: "bigquery" }> =>
                  n != null,
              )
              .map((b) => b.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {kmsEdges.length > 0 ? (
        <>
          <dt>Cloud KMS</dt>
          <dd>
            {kmsEdges
              .map((e) => nodes.find((n) => n.id === e.target && n.kind === "kms"))
              .filter((n): n is Extract<DiagramNode, { kind: "kms" }> => n != null)
              .map((k) => k.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
    </dl>
  );
}

function FirestoreClientsInfo({
  firestore,
  edges,
  nodes,
}: {
  firestore: Extract<DiagramNode, { kind: "firestore" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vms = edges
    .filter((e) => e.kind === "vm-firestore" && e.target === firestore.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "gke-firestore" && e.target === firestore.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "run-firestore" && e.target === firestore.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const topics = edges
    .filter((e) => e.kind === "pubsub-firestore" && e.target === firestore.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const workbenches = edges
    .filter((e) => e.kind === "workbench-firestore" && e.target === firestore.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "workbench"))
    .filter(
      (n): n is Extract<DiagramNode, { kind: "workbench" }> => n != null,
    );

  if (
    vms.length === 0 &&
    clusters.length === 0 &&
    runs.length === 0 &&
    topics.length === 0 &&
    workbenches.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue VMs, GKE, Cloud Run, Workbench ou Pub/Sub para documentar
        clientes deste banco.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {topics.length > 0 ? (
        <>
          <dt>Pub/Sub</dt>
          <dd>{topics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {workbenches.length > 0 ? (
        <>
          <dt>Vertex AI Workbench</dt>
          <dd>{workbenches.map((w) => w.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function SpannerClientsInfo({
  spanner,
  edges,
  nodes,
}: {
  spanner: Extract<DiagramNode, { kind: "spanner" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vms = edges
    .filter((e) => e.kind === "vm-spanner" && e.target === spanner.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "gke-spanner" && e.target === spanner.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "run-spanner" && e.target === spanner.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const topics = edges
    .filter((e) => e.kind === "pubsub-spanner" && e.target === spanner.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const workbenches = edges
    .filter((e) => e.kind === "workbench-spanner" && e.target === spanner.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "workbench"))
    .filter(
      (n): n is Extract<DiagramNode, { kind: "workbench" }> => n != null,
    );

  if (
    vms.length === 0 &&
    clusters.length === 0 &&
    runs.length === 0 &&
    topics.length === 0 &&
    workbenches.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue VMs, GKE, Cloud Run, Workbench ou Pub/Sub para documentar
        clientes desta instância.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {topics.length > 0 ? (
        <>
          <dt>Pub/Sub</dt>
          <dd>{topics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {workbenches.length > 0 ? (
        <>
          <dt>Vertex AI Workbench</dt>
          <dd>{workbenches.map((w) => w.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function BigqueryPubsubInfo({
  bigquery,
  edges,
  nodes,
}: {
  bigquery: Extract<DiagramNode, { kind: "bigquery" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const topics = edges
    .filter((e) => e.kind === "pubsub-bigquery" && e.target === bigquery.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const workbenches = edges
    .filter((e) => e.kind === "workbench-bigquery" && e.target === bigquery.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "workbench"))
    .filter(
      (n): n is Extract<DiagramNode, { kind: "workbench" }> => n != null,
    );

  if (topics.length === 0 && workbenches.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue tópicos Pub/Sub ou Vertex AI Workbench para documentar consumo
        deste dataset.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {topics.length > 0 ? (
        <>
          <dt>Pub/Sub (origem)</dt>
          <dd>{topics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {workbenches.length > 0 ? (
        <>
          <dt>Vertex AI Workbench</dt>
          <dd>{workbenches.map((w) => w.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function GkeSubnetInfo({
  gke,
  edges,
  nodes,
}: {
  gke: Extract<DiagramNode, { kind: "gke" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const edge = edges.find(
    (e) => e.kind === "gke-subnet" && e.source === gke.id,
  );
  if (!edge) {
    return (
      <p className="properties-field__hint">
        Ligue o cluster à sub-rede (handle superior) para obter região e IP interno.
      </p>
    );
  }
  const subnet = nodes.find((n) => n.id === edge.target && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return null;

  return (
    <dl className="properties-stats">
      <dt>Sub-rede</dt>
      <dd>
        {subnet.data.name} ({subnet.data.cidr})
      </dd>
    </dl>
  );
}

function SqlSubnetInfo({
  sql,
  edges,
  nodes,
}: {
  sql: Extract<DiagramNode, { kind: "sql" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const edge = edges.find(
    (e) => e.kind === "sql-subnet" && e.source === sql.id,
  );
  if (sql.data.accessMode === "public") {
    return (
      <p className="properties-field__hint">
        Acesso por IP público — não exige ligação à sub-rede.
      </p>
    );
  }
  if (!edge) {
    return (
      <p className="properties-field__hint">
        Ligue esta instância à sub-rede (handle superior) para obter IP interno privado.
      </p>
    );
  }
  const subnet = nodes.find((n) => n.id === edge.target && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return null;

  return (
    <dl className="properties-stats">
      <dt>Sub-rede</dt>
      <dd>
        {subnet.data.name} ({subnet.data.cidr})
      </dd>
    </dl>
  );
}

function VmStorageInfo({
  vmId,
  edges,
  nodes,
}: {
  vmId: string;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "vm-storage" && e.source === vmId)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);

  if (linked.length === 0) return null;

  return (
    <dl className="properties-stats">
      <dt>Buckets (Cloud Storage)</dt>
      <dd>
        {linked.map((bucket) => bucket.data.name).join(", ")}
      </dd>
    </dl>
  );
}

function PeeringVpcInfo({
  peering,
  edges,
  nodes,
}: {
  peering: Extract<DiagramNode, { kind: "peering" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdges = edges.filter(
    (e) => e.kind === "peering-vpc" && e.source === peering.id,
  );

  if (vpcEdges.length === 0) {
    return (
      <p className="properties-field__hint">
        Nenhuma VPC ligada. Conecte duas VPCs a este peering.
      </p>
    );
  }

  const vpcs = vpcEdges
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "vpc"))
    .filter((n): n is Extract<DiagramNode, { kind: "vpc" }> => n != null);

  return (
    <dl className="properties-stats">
      <dt>VPCs em peering</dt>
      <dd>
        {vpcs.length > 0
          ? vpcs.map((vpc) => vpc.data.name).join(" ↔ ")
          : "—"}
      </dd>
      <dt>Progresso</dt>
      <dd>{vpcEdges.length} / 2</dd>
    </dl>
  );
}

function VpcFirewallRulesInfo({
  vpc,
  edges,
  nodes,
}: {
  vpc: Extract<DiagramNode, { kind: "vpc" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const rules = edges
    .filter((e) => e.kind === "firewall-vpc" && e.target === vpc.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "firewall"))
    .filter((n): n is Extract<DiagramNode, { kind: "firewall" }> => n != null);

  if (rules.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue regras de firewall a esta VPC para documentar políticas de rede.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      <dt>Regras de firewall</dt>
      <dd>
        {rules
          .map(
            (rule) =>
              `${rule.data.name} (${rule.data.direction === "ingress" ? "entrada" : "saída"})`,
          )
          .join(", ")}
      </dd>
    </dl>
  );
}

function FirewallVpcInfo({
  firewall,
  edges,
  nodes,
}: {
  firewall: Extract<DiagramNode, { kind: "firewall" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdge = edges.find(
    (e) => e.kind === "firewall-vpc" && e.source === firewall.id,
  );

  if (!vpcEdge) {
    return (
      <p className="properties-field__hint">
        Ligue à VPC (handle inferior) para documentar onde a regra se aplica.
      </p>
    );
  }

  const vpc = nodes.find((n) => n.id === vpcEdge.target && n.kind === "vpc");

  return (
    <dl className="properties-stats">
      {vpc && vpc.kind === "vpc" ? (
        <>
          <dt>VPC</dt>
          <dd>{vpc.data.name}</dd>
        </>
      ) : null}
    </dl>
  );
}

function InterconnectVpcInfo({
  interconnect,
  edges,
  nodes,
}: {
  interconnect: Extract<DiagramNode, { kind: "interconnect" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdge = edges.find(
    (e) => e.kind === "interconnect-vpc" && e.source === interconnect.id,
  );
  const internetEdge = edges.find(
    (e) =>
      e.kind === "internet-interconnect" && e.target === interconnect.id,
  );
  const onpremEdge = edges.find(
    (e) => e.kind === "onprem-interconnect" && e.target === interconnect.id,
  );

  if (!vpcEdge && !internetEdge && !onpremEdge) {
    return (
      <p className="properties-field__hint">
        Ligue à VPC (handle inferior), à Internet (superior) ou ao on-premises
        para documentar o link dedicado.
      </p>
    );
  }

  const vpc = vpcEdge
    ? nodes.find((n) => n.id === vpcEdge.target && n.kind === "vpc")
    : undefined;
  const onprem = onpremEdge
    ? nodes.find((n) => n.id === onpremEdge.source && n.kind === "onprem")
    : undefined;

  return (
    <dl className="properties-stats">
      {vpc && vpc.kind === "vpc" ? (
        <>
          <dt>VPC</dt>
          <dd>{vpc.data.name}</dd>
        </>
      ) : null}
      {internetEdge ? (
        <>
          <dt>Internet</dt>
          <dd>Ligada</dd>
        </>
      ) : null}
      {onprem && onprem.kind === "onprem" ? (
        <>
          <dt>On-premises</dt>
          <dd>{onprem.data.name}</dd>
        </>
      ) : null}
    </dl>
  );
}

function VpnVpcInfo({
  vpn,
  edges,
  nodes,
}: {
  vpn: Extract<DiagramNode, { kind: "vpn" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdge = edges.find(
    (e) => e.kind === "vpn-vpc" && e.source === vpn.id,
  );
  const internetEdge = edges.find(
    (e) => e.kind === "internet-vpn" && e.target === vpn.id,
  );
  const onpremEdge = edges.find(
    (e) => e.kind === "onprem-vpn" && e.target === vpn.id,
  );

  if (!vpcEdge && !internetEdge && !onpremEdge) {
    return (
      <p className="properties-field__hint">
        Ligue à VPC (handle inferior), à Internet (superior) ou ao on-premises
        para documentar conectividade híbrida.
      </p>
    );
  }

  const vpc = vpcEdge
    ? nodes.find((n) => n.id === vpcEdge.target && n.kind === "vpc")
    : undefined;
  const onprem = onpremEdge
    ? nodes.find((n) => n.id === onpremEdge.source && n.kind === "onprem")
    : undefined;

  return (
    <dl className="properties-stats">
      {vpc && vpc.kind === "vpc" ? (
        <>
          <dt>VPC</dt>
          <dd>{vpc.data.name}</dd>
        </>
      ) : null}
      {internetEdge ? (
        <>
          <dt>Internet</dt>
          <dd>Ligada</dd>
        </>
      ) : null}
      {onprem && onprem.kind === "onprem" ? (
        <>
          <dt>On-premises</dt>
          <dd>{onprem.data.name}</dd>
        </>
      ) : null}
    </dl>
  );
}

function NatVpcInfo({
  nat,
  edges,
  nodes,
}: {
  nat: Extract<DiagramNode, { kind: "nat" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdge = edges.find(
    (e) => e.kind === "nat-vpc" && e.source === nat.id,
  );
  const subnetEdges = edges.filter(
    (e) => e.kind === "subnet-nat" && e.target === nat.id,
  );
  const internetEdge = edges.find(
    (e) => e.kind === "internet-nat" && e.target === nat.id,
  );

  if (!vpcEdge && subnetEdges.length === 0 && !internetEdge) {
    return (
      <p className="properties-field__hint">
        Ligue à VPC (handle inferior), sub-redes privadas (esquerda) e Internet
        (superior) para documentar egress.
      </p>
    );
  }

  const vpc = vpcEdge
    ? nodes.find((n) => n.id === vpcEdge.target && n.kind === "vpc")
    : undefined;

  return (
    <dl className="properties-stats">
      {vpc && vpc.kind === "vpc" ? (
        <>
          <dt>VPC</dt>
          <dd>{vpc.data.name}</dd>
        </>
      ) : null}
      {subnetEdges.length > 0 ? (
        <>
          <dt>Sub-redes (egress)</dt>
          <dd>
            {subnetEdges
              .map((e) => nodes.find((n) => n.id === e.source && n.kind === "subnet"))
              .filter((n): n is Extract<DiagramNode, { kind: "subnet" }> => n != null)
              .map((s) => s.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {internetEdge ? (
        <>
          <dt>Internet</dt>
          <dd>Ligada</dd>
        </>
      ) : null}
    </dl>
  );
}

function RouterVpcInfo({
  router,
  edges,
  nodes,
}: {
  router: Extract<DiagramNode, { kind: "router" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vpcEdge = edges.find(
    (e) => e.kind === "router-vpc" && e.source === router.id,
  );

  if (!vpcEdge) {
    return (
      <p className="properties-field__hint">
        Opcional: ligue à VPC (handle inferior) para documentar roteamento BGP,
        NAT ou VPN. Pode permanecer isolado no diagrama.
      </p>
    );
  }

  const vpc = nodes.find((n) => n.id === vpcEdge.target && n.kind === "vpc");

  return (
    <dl className="properties-stats">
      {vpc && vpc.kind === "vpc" ? (
        <>
          <dt>VPC</dt>
          <dd>{vpc.data.name}</dd>
        </>
      ) : null}
    </dl>
  );
}

function GithubConnectionsInfo({
  github,
  edges,
  nodes,
}: {
  github: Extract<DiagramNode, { kind: "github" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const builds = edges
    .filter((e) => e.kind === "github-build" && e.source === github.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "build"))
    .filter((n): n is Extract<DiagramNode, { kind: "build" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "github-run" && e.source === github.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "github-gke" && e.source === github.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);

  if (builds.length === 0 && runs.length === 0 && clusters.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue ao Cloud Build, Cloud Run ou GKE para documentar CI/CD e deploy.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {builds.length > 0 ? (
        <>
          <dt>Cloud Build</dt>
          <dd>{builds.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function KmsConsumersInfo({
  kms,
  edges,
  nodes,
}: {
  kms: Extract<DiagramNode, { kind: "kms" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vms = edges
    .filter((e) => e.kind === "vm-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "gke-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "run-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const buckets = edges
    .filter((e) => e.kind === "storage-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);
  const sqlInstances = edges
    .filter((e) => e.kind === "sql-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "sql"))
    .filter((n): n is Extract<DiagramNode, { kind: "sql" }> => n != null);
  const datasets = edges
    .filter((e) => e.kind === "bigquery-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "bigquery"))
    .filter((n): n is Extract<DiagramNode, { kind: "bigquery" }> => n != null);
  const firestores = edges
    .filter((e) => e.kind === "firestore-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "firestore"))
    .filter((n): n is Extract<DiagramNode, { kind: "firestore" }> => n != null);
  const spanners = edges
    .filter((e) => e.kind === "spanner-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "spanner"))
    .filter((n): n is Extract<DiagramNode, { kind: "spanner" }> => n != null);
  const sparkJobs = edges
    .filter((e) => e.kind === "spark-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "spark"))
    .filter((n): n is Extract<DiagramNode, { kind: "spark" }> => n != null);
  const airflowEnvs = edges
    .filter((e) => e.kind === "airflow-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "airflow"))
    .filter((n): n is Extract<DiagramNode, { kind: "airflow" }> => n != null);
  const dataflowJobs = edges
    .filter((e) => e.kind === "dataflow-kms" && e.target === kms.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "dataflow"))
    .filter((n): n is Extract<DiagramNode, { kind: "dataflow" }> => n != null);
  const modelRegistries = edges
    .filter((e) => e.kind === "modelregistry-kms" && e.target === kms.id)
    .map((e) =>
      nodes.find((n) => n.id === e.source && n.kind === "modelregistry"),
    )
    .filter(
      (n): n is Extract<DiagramNode, { kind: "modelregistry" }> => n != null,
    );

  if (
    vms.length === 0 &&
    clusters.length === 0 &&
    runs.length === 0 &&
    buckets.length === 0 &&
    sqlInstances.length === 0 &&
    datasets.length === 0 &&
    firestores.length === 0 &&
    spanners.length === 0 &&
    sparkJobs.length === 0 &&
    airflowEnvs.length === 0 &&
    dataflowJobs.length === 0 &&
    modelRegistries.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue VMs, GKE, Cloud Run, Storage, Cloud SQL, BigQuery, Firestore,
        Spanner, Apache Spark, Managed Airflow, Cloud Dataflow ou Model Registry
        para documentar uso de chaves (CMEK).
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {buckets.length > 0 ? (
        <>
          <dt>Cloud Storage</dt>
          <dd>{buckets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {sqlInstances.length > 0 ? (
        <>
          <dt>Cloud SQL</dt>
          <dd>{sqlInstances.map((s) => s.data.name).join(", ")}</dd>
        </>
      ) : null}
      {datasets.length > 0 ? (
        <>
          <dt>BigQuery</dt>
          <dd>{datasets.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {firestores.length > 0 ? (
        <>
          <dt>Firestore</dt>
          <dd>{firestores.map((f) => f.data.name).join(", ")}</dd>
        </>
      ) : null}
      {spanners.length > 0 ? (
        <>
          <dt>Cloud Spanner</dt>
          <dd>{spanners.map((s) => s.data.name).join(", ")}</dd>
        </>
      ) : null}
      {sparkJobs.length > 0 ? (
        <>
          <dt>Apache Spark</dt>
          <dd>{sparkJobs.map((s) => s.data.name).join(", ")}</dd>
        </>
      ) : null}
      {airflowEnvs.length > 0 ? (
        <>
          <dt>Managed Airflow</dt>
          <dd>{airflowEnvs.map((a) => a.data.name).join(", ")}</dd>
        </>
      ) : null}
      {dataflowJobs.length > 0 ? (
        <>
          <dt>Cloud Dataflow</dt>
          <dd>{dataflowJobs.map((d) => d.data.name).join(", ")}</dd>
        </>
      ) : null}
      {modelRegistries.length > 0 ? (
        <>
          <dt>Model Registry</dt>
          <dd>{modelRegistries.map((m) => m.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function BuildConnectionsInfo({
  build,
  edges,
  nodes,
}: {
  build: Extract<DiagramNode, { kind: "build" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const artifacts = edges
    .filter((e) => e.kind === "build-artifact" && e.source === build.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "artifact"))
    .filter((n): n is Extract<DiagramNode, { kind: "artifact" }> => n != null);
  const pubsubTriggers = edges
    .filter((e) => e.kind === "pubsub-build" && e.target === build.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const storageSources = edges
    .filter((e) => e.kind === "storage-build" && e.target === build.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "storage"))
    .filter((n): n is Extract<DiagramNode, { kind: "storage" }> => n != null);
  const githubSources = edges
    .filter((e) => e.kind === "github-build" && e.target === build.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "github"))
    .filter((n): n is Extract<DiagramNode, { kind: "github" }> => n != null);
  const modelRegistries = edges
    .filter(
      (e) => e.kind === "build-modelregistry" && e.source === build.id,
    )
    .map((e) =>
      nodes.find((n) => n.id === e.target && n.kind === "modelregistry"),
    )
    .filter(
      (n): n is Extract<DiagramNode, { kind: "modelregistry" }> => n != null,
    );

  if (
    artifacts.length === 0 &&
    pubsubTriggers.length === 0 &&
    storageSources.length === 0 &&
    githubSources.length === 0 &&
    modelRegistries.length === 0
  ) {
    return null;
  }

  return (
    <dl className="properties-stats">
      {artifacts.length > 0 ? (
        <>
          <dt>Artifact Registry</dt>
          <dd>{artifacts.map((a) => a.data.name).join(", ")}</dd>
        </>
      ) : null}
      {pubsubTriggers.length > 0 ? (
        <>
          <dt>Triggers Pub/Sub</dt>
          <dd>{pubsubTriggers.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {storageSources.length > 0 ? (
        <>
          <dt>Código-fonte (Storage)</dt>
          <dd>{storageSources.map((s) => s.data.name).join(", ")}</dd>
        </>
      ) : null}
      {githubSources.length > 0 ? (
        <>
          <dt>GitHub</dt>
          <dd>
            {githubSources
              .map((g) => g.data.repository || g.data.name)
              .join(", ")}
          </dd>
        </>
      ) : null}
      {modelRegistries.length > 0 ? (
        <>
          <dt>Model Registry</dt>
          <dd>{modelRegistries.map((m) => m.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function ArtifactPullInfo({
  artifact,
  edges,
  nodes,
}: {
  artifact: Extract<DiagramNode, { kind: "artifact" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const gkePulls = edges
    .filter((e) => e.kind === "gke-artifact" && e.target === artifact.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);
  const vmPulls = edges
    .filter((e) => e.kind === "vm-artifact" && e.target === artifact.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const runPulls = edges
    .filter((e) => e.kind === "run-artifact" && e.target === artifact.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const buildPushes = edges
    .filter((e) => e.kind === "build-artifact" && e.target === artifact.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "build"))
    .filter((n): n is Extract<DiagramNode, { kind: "build" }> => n != null);

  if (
    gkePulls.length === 0 &&
    vmPulls.length === 0 &&
    runPulls.length === 0 &&
    buildPushes.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue GKE, Cloud Run, VMs ou Cloud Build para documentar push/pull de
        imagens e pacotes.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {buildPushes.length > 0 ? (
        <>
          <dt>Cloud Build</dt>
          <dd>{buildPushes.map((b) => b.data.name).join(", ")}</dd>
        </>
      ) : null}
      {gkePulls.length > 0 ? (
        <>
          <dt>Clusters GKE</dt>
          <dd>{gkePulls.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runPulls.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runPulls.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {vmPulls.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vmPulls.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function InternetConnectivityInfo({
  internet,
  edges,
  nodes,
}: {
  internet: Extract<DiagramNode, { kind: "internet" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const natEdge = edges.find(
    (e) => e.kind === "internet-nat" && e.source === internet.id,
  );
  const vpnEdge = edges.find(
    (e) => e.kind === "internet-vpn" && e.source === internet.id,
  );
  const interconnectEdge = edges.find(
    (e) => e.kind === "internet-interconnect" && e.source === internet.id,
  );

  if (!natEdge && !vpnEdge && !interconnectEdge) {
    return (
      <p className="properties-field__hint">
        Ligue ao Cloud NAT, Cloud VPN ou Cloud Interconnect para documentar
        egress ou conectividade híbrida.
      </p>
    );
  }

  const nat = natEdge
    ? nodes.find((n) => n.id === natEdge.target && n.kind === "nat")
    : undefined;
  const vpn = vpnEdge
    ? nodes.find((n) => n.id === vpnEdge.target && n.kind === "vpn")
    : undefined;
  const interconnect = interconnectEdge
    ? nodes.find(
        (n) => n.id === interconnectEdge.target && n.kind === "interconnect",
      )
    : undefined;

  return (
    <dl className="properties-stats">
      {nat && nat.kind === "nat" ? (
        <>
          <dt>Cloud NAT</dt>
          <dd>{nat.data.name}</dd>
        </>
      ) : null}
      {vpn && vpn.kind === "vpn" ? (
        <>
          <dt>Cloud VPN</dt>
          <dd>{vpn.data.name}</dd>
        </>
      ) : null}
      {interconnect && interconnect.kind === "interconnect" ? (
        <>
          <dt>Cloud Interconnect</dt>
          <dd>{interconnect.data.name}</dd>
        </>
      ) : null}
    </dl>
  );
}

function StorageVmInfo({
  storage,
  edges,
  nodes,
}: {
  storage: Extract<DiagramNode, { kind: "storage" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const vms = edges
    .filter((e) => e.kind === "vm-storage" && e.target === storage.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const pubsubTopics = edges
    .filter((e) => e.kind === "pubsub-storage" && e.target === storage.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pubsub"))
    .filter((n): n is Extract<DiagramNode, { kind: "pubsub" }> => n != null);
  const eventarcTriggers = edges
    .filter((e) => e.kind === "storage-eventarc" && e.source === storage.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "eventarc"))
    .filter((n): n is Extract<DiagramNode, { kind: "eventarc" }> => n != null);
  const workbenches = edges
    .filter((e) => e.kind === "workbench-storage" && e.target === storage.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "workbench"))
    .filter(
      (n): n is Extract<DiagramNode, { kind: "workbench" }> => n != null,
    );

  if (
    storage.data.accessMode === "public" &&
    vms.length === 0 &&
    pubsubTopics.length === 0 &&
    eventarcTriggers.length === 0 &&
    workbenches.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Acesso público ou via CLI/gsutil — não exige ligação a VM.
      </p>
    );
  }

  if (
    vms.length === 0 &&
    pubsubTopics.length === 0 &&
    eventarcTriggers.length === 0 &&
    workbenches.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue VMs, Workbench, Pub/Sub ou Eventarc a este bucket.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {vms.length > 0 ? (
        <>
          <dt>VMs com acesso</dt>
          <dd>{vms.map((vm) => vm.data.name).join(", ")}</dd>
        </>
      ) : null}
      {workbenches.length > 0 ? (
        <>
          <dt>Vertex AI Workbench</dt>
          <dd>{workbenches.map((w) => w.data.name).join(", ")}</dd>
        </>
      ) : null}
      {pubsubTopics.length > 0 ? (
        <>
          <dt>Pub/Sub (exportação)</dt>
          <dd>{pubsubTopics.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
      {eventarcTriggers.length > 0 ? (
        <>
          <dt>Eventarc (eventos)</dt>
          <dd>{eventarcTriggers.map((e) => e.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function VmSubnetInfo({
  vmId,
  edges,
  nodes,
}: {
  vmId: string;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const edge = edges.find(
    (e) => e.kind === "vm-subnet" && e.source === vmId,
  );
  if (!edge) {
    return (
      <p className="properties-field__hint">
        Ligue esta VM a uma sub-rede para obter região e IP interno.
      </p>
    );
  }
  const subnet = nodes.find((n) => n.id === edge.target && n.kind === "subnet");
  if (!subnet || subnet.kind !== "subnet") return null;

  const vmIds = getVmIdsOnSubnet(subnet.id, edges);
  return (
    <dl className="properties-stats">
      <dt>Sub-rede</dt>
      <dd>
        {subnet.data.name} ({subnet.data.cidr}, {subnet.data.region})
      </dd>
      <dt>VMs na sub-rede</dt>
      <dd>{vmIds.length}</dd>
    </dl>
  );
}

function FolderConnectionsInfo({
  folder,
  edges,
  nodes,
}: {
  folder: Extract<DiagramNode, { kind: "folder" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const parentFolders = edges
    .filter((e) => e.kind === "folder-folder" && e.target === folder.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "folder"))
    .filter((n): n is Extract<DiagramNode, { kind: "folder" }> => n != null);
  const childFolders = edges
    .filter((e) => e.kind === "folder-folder" && e.source === folder.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "folder"))
    .filter((n): n is Extract<DiagramNode, { kind: "folder" }> => n != null);
  const projects = edges
    .filter((e) => e.kind === "folder-project" && e.source === folder.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "project"))
    .filter((n): n is Extract<DiagramNode, { kind: "project" }> => n != null);

  if (
    parentFolders.length === 0 &&
    childFolders.length === 0 &&
    projects.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue a outras pastas (subpastas) ou a projetos para documentar a
        hierarquia.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {parentFolders.length > 0 ? (
        <>
          <dt>Pasta pai</dt>
          <dd>{parentFolders.map((f) => f.data.name).join(", ")}</dd>
        </>
      ) : null}
      {childFolders.length > 0 ? (
        <>
          <dt>Subpastas</dt>
          <dd>{childFolders.map((f) => f.data.name).join(", ")}</dd>
        </>
      ) : null}
      {projects.length > 0 ? (
        <>
          <dt>Projetos</dt>
          <dd>{projects.map((p) => p.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function ProjectConnectionsInfo({
  project,
  edges,
  nodes,
}: {
  project: Extract<DiagramNode, { kind: "project" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const parentFolders = edges
    .filter((e) => e.kind === "folder-project" && e.target === project.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "folder"))
    .filter((n): n is Extract<DiagramNode, { kind: "folder" }> => n != null);

  if (parentFolders.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue a uma pasta para documentar em qual unidade organizacional o
        projeto está contido.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      <dt>Pasta</dt>
      <dd>{parentFolders.map((f) => f.data.name).join(", ")}</dd>
    </dl>
  );
}

function InfocardLinksInfo({
  infocard,
  edges,
  nodes,
}: {
  infocard: Extract<DiagramNode, { kind: "infocard" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "infocard-link" && e.source === infocard.id)
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter((n): n is DiagramNode => n != null);

  if (linked.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue este cartão a outros recursos para identificar contexto no
        diagrama.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      <dt>Recursos ligados</dt>
      <dd>{linked.map((n) => getNodeDisplayName(n)).join(", ")}</dd>
    </dl>
  );
}

function EntraConnectionsInfo({
  entra,
  edges,
  nodes,
}: {
  entra: Extract<DiagramNode, { kind: "entra" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const users = edges
    .filter((e) => e.kind === "pcuser-entra" && e.target === entra.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pcuser"))
    .filter((n): n is Extract<DiagramNode, { kind: "pcuser" }> => n != null);
  const onpremSites = edges
    .filter((e) => e.kind === "onprem-entra" && e.target === entra.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "onprem"))
    .filter((n): n is Extract<DiagramNode, { kind: "onprem" }> => n != null);
  const vms = edges
    .filter((e) => e.kind === "entra-vm" && e.source === entra.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "entra-run" && e.source === entra.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);
  const clusters = edges
    .filter((e) => e.kind === "entra-gke" && e.source === entra.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "gke"))
    .filter((n): n is Extract<DiagramNode, { kind: "gke" }> => n != null);

  if (
    users.length === 0 &&
    onpremSites.length === 0 &&
    vms.length === 0 &&
    runs.length === 0 &&
    clusters.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue usuários de PC, on-premises, VMs, Cloud Run ou GKE para
        documentar identidade federada.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      {users.length > 0 ? (
        <>
          <dt>Usuários (PC)</dt>
          <dd>{users.map((u) => u.data.name).join(", ")}</dd>
        </>
      ) : null}
      {onpremSites.length > 0 ? (
        <>
          <dt>On-premises</dt>
          <dd>{onpremSites.map((o) => o.data.name).join(", ")}</dd>
        </>
      ) : null}
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
      {clusters.length > 0 ? (
        <>
          <dt>GKE</dt>
          <dd>{clusters.map((g) => g.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function PcUserConnectionsInfo({
  pcuser,
  edges,
  nodes,
}: {
  pcuser: Extract<DiagramNode, { kind: "pcuser" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const entra = edges.find(
    (e) => e.kind === "pcuser-entra" && e.source === pcuser.id,
  );
  const onprem = edges.find(
    (e) => e.kind === "pcuser-onprem" && e.source === pcuser.id,
  );
  const vms = edges
    .filter((e) => e.kind === "pcuser-vm" && e.source === pcuser.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const runs = edges
    .filter((e) => e.kind === "pcuser-run" && e.source === pcuser.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "run"))
    .filter((n): n is Extract<DiagramNode, { kind: "run" }> => n != null);

  if (!entra && !onprem && vms.length === 0 && runs.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue ao Entra ID, on-premises, VMs ou Cloud Run para documentar
        acesso do usuário.
      </p>
    );
  }

  const entraNode = entra
    ? nodes.find((n) => n.id === entra.target && n.kind === "entra")
    : undefined;
  const onpremNode = onprem
    ? nodes.find((n) => n.id === onprem.target && n.kind === "onprem")
    : undefined;

  return (
    <dl className="properties-stats">
      {entraNode && entraNode.kind === "entra" ? (
        <>
          <dt>Entra ID</dt>
          <dd>{entraNode.data.name}</dd>
        </>
      ) : null}
      {onpremNode && onpremNode.kind === "onprem" ? (
        <>
          <dt>On-premises</dt>
          <dd>{onpremNode.data.name}</dd>
        </>
      ) : null}
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {runs.length > 0 ? (
        <>
          <dt>Cloud Run</dt>
          <dd>{runs.map((r) => r.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function OnpremConnectionsInfo({
  onprem,
  edges,
  nodes,
}: {
  onprem: Extract<DiagramNode, { kind: "onprem" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const entra = edges.find(
    (e) => e.kind === "onprem-entra" && e.source === onprem.id,
  );
  const vpn = edges.find(
    (e) => e.kind === "onprem-vpn" && e.source === onprem.id,
  );
  const interconnect = edges.find(
    (e) => e.kind === "onprem-interconnect" && e.source === onprem.id,
  );
  const vms = edges
    .filter((e) => e.kind === "onprem-vm" && e.source === onprem.id)
    .map((e) => nodes.find((n) => n.id === e.target && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);
  const users = edges
    .filter((e) => e.kind === "pcuser-onprem" && e.target === onprem.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "pcuser"))
    .filter((n): n is Extract<DiagramNode, { kind: "pcuser" }> => n != null);

  if (!entra && !vpn && !interconnect && vms.length === 0 && users.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue ao Entra ID, Cloud VPN, Cloud Interconnect, VMs ou usuários de
        PC para documentar o ambiente local.
      </p>
    );
  }

  const entraNode = entra
    ? nodes.find((n) => n.id === entra.target && n.kind === "entra")
    : undefined;
  const vpnNode = vpn
    ? nodes.find((n) => n.id === vpn.target && n.kind === "vpn")
    : undefined;
  const interconnectNode = interconnect
    ? nodes.find(
        (n) => n.id === interconnect.target && n.kind === "interconnect",
      )
    : undefined;

  return (
    <dl className="properties-stats">
      {entraNode && entraNode.kind === "entra" ? (
        <>
          <dt>Entra ID</dt>
          <dd>{entraNode.data.name}</dd>
        </>
      ) : null}
      {vpnNode && vpnNode.kind === "vpn" ? (
        <>
          <dt>Cloud VPN</dt>
          <dd>{vpnNode.data.name}</dd>
        </>
      ) : null}
      {interconnectNode && interconnectNode.kind === "interconnect" ? (
        <>
          <dt>Cloud Interconnect</dt>
          <dd>{interconnectNode.data.name}</dd>
        </>
      ) : null}
      {vms.length > 0 ? (
        <>
          <dt>VMs</dt>
          <dd>{vms.map((v) => v.data.name).join(", ")}</dd>
        </>
      ) : null}
      {users.length > 0 ? (
        <>
          <dt>Usuários (PC)</dt>
          <dd>{users.map((u) => u.data.name).join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}
