# CIDR, sobreposição e IPs de VM (MVP)

## Sub-rede e CIDR

- Toda sub-rede precisa de um **CIDR** válido (`10.0.0.0/24`, prefixo `/8`–`/29`).
- Novas sub-redes recebem um bloco sugerido **sem sobrepor** as existentes (`10.0.0.0/24`, `10.0.1.0/24`, …).
- Edite CIDR no **painel Propriedades** (sub-rede selecionada ou lista “Todas as sub-redes”).

## IPs reservados pelo GCP (por sub-rede)

| Offset | Uso |
|--------|-----|
| +0 | Endereço de rede |
| +1 | Gateway padrão |
| +2 | DNS |
| +3 | Reservado (futuro) |
| último | Broadcast |

**Primeira VM** na sub-rede usa o **4º endereço** do bloco (`10.0.1.4` em `10.0.1.0/24`).

## Limite de VMs

`max VMs = tamanho do bloco − 4 reservados no início − 1 broadcast`

Ex.: `/24` → 256 − 5 = **251 VMs**.

Ao ligar VM → sub-rede, o IP é atribuído automaticamente na ordem da ligação.

## Código

| Função | Arquivo |
|--------|---------|
| Parse / overlap / IPs | `src/lib/cidr.ts` |
| Validação de CIDR | `src/model/subnet.ts` |
| Atribuição de IP | `src/model/ipAssignment.ts` |
| UI de edição | `src/components/panel/PropertiesPanel.tsx` |
