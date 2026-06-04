# Diagloud

Editor visual de arquitetura GCP (MVP: VPC, sub-rede, VM).

## Desenvolvimento

```bash
npm install
npm run dev
```

## Salvar e carregar

No cabeçalho do app:

- **Exportar** — baixa o diagrama atual como arquivo `.json` (nós, arestas, metadata).
- **Importar** — abre o seletor de arquivo e restaura um diagrama exportado.

O diagrama também é salvo automaticamente no `localStorage` do navegador ao editar.
