import { useEffect, useState } from "react";
import { maxVmsForCidr } from "../../lib/cidr";
import { resolveNodeZIndex } from "../../lib/nodeLayers";
import {
  isWorkbenchMachineType,
  WORKBENCH_MACHINE_TYPES,
} from "../../lib/workbenchMachineTypes";
import { ZONE_COLOR_OPTIONS, type ZoneColorId } from "../../lib/zoneColors";
import { ZONE_PURPOSE_LABELS } from "../nodes";
import { useSelectedNode } from "../../hooks/useSelectedNode";
import {
  countVmsOnSubnet,
  getVmIdsOnSubnet,
  subnetCidrErrorMessage,
  validateSubnetCidr,
} from "../../model/subnet";
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
  ZonePurpose,
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
              placeholder={ZONE_PURPOSE_LABELS[selectedNode.data.purpose]}
            />
          </div>
          <div className="properties-field">
            <label htmlFor="zone-purpose">Tipo</label>
            <select
              id="zone-purpose"
              value={selectedNode.data.purpose}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  purpose: e.target.value as ZonePurpose,
                })
              }
            >
              <option value="project">Projeto</option>
              <option value="vpc-area">Área VPC</option>
              <option value="perimeter">Perímetro</option>
            </select>
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

  if (
    runs.length === 0 &&
    buckets.length === 0 &&
    datasets.length === 0 &&
    spanners.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue a Cloud Run, Cloud Storage, BigQuery ou Cloud Spanner para
        documentar subscriptions e exportações.
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

  if (
    !subnetEdge &&
    storageEdges.length === 0 &&
    bigqueryEdges.length === 0 &&
    spannerEdges.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Ligue à sub-rede (VPC), Cloud Storage, BigQuery ou Cloud Spanner para
        documentar o ambiente de notebooks.
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

  if (!vpcEdge && !internetEdge) {
    return (
      <p className="properties-field__hint">
        Ligue à VPC (handle inferior) e à Internet (superior) para documentar
        conectividade híbrida.
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
      {internetEdge ? (
        <>
          <dt>Internet / on-prem</dt>
          <dd>Ligada</dd>
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

  if (gkePulls.length === 0 && vmPulls.length === 0 && runPulls.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue GKE, Cloud Run ou VMs para documentar pull de imagens/pacotes.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
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

  if (!natEdge && !vpnEdge) {
    return (
      <p className="properties-field__hint">
        Ligue ao Cloud NAT ou Cloud VPN para documentar egress ou túnel híbrido.
      </p>
    );
  }

  const nat = natEdge
    ? nodes.find((n) => n.id === natEdge.target && n.kind === "nat")
    : undefined;
  const vpn = vpnEdge
    ? nodes.find((n) => n.id === vpnEdge.target && n.kind === "vpn")
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
    workbenches.length === 0
  ) {
    return (
      <p className="properties-field__hint">
        Acesso público ou via CLI/gsutil — não exige ligação a VM.
      </p>
    );
  }

  if (vms.length === 0 && pubsubTopics.length === 0 && workbenches.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue VMs, Workbench ou tópicos Pub/Sub a este bucket.
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
