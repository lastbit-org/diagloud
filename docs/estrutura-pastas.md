# Estrutura de pastas — Diagloud

Convenção mínima para o editor de diagrama GCP (VPC, sub-rede, VM).  
Código da aplicação fica em `src/`.

## Árvore

```
src/
├── main.tsx                 # bootstrap React
├── App.tsx                  # layout da página (paleta | canvas | painel)
├── index.css                # estilos globais
│
├── types/                   # tipos e contratos (sem UI, sem React Flow)
├── model/                   # regras de domínio e persistência do diagrama
├── components/
│   ├── canvas/              # React Flow: área de desenho
│   ├── nodes/               # nós customizados (VPC, sub-rede, VM)
│   └── palette/             # lista de recursos para adicionar ao canvas
│
├── hooks/                   # (opcional) hooks que ligam UI ↔ model
├── lib/                     # (opcional) utilitários genéricos (ids, storage)
└── assets/                  # ícones SVG, imagens estáticas
```

## Responsabilidade de cada pasta

| Pasta | O que coloca aqui | O que **não** coloca |
|-------|-------------------|----------------------|
| `types/` | `ResourceKind`, props de VPC/sub-rede/VM, formato JSON do diagrama, tipos de aresta | Componentes React, chamadas ao `localStorage`, lógica de validação longa |
| `model/` | Validação de conexões, serializar/deserializar JSON, derivar hierarquia VPC→sub-rede→VM, lista de avisos | JSX, estilos, configuração do React Flow |
| `components/canvas/` | `DiagramCanvas`, registro de `nodeTypes`/`edgeTypes`, `onConnect`, pan/zoom, background | Definição visual de um nó VPC (isso é `nodes/`) |
| `components/nodes/` | Um componente por recurso: `VpcNode.tsx`, `SubnetNode.tsx`, `VmNode.tsx`, handles | Paleta, export de arquivo, regras de negócio |
| `components/palette/` | Itens arrastáveis/clicáveis que criam nós no canvas | Lógica de validação do grafo |

## Fluxo de dependências

Imports devem seguir esta direção (de baixo para cima):

```
types  →  model  →  components  →  App.tsx
```

- `types` não importa nada de `model` nem de `components`.
- `model` importa só de `types`.
- `components/*` importam de `types` e `model`; podem importar entre si apenas se fizer sentido (ex.: `canvas` importa tipos de nó de `nodes`).
- `App.tsx` monta o layout e conecta paleta + canvas + painel futuro.

## Arquivos esperados (MVP)

### `types/`

```
types/
├── index.ts           # reexporta tudo
├── resources.ts       # ResourceKind, VpcProps, SubnetProps, VmProps
├── diagram.ts         # DiagramNode, DiagramEdge, DiagramDocument
└── connections.ts     # ConnectionRule, tipos de aresta permitidos
```

### `model/`

```
model/
├── index.ts
├── connections.ts     # isValidConnection(source, target)
├── validation.ts      # avisos: VM órfã, sub-rede sem VPC, CIDR inválido
├── hierarchy.ts       # árvore VPC → sub-redes → VMs
└── persistence.ts     # toJSON / fromJSON, localStorage (fase 5)
```

### `components/canvas/`

```
components/canvas/
├── DiagramCanvas.tsx  # <ReactFlow … />
├── nodeTypes.ts       # mapa { vpc: VpcNode, subnet: SubnetNode, vm: VmNode }
└── canvas.css         # (opcional) estilos só do canvas
```

### `components/nodes/`

```
components/nodes/
├── index.ts
├── VpcNode.tsx
├── SubnetNode.tsx
├── VmNode.tsx
└── BaseNode.tsx       # (opcional) label + ícone compartilhados
```

### `components/palette/`

```
components/palette/
├── Palette.tsx
├── PaletteItem.tsx
└── palette.css
```

## Convenções de nome

- **Arquivos React:** `PascalCase.tsx` (`VpcNode.tsx`).
- **Arquivos sem UI:** `camelCase.ts` (`validation.ts`).
- **Tipos:** sufixo descritivo — `VpcProps`, `DiagramDocument`, não `IVpc`.
- **Kind do recurso:** string literal em minúsculo — `'vpc' | 'subnet' | 'vm'` (alinha com `nodeTypes` do React Flow).

## Onde fica cada preocupação

| Preocupação | Pasta |
|-------------|--------|
| “Posso ligar VM na sub-rede?” / matriz VPC←Sub-rede←VM | [regras-conexao.md](./regras-conexao.md) + `model/connections.ts` |
| “Como é o JSON salvo?” | `types/diagram.ts` + `model/persistence.ts` |
| “Como o nó VPC aparece?” | `components/nodes/VpcNode.tsx` |
| “Como adiciono um nó?” | `components/palette/` + estado no canvas/App |
| “O que é uma VM no domínio?” | `types/resources.ts` |

## Regra prática ao criar arquivo novo

1. É só tipo/interface? → `types/`
2. É regra ou transformação de dados? → `model/`
3. É UI do React Flow? → `canvas/` ou `nodes/`
4. É botão/lista para escolher recurso? → `palette/`

Se um arquivo crescer e misturar UI + validação, separar: UI fica no componente, validação vai para `model/`.

## Fora do escopo desta estrutura (fases futuras)

- `terraform/` ou `export/` — fase 2 (geração de `.tf`)
- `api/` — integração GCP
- Testes: espelhar pastas em `src/` → `tests/` ou `__tests__` ao lado do arquivo
