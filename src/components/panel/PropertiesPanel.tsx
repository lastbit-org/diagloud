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
import type { DiagramNode } from "../../types";
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
