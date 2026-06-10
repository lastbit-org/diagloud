# Diagloud

Editor visual de arquitetura **Google Cloud Platform (GCP)** no navegador. Arraste recursos, conecte serviços com regras de validação e documente redes, computação, dados e integrações em um diagrama exportável.

O Diagloud é pensado para **design reviews**, **documentação de infraestrutura** e **rascunhos de arquitetura** — sem substituir o Terraform ou o console GCP, mas ajudando a comunicar como os componentes se relacionam.

## Link de Acesso

[https://lastbit-org.github.io/diagloud/](https://lastbit-org.github.io/diagloud/)

## Principais recursos

- **Canvas interativo** com pan, zoom, seleção e empilhamento (trazer para frente / enviar para trás)
- **Paleta lateral** alinhada às categorias do [console GCP](https://console.cloud.google.com/products)
- **Validação de conexões** — só permite ligações coerentes (ex.: sub-rede → VPC, VM → sub-rede)
- **Atribuição automática** de IP interno e região ao conectar VMs, GKE, Cloud Run, SQL privado e Workbench à sub-rede
- **Painel de propriedades** por recurso (nome, região, CIDR, modos de acesso, etc.)
- **Painel de validação** com avisos e erros (VM órfã, sub-rede sem VPC, CIDR inválido, etc.)
- **Nomenclatura configurável** com padrões `AREA`, `AMBIENTE` e sequência `##`
- **Zonas** redimensionáveis para agrupar recursos no diagrama
- **Exportação** em JSON (editável), PNG e SVG
- **Autosave** no `localStorage` do navegador
- **Tema claro/escuro** e **cor de destaque** personalizável (preferências persistidas)

## Stack

| Camada | Tecnologia                                  |
| ------ | ------------------------------------------- |
| UI     | React 19, TypeScript                        |
| Canvas | [@xyflow/react](https://reactflow.dev/) v12 |
| Estado | Zustand                                     |
| Build  | Vite 8                                      |
| Testes | Vitest                                      |

## Recursos disponíveis

Categorias espelham o menu _All products_ do GCP:

| Categoria              | Recursos                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Organização**        | Zona, Identificação (infocard)                                                           |
| **Rede**               | VPC, Sub-rede, Internet, Cloud NAT, VPC Peering, Cloud VPN, Cloud Interconnect, Firewall |
| **Computação**         | VM (Compute Engine), GKE, Cloud Run                                                      |
| **Armazenamento**      | Cloud Storage                                                                            |
| **Bancos de dados**    | Cloud SQL, BigQuery, Cloud Spanner, Firestore                                            |
| **IA**                 | Vertex AI Workbench                                                                      |
| **Integração**         | Pub/Sub, Eventarc                                                                        |
| **Identidade e híbrido** | Microsoft Entra ID, Usuário (PC), On-premises                                          |
| **Ferramentas**        | Artifact Registry, Cloud KMS                                                             |

Ícones oficiais GCP (pacote legacy) onde disponíveis.

## Regras de conexão (resumo)

O modelo segue uma hierarquia simplificada de rede e dependências de aplicação:

```
VPC ← Sub-rede ← VM / GKE / Cloud Run (VPC)
VM → Cloud Storage
Cloud SQL (privado) → Sub-rede
Cloud NAT / VPN / Interconnect / Firewall / Peering → VPC
Internet → Cloud VPN / Cloud Interconnect (híbrido)
Pub/Sub → Cloud Run, Storage, BigQuery, Spanner, Firestore, Eventarc
Pub/Sub / Cloud Storage → Eventarc → Cloud Run, GKE
VM / GKE / Run / Storage / SQL / BigQuery / Firestore / Spanner → Cloud KMS (CMEK)
Usuário (PC) → Entra ID / On-premises / VM / Cloud Run
Entra ID → VM / Cloud Run / GKE
On-premises → Entra ID / Cloud VPN / Cloud Interconnect / VM
Identificação (infocard) → qualquer recurso (exceto zona e outro infocard)
```

Detalhes completos em [`docs/regras-conexao.md`](docs/regras-conexao.md).

## Como usar

1. **Arraste** um recurso da paleta esquerda para o canvas.
2. **Conecte** pelos pontos nos lados dos nós (handles dinâmicos).
3. **Selecione** um nó para editar propriedades no painel direito.
4. Use **Validação** no painel lateral para revisar problemas do diagrama.
5. **Exporte** quando precisar compartilhar ou versionar o desenho.

Atalhos úteis: selecione um nó ou aresta e use **Excluir** no cabeçalho ou a tecla `Delete` / `Backspace`.

## Exportar e importar

| Ação            | Formato          | Uso                                                    |
| --------------- | ---------------- | ------------------------------------------------------ |
| Exportar → JSON | `.json`          | Reimportar, versionar, integrar com outras ferramentas |
| Exportar → PNG  | imagem 1920×1080 | Slides, Confluence, documentação                       |
| Exportar → SVG  | vetor            | Diagramas escaláveis                                   |
| Importar        | JSON             | Restaurar diagrama exportado                           |

### Autosave

- Chave no navegador: `diagloud-diagram`
- Alterações são salvas automaticamente (~400 ms após a última mudança)
- Recarregar a página restaura o último diagrama
- **Novo** limpa o canvas e grava o estado vazio

## Aparência

No canto superior direito do cabeçalho:

- **☀ / ☾** — alterna tema claro e escuro
- **Bolinha colorida** — escolhe a cor de destaque (roxo, azul, verde, laranja, turquesa, rosa)

As preferências ficam em `localStorage` (`diagloud-theme`).

## Desenvolvimento

Requisitos: Node.js 20+ (recomendado 22).

```bash
npm install
npm run dev      # servidor local (Vite)
npm run build    # build de produção
npm run test     # testes (Vitest)
npm run lint     # ESLint
npm run preview  # preview do build
```

### Estrutura do projeto

```
src/
  components/     # UI (canvas, paleta, painéis, nós)
  model/          # Validação, conexões, IPs, sub-redes
  store/          # Zustand (diagrama, nomenclatura, tema)
  types/          # Tipos do documento e recursos
  lib/            # JSON, CIDR, persistência, tema
docs/
  regras-conexao.md
```

### Testes

```bash
npm test
```

Cobertura principal: regras de conexão, documento JSON, CIDR, atribuição de IP e validação do diagrama.

## Deploy (GitHub Pages)

O projeto está configurado com `base: /diagloud/` no Vite. O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publica automaticamente no push para `main`.

Habilite **GitHub Pages** nas configurações do repositório (fonte: _GitHub Actions_).

## Licença e contribuição

Projeto privado / em evolução. Sugestões e PRs são bem-vindos conforme a política do repositório.

---

**Diagloud** — desenhe a nuvem antes de provisionar.
