import type { ConnectionInvalidReason } from "../model/connections";

const MESSAGES: Record<ConnectionInvalidReason, string> = {
  "same-node": "Não é possível ligar um recurso a si mesmo.",
  cycle:
    "Esta ligação fecharia um ciclo inválido no diagrama (ex.: VPC ↔ sub-rede).",
  "unknown-node": "Recursos da ligação não foram encontrados.",
  "invalid-types": "Esta ligação não é permitida (ex.: VM → VPC direto).",
  "invalid-handles": "Use os pontos de conexão nos lados do recurso.",
  "duplicate-edge": "Esta ligação já existe no diagrama.",
  "subnet-has-vpc": "Esta sub-rede já está ligada a uma VPC.",
  "vm-has-subnet": "Esta VM já está ligada a uma sub-rede.",
  "vm-has-iam": "Esta VM já está ligada a uma identidade IAM.",
  "vm-has-nat": "Esta VM já está ligada a um Cloud NAT.",
  "subnet-invalid-cidr": "A sub-rede precisa de um CIDR válido antes de receber VMs.",
  "subnet-vm-capacity":
    "Não há mais endereços de IP disponíveis para esse range de sub-rede.",
  "sql-has-subnet": "Esta instância Cloud SQL já está ligada a uma sub-rede.",
  "sql-not-private":
    "Cloud SQL em modo público não se liga à sub-rede. Altere o acesso para privado.",
  "subnet-sql-capacity":
    "Não há mais endereços de IP na sub-rede para Cloud SQL privado (após as VMs).",
  "memorystore-has-subnet":
    "Esta instância Memorystore já está ligada a uma sub-rede.",
  "subnet-memorystore-capacity":
    "Não há mais endereços de IP na sub-rede para Memorystore (após os demais recursos).",
  "gke-has-subnet": "Este cluster GKE já está ligado a uma sub-rede.",
  "subnet-gke-capacity":
    "Não há mais endereços de IP na sub-rede para o cluster GKE.",
  "nat-has-vpc": "Este Cloud NAT já está ligado a uma VPC.",
  "nat-has-router": "Este Cloud NAT já está ligado a um Cloud Router.",
  "router-has-vpc": "Este Cloud Router já está ligado a uma VPC.",
  "vpn-has-vpc": "Este Cloud VPN já está ligado a uma VPC.",
  "interconnect-has-vpc":
    "Este Cloud Interconnect já está ligado a uma VPC.",
  "firewall-has-vpc": "Esta regra de firewall já está ligada a uma VPC.",
  "peering-has-max-vpcs":
    "Este VPC Peering já está ligado a duas VPCs (máximo permitido).",
  "subnet-has-nat": "Esta sub-rede já está ligada a um Cloud NAT.",
  "run-has-subnet": "Este serviço Cloud Run já está ligado a uma sub-rede.",
  "run-not-vpc":
    "Cloud Run em modo público não se liga à sub-rede. Altere o acesso para VPC connector.",
  "subnet-run-capacity":
    "Não há mais endereços de IP na sub-rede para Cloud Run (após VMs, SQL e GKE).",
  "workbench-has-subnet":
    "Este Vertex AI Workbench já está ligado a uma sub-rede.",
  "subnet-workbench-capacity":
    "Não há mais endereços de IP na sub-rede para Vertex AI Workbench (após VMs, SQL, GKE e Cloud Run).",
  "notebook-has-subnet":
    "Este Notebook (Vertex AI) já está ligado a uma sub-rede.",
  "subnet-notebook-capacity":
    "Não há mais endereços de IP na sub-rede para Notebook (após VMs, SQL, GKE, Cloud Run e Workbench).",
  "psc-has-subnet":
    "Este endpoint Private Service Connect já está ligado a uma sub-rede.",
  "subnet-psc-capacity":
    "Não há mais endereços de IP na sub-rede para Private Service Connect.",
  "spark-has-subnet":
    "Este Apache Spark (cluster) já está ligado a uma sub-rede.",
  "spark-not-cluster":
    "Apache Spark em modo serverless não se liga à sub-rede. Altere o modo para cluster.",
  "airflow-has-subnet":
    "Este ambiente Managed Airflow já está ligado a uma sub-rede.",
  "dataflow-has-subnet":
    "Este job Cloud Dataflow já está ligado a uma sub-rede.",
};

export function connectionErrorMessage(reason: ConnectionInvalidReason): string {
  return MESSAGES[reason];
}
