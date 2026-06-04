# Diagloud

Editor visual de arquitetura GCP (MVP: VPC, sub-rede, VM, GKE, Cloud Storage, Cloud SQL).

## Paleta de recursos

Os recursos na barra lateral seguem as categorias do [console GCP (All products)](https://console.cloud.google.com/products), como na [lista de produtos](https://cloud.google.com/docs/product-list):

| Categoria (console) | Recursos no Diagloud |
|---------------------|---------------------|
| **Networking** | VPC, Sub-rede |
| **Compute** | VM (Compute Engine), GKE |
| **Storage** | Cloud Storage |
| **Databases** | Cloud SQL |

## Desenvolvimento

```bash
npm install
npm run dev
```

## Salvar e carregar

No cabeçalho do app:

- **Exportar** (menu) — escolha o formato:
  - **JSON** — dados editáveis / reimportar
  - **PNG** — imagem 1920×1080 para documentação
  - **SVG** — vetor escalável do diagrama visível
- **Importar** — abre o seletor de arquivo e restaura um diagrama exportado em JSON.

### Autosave (localStorage)

- Chave: `diagloud-diagram`
- Qualquer alteração em nós ou arestas é salva automaticamente (~400 ms após a última mudança).
- **Recarregar a página** restaura o último diagrama (inclui posições, IPs, região e nomenclatura).
- **Novo** limpa o canvas e grava o diagrama vazio no localStorage.
