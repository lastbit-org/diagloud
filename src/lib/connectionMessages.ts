import type { ConnectionInvalidReason } from "../model/connections";

const MESSAGES: Record<ConnectionInvalidReason, string> = {
  "same-node": "Não é possível ligar um recurso a si mesmo.",
  cycle:
    "Esta ligação fecharia um ciclo inválido no diagrama (ex.: VPC ↔ sub-rede).",
  "unknown-node": "Recursos da ligação não foram encontrados.",
  "invalid-types": "Esta ligação não é permitida (ex.: VM → VPC direto).",
  "invalid-handles": "Use os pontos de conexão corretos em cada recurso.",
  "duplicate-edge": "Esta ligação já existe no diagrama.",
  "subnet-has-vpc": "Esta sub-rede já está ligada a uma VPC.",
  "vm-has-subnet": "Esta VM já está ligada a uma sub-rede.",
  "subnet-invalid-cidr": "A sub-rede precisa de um CIDR válido antes de receber VMs.",
  "subnet-vm-capacity":
    "Não há mais endereços de IP disponíveis para esse range de sub-rede.",
  "sql-has-subnet": "Esta instância Cloud SQL já está ligada a uma sub-rede.",
  "sql-not-private":
    "Cloud SQL em modo público não se liga à sub-rede. Altere o acesso para privado.",
  "subnet-sql-capacity":
    "Não há mais endereços de IP na sub-rede para Cloud SQL privado (após as VMs).",
  "gke-has-subnet": "Este cluster GKE já está ligado a uma sub-rede.",
  "subnet-gke-capacity":
    "Não há mais endereços de IP na sub-rede para o cluster GKE.",
};

export function connectionErrorMessage(reason: ConnectionInvalidReason): string {
  return MESSAGES[reason];
}
