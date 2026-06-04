# Diagloud

Editor visual de arquitetura GCP (MVP: VPC, sub-rede, VM, Cloud Storage, Cloud SQL).

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
