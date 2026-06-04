# Regras mínimas de conexão (MVP)

Diagrama hierárquico GCP: **VPC ← Sub-rede ← VM**.  
A seta indica a direção da aresta no editor (origem → destino).

```
        ┌─────────┐
        │   VPC   │
        └────▲────┘
             │ subnet-vpc (sub-rede → VPC)
        ┌────┴────┐
        │ Sub-rede│
        └────▲────┘
             │ vm-subnet (VM → sub-rede)
        ┌────┴────┐
        │   VM    │
        └─────────┘
```

## Matriz de tipos (o que pode ligar)

Linha = **origem** (source). Coluna = **destino** (target).

| Origem \ Destino | VPC | Sub-rede | VM |
|------------------|:---:|:--------:|:--:|
| **VPC**          | —   | ✗        | ✗  |
| **Sub-rede**     | ✓   | —        | ✗  |
| **VM**           | ✗   | ✓        | —  |

Legenda: **✓** permitido · **✗** bloqueado (`invalid-types`)

### Exemplos bloqueados no MVP

- VM → VPC direto  
- VPC → Sub-rede (sentido invertido)  
- Sub-rede → VM (sentido invertido)  
- Qualquer ligação entre recursos do mesmo tipo  

## Cardinalidade (MVP)

| Recurso   | Regra | Motivo no código        |
|-----------|-------|-------------------------|
| Sub-rede  | **1 VPC** no máximo | `subnet-has-vpc` |
| VM        | **1 sub-rede** no máximo | `vm-has-subnet` |
| VPC       | **N sub-redes** permitidas | várias arestas `subnet-vpc` com o mesmo `target` |

> No MVP futuro pode relaxar VM → N sub-redes; hoje o store impede uma segunda aresta `vm-subnet` com a mesma VM como origem.

## Handles (pontos de conexão)

| Recurso   | Handle (id)        | Tipo   | Posição  | Uso                          |
|-----------|--------------------|--------|----------|------------------------------|
| VPC       | `vpc-in`           | target | inferior | Recebe sub-rede              |
| Sub-rede  | `subnet-to-vpc`    | source | superior | Liga à VPC                   |
| Sub-rede  | `subnet-from-vm`   | target | inferior | Recebe VM                    |
| VM        | `vm-to-subnet`     | source | superior | Liga à sub-rede              |

Aresta só é válida se usar o par de handles correto (`invalid-handles` caso contrário).

## Tipos de aresta (`DiagramEdge.kind`)

| `kind`        | De → Para        | Significado GCP (simplificado)   |
|---------------|------------------|----------------------------------|
| `subnet-vpc`  | Sub-rede → VPC   | Sub-rede pertence à VPC          |
| `vm-subnet`   | VM → Sub-rede    | VM na sub-rede                   |

Definição em código: `src/types/connections.ts` (`EDGE_ENDPOINTS`).

## Outras regras

| Regra | Código `ConnectionInvalidReason` |
|-------|----------------------------------|
| Não ligar nó a si mesmo | `same-node` |
| Não fechar ciclo no grafo (ex.: VPC → sub-rede quando já existe sub-rede → VPC) | `cycle` |
| Nós inexistentes | `unknown-node` |
| Mesma ligação repetida | `duplicate-edge` |

## Onde é aplicado

| Camada | Arquivo |
|--------|---------|
| Validação | `src/model/connections.ts` → `validateConnection()` |
| Canvas (arraste) | `src/components/canvas/DiagramCanvas.tsx` → `isValidConnection` |
| Persistência | `src/store/diagramStore.ts` → `addEdge()` |
| Mensagens UI | `src/lib/connectionMessages.ts` |
| Testes | `src/model/connections.test.ts` |

## Definition of Done (esta task)

- [x] Matriz VPC ← Sub-rede ← VM documentada  
- [x] Cardinalidade: 1 VPC por sub-rede, 1 sub-rede por VM (MVP)  
- [x] Exemplos de ligações inválidas (ex.: VM → VPC)  
- [x] Referência aos handles e ao código  
- [x] Sem auto-ligação (`same-node`)  
- [x] Sem ciclos no grafo dirigido (`cycle`)  
