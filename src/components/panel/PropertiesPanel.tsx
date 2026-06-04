import { useEffect, useState } from "react";
import { maxVmsForCidr } from "../../lib/cidr";
import { useSelectedNode } from "../../hooks/useSelectedNode";
import {
  countVmsOnSubnet,
  getVmIdsOnSubnet,
  subnetCidrErrorMessage,
  validateSubnetCidr,
} from "../../model/subnet";
import { useDiagramStore } from "../../store/diagramStore";
import type {
  DiagramNode,
  SqlAccessMode,
  SqlEngine,
  StorageAccessMode,
  StorageClass,
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
  const selectNode = useDiagramStore((s) => s.selectNode);

  const allSubnets = nodes.filter(
    (n): n is Extract<DiagramNode, { kind: "subnet" }> => n.kind === "subnet",
  );

  const content = (
    <>
      <h2 className="properties-panel__title">Propriedades</h2>

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

function StorageVmInfo({
  storage,
  edges,
  nodes,
}: {
  storage: Extract<DiagramNode, { kind: "storage" }>;
  edges: ReturnType<typeof useDiagramStore.getState>["edges"];
  nodes: DiagramNode[];
}) {
  const linked = edges
    .filter((e) => e.kind === "vm-storage" && e.target === storage.id)
    .map((e) => nodes.find((n) => n.id === e.source && n.kind === "vm"))
    .filter((n): n is Extract<DiagramNode, { kind: "vm" }> => n != null);

  if (storage.data.accessMode === "public" && linked.length === 0) {
    return (
      <p className="properties-field__hint">
        Acesso público ou via CLI/gsutil — não exige ligação a VM.
      </p>
    );
  }

  if (linked.length === 0) {
    return (
      <p className="properties-field__hint">
        Ligue uma ou mais VMs a este bucket pelo handle lateral da VM.
      </p>
    );
  }

  return (
    <dl className="properties-stats">
      <dt>VMs com acesso</dt>
      <dd>{linked.map((vm) => vm.data.name).join(", ")}</dd>
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
