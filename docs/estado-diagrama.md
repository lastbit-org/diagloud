# Estado do diagrama (Zustand)

## Por que Zustand e não Context?

| | Zustand | Context |
|---|---------|---------|
| Re-renders | Só quem usa o slice mudado | Tende a re-renderizar árvore inteira |
| React Flow | Muitas atualizações (drag) | Context + `useMemo` vira trabalho extra |
| Boilerplate | Pouco | Provider + reducer + tipos |
| Fora do React | `getState()` / `subscribe` | Não |

**Regra:** o store guarda `DiagramNode[]` e `DiagramEdge[]` (seus tipos). O React Flow é **vista** — converte com adaptadores em `components/canvas/`.

## Onde fica no projeto

```
src/
├── store/diagramStore.ts   # fonte da verdade
├── lib/id.ts               # ids estáveis
├── lib/defaults.ts         # props iniciais por ResourceKind
└── hooks/                  # (depois) selectors finos, ex. useSelectedNode()
```

## API do store

| Action | Uso |
|--------|-----|
| `addNode(kind, position, data?)` | Paleta adiciona recurso |
| `updateNodePosition(id, pos)` | `onNodesChange` do React Flow |
| `updateNodeData(id, partial)` | Painel de propriedades |
| `removeNode(id)` | Delete — remove arestas ligadas |
| `addEdge({ source, target, kind })` | `onConnect` |
| `removeEdge(id)` | Delete aresta |
| `selectNode(id \| null)` | Clique no nó |
| `loadDocument` / `getDocument` | Import/export JSON |
| `reset` | Diagrama vazio |

## Uso nos componentes

```tsx
// Só nodes (evita re-render quando edges mudam)
const nodes = useDiagramStore((s) => s.nodes);
const addNode = useDiagramStore((s) => s.addNode);

// Vários campos de uma vez
const { nodes, edges, selectNode } = useDiagramStore((s) => ({
  nodes: s.nodes,
  edges: s.edges,
  selectNode: s.selectNode,
}));
```

## Próximo passo: ligar ao React Flow

1. `toFlowNodes(nodes)` / `toFlowEdges(edges)` em `components/canvas/adapters.ts`
2. `onNodesChange` → aplicar mudanças de posição no store
3. `onConnect` → `addEdge` com `kind` derivado dos kinds dos nós (em `model/connections.ts`)

Ver implementação em `src/store/diagramStore.ts`.
