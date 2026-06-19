import type { DiagramEdge } from "./diagram";
import type { ResourceKind } from "./resources";

/**
 * Regras de conexão do MVP — ver {@link ../docs/regras-conexao.md}.
 *
 * Hierarquia: VPC ← Sub-rede ← VM; VM → Cloud Storage
 * - Sub-rede → VPC (`subnet-vpc`): no máximo 1 VPC por sub-rede
 * - VM → Sub-rede (`vm-subnet`): no máximo 1 sub-rede por VM
 * - VM → Cloud Storage (`vm-storage`): acesso da VM ao bucket
 * - VM → IAM (`vm-iam`): conta de serviço ou identidade da VM
 * - VM → Cloud NAT (`vm-nat`): egress documentado via NAT
 * - VM → Firewall (`vm-firewall`): regras que se aplicam à VM
 * - VM → VM (`vm-vm`): comunicação entre instâncias
 * - VM / Cloud Run / GKE → BigQuery (`vm-bigquery`, `run-bigquery`, `gke-bigquery`)
 * - Cloud Storage → Dataflow / BigQuery / GKE / Cloud Run
 * - Pub/Sub → VM / GKE / Cloud SQL / Workbench (além dos destinos existentes)
 * - Cloud Dataflow → Pub/Sub / Cloud SQL / Firestore (além de Storage / BigQuery)
 * - BigQuery → Cloud Storage / Cloud Dataflow (exportação e pipelines)
 * - Cloud SQL → Sub-rede (`sql-subnet`): IP privado na sub-rede (modo privado)
 * - Cloud NAT → VPC (`nat-vpc`): gateway NAT na VPC
 * - Cloud Router → VPC (`router-vpc`): roteador BGP/NAT na VPC (opcional)
 * - VPC Peering → VPC (`peering-vpc`): peering entre duas VPCs (máx. 2 por peering)
 * - Cloud VPN → VPC (`vpn-vpc`): gateway VPN na VPC
 * - Cloud Interconnect → VPC (`interconnect-vpc`): anexo dedicado na VPC
 * - Firewall → VPC (`firewall-vpc`): regra de firewall na VPC
 * - Cloud DNS → VPC (`dns-vpc`): zona privada visível na VPC
 * - Internet → Cloud VPN (`internet-vpn`): túnel híbrido (on-prem / rede externa)
 * - Internet → Cloud Interconnect (`internet-interconnect`): link dedicado on-prem
 * - Internet → Cloud NAT (`internet-nat`): saída para a internet
 * - Sub-rede → Cloud NAT (`subnet-nat`): sub-rede com egress via NAT
 * - GKE / VM / Cloud Run → Artifact Registry: pull de imagens
 * - Cloud Build → Artifact Registry (`build-artifact`): push de imagens
 * - Pub/Sub → Cloud Build (`pubsub-build`): trigger de pipeline
 * - Cloud Storage → Cloud Build (`storage-build`): código-fonte no bucket
 * - GitHub → Cloud Build / Cloud Run / GKE (`github-build`, `github-run`, `github-gke`): CI/CD e deploy contínuo
 * - Cloud Shell → Projeto / compute / dados / CI (`cloudshell-*`): administração via console (gcloud, kubectl, bq)
 * - Cloud Run → Sub-rede (`run-subnet`): VPC connector (modo VPC)
 * - Pub/Sub → Cloud Run (`pubsub-run`): push subscription / evento
 * - Pub/Sub → Cloud Storage (`pubsub-storage`): exportação para bucket
 * - Pub/Sub → BigQuery (`pubsub-bigquery`): streaming para tabela
 * - VM / GKE / Cloud Run → Cloud Spanner: acesso de aplicações
 * - Pub/Sub → Cloud Spanner (`pubsub-spanner`): ingestão assíncrona
 * - Vertex AI Workbench → Sub-rede (`workbench-subnet`): notebook na VPC
 * - VM / GKE / Cloud Run → Firestore: acesso de aplicações NoSQL
 * - Firebase → Firestore / Cloud Storage / Cloud Run: serviços da plataforma
 * - VM / GKE / Cloud Run / Usuário → Firebase: clientes e apps
 * - VM / GKE / Cloud Run → Cloud Bigtable: acesso de aplicações
 * - Apache Spark / Cloud Dataflow → Cloud Bigtable: pipelines analíticos
 * - Vertex AI Notebook → Sub-rede e dados (como Workbench)
 * - Pub/Sub → Firestore (`pubsub-firestore`): eventos e sincronização
 * - Pub/Sub / Cloud Storage → Eventarc: fontes de eventos
 * - Eventarc → Cloud Run / GKE (`eventarc-run`, `eventarc-gke`): destinos do roteamento
 * - Compute e dados → Cloud KMS (`*-kms`): criptografia com chaves gerenciadas (CMEK)
 * - Vertex AI Workbench → Storage / BigQuery / Spanner / Firestore: acesso a dados
 * - Apache Spark → Sub-rede (`spark-subnet`, modo cluster): execução na VPC
 * - Apache Spark → Storage / BigQuery / Cloud KMS: leitura de dados e criptografia
 * - Managed Airflow → Storage / BigQuery / Cloud KMS / Dataflow / Spark / Cloud Run / Cloud SQL
 * - Apache Spark → Storage / BigQuery / Cloud SQL / VM / Bigtable
 * - Cloud NAT → Cloud Router (`nat-router`); Router → VPN / Interconnect
 * - Cloud DNS → VM / GKE / Dataflow na VPC (além de `dns-vpc`)
 * - VPC ↔ peering / VPN / Interconnect via recursos de rede existentes
 * - Pub/Sub → Managed Airflow (`pubsub-airflow`): triggers e sensores
 * - Cloud Dataflow → Sub-rede (`dataflow-subnet`): workers na VPC
 * - Cloud Dataflow → Storage / BigQuery / Cloud KMS: leitura, escrita e criptografia
 * - Pub/Sub → Cloud Dataflow (`pubsub-dataflow`): entrada streaming
 * - Vertex AI Workbench / Cloud Build → Model Registry: registro de modelos
 * - Model Registry → Cloud Run / GKE / Storage / Cloud KMS: deploy e artefatos
 * - Organization Policy → Pasta / Projeto (opcional; pode ficar isolada no diagrama)
 * - Cloud Load Balancing → VM / GKE / Cloud Run / VPC (backends e LB interno)
 * - Internet → Cloud Load Balancing (entrada pública)
 * - Private Service Connect → Sub-rede (endpoint com IP privado; VPC via sub-rede)
 * - PSC → serviço gerenciado (ex.: Cloud SQL via service attachment)
 * - VM / GKE / Cloud Run → PSC (consumidores do endpoint)
 * - Compute e CI/CD → Secret Manager; Secret Manager → Cloud KMS (CMEK)
 * - Recursos → Zona (`zone-link`): agrupamento visual no diagrama
 * - Pasta → Projeto (`folder-project`): projeto contido na pasta
 * - IAM → Projeto / Sub-rede / KMS / BigQuery: identidade e permissões
 * - VPC pode ter várias sub-redes; VM pode ligar a vários buckets
 */
export const EDGE_ENDPOINTS = {
  "subnet-vpc": { from: "subnet", to: "vpc" },
  "vm-subnet": { from: "vm", to: "subnet" },
  "vm-storage": { from: "vm", to: "storage" },
  "vm-iam": { from: "vm", to: "iam" },
  "vm-nat": { from: "vm", to: "nat" },
  "vm-firewall": { from: "vm", to: "firewall" },
  "vm-vm": { from: "vm", to: "vm" },
  "vm-bigquery": { from: "vm", to: "bigquery" },
  "sql-subnet": { from: "sql", to: "subnet" },
  "gke-subnet": { from: "gke", to: "subnet" },
  "nat-vpc": { from: "nat", to: "vpc" },
  "router-vpc": { from: "router", to: "vpc" },
  "peering-vpc": { from: "peering", to: "vpc" },
  "vpn-vpc": { from: "vpn", to: "vpc" },
  "interconnect-vpc": { from: "interconnect", to: "vpc" },
  "firewall-vpc": { from: "firewall", to: "vpc" },
  "dns-vpc": { from: "dns", to: "vpc" },
  "dns-vm": { from: "dns", to: "vm" },
  "dns-gke": { from: "dns", to: "gke" },
  "dns-dataflow": { from: "dns", to: "dataflow" },
  "nat-router": { from: "nat", to: "router" },
  "router-vpn": { from: "router", to: "vpn" },
  "router-interconnect": { from: "router", to: "interconnect" },
  "internet-nat": { from: "internet", to: "nat" },
  "internet-vpn": { from: "internet", to: "vpn" },
  "internet-interconnect": { from: "internet", to: "interconnect" },
  "subnet-nat": { from: "subnet", to: "nat" },
  "gke-artifact": { from: "gke", to: "artifact" },
  "gke-bigquery": { from: "gke", to: "bigquery" },
  "vm-artifact": { from: "vm", to: "artifact" },
  "run-subnet": { from: "run", to: "subnet" },
  "run-artifact": { from: "run", to: "artifact" },
  "run-bigquery": { from: "run", to: "bigquery" },
  "build-artifact": { from: "build", to: "artifact" },
  "pubsub-build": { from: "pubsub", to: "build" },
  "storage-build": { from: "storage", to: "build" },
  "storage-dataflow": { from: "storage", to: "dataflow" },
  "storage-bigquery": { from: "storage", to: "bigquery" },
  "storage-gke": { from: "storage", to: "gke" },
  "storage-run": { from: "storage", to: "run" },
  "github-build": { from: "github", to: "build" },
  "github-run": { from: "github", to: "run" },
  "github-gke": { from: "github", to: "gke" },
  "cloudshell-project": { from: "cloudshell", to: "project" },
  "cloudshell-vm": { from: "cloudshell", to: "vm" },
  "cloudshell-gke": { from: "cloudshell", to: "gke" },
  "cloudshell-run": { from: "cloudshell", to: "run" },
  "cloudshell-storage": { from: "cloudshell", to: "storage" },
  "cloudshell-bigquery": { from: "cloudshell", to: "bigquery" },
  "cloudshell-sql": { from: "cloudshell", to: "sql" },
  "cloudshell-build": { from: "cloudshell", to: "build" },
  "pubsub-run": { from: "pubsub", to: "run" },
  "pubsub-storage": { from: "pubsub", to: "storage" },
  "pubsub-bigquery": { from: "pubsub", to: "bigquery" },
  "pubsub-vm": { from: "pubsub", to: "vm" },
  "pubsub-gke": { from: "pubsub", to: "gke" },
  "pubsub-sql": { from: "pubsub", to: "sql" },
  "pubsub-workbench": { from: "pubsub", to: "workbench" },
  "pubsub-notebook": { from: "pubsub", to: "notebook" },
  "vm-spanner": { from: "vm", to: "spanner" },
  "vm-bigtable": { from: "vm", to: "bigtable" },
  "vm-firebase": { from: "vm", to: "firebase" },
  "gke-spanner": { from: "gke", to: "spanner" },
  "gke-bigtable": { from: "gke", to: "bigtable" },
  "gke-firebase": { from: "gke", to: "firebase" },
  "run-spanner": { from: "run", to: "spanner" },
  "run-bigtable": { from: "run", to: "bigtable" },
  "run-firebase": { from: "run", to: "firebase" },
  "pubsub-spanner": { from: "pubsub", to: "spanner" },
  "pubsub-bigtable": { from: "pubsub", to: "bigtable" },
  "workbench-subnet": { from: "workbench", to: "subnet" },
  "workbench-storage": { from: "workbench", to: "storage" },
  "workbench-bigquery": { from: "workbench", to: "bigquery" },
  "workbench-spanner": { from: "workbench", to: "spanner" },
  "workbench-bigtable": { from: "workbench", to: "bigtable" },
  "vm-firestore": { from: "vm", to: "firestore" },
  "gke-firestore": { from: "gke", to: "firestore" },
  "run-firestore": { from: "run", to: "firestore" },
  "pubsub-firestore": { from: "pubsub", to: "firestore" },
  "workbench-firestore": { from: "workbench", to: "firestore" },
  "firebase-firestore": { from: "firebase", to: "firestore" },
  "firebase-storage": { from: "firebase", to: "storage" },
  "firebase-run": { from: "firebase", to: "run" },
  "pcuser-firebase": { from: "pcuser", to: "firebase" },
  "notebook-subnet": { from: "notebook", to: "subnet" },
  "notebook-storage": { from: "notebook", to: "storage" },
  "notebook-bigquery": { from: "notebook", to: "bigquery" },
  "notebook-spanner": { from: "notebook", to: "spanner" },
  "notebook-firestore": { from: "notebook", to: "firestore" },
  "notebook-bigtable": { from: "notebook", to: "bigtable" },
  "notebook-modelregistry": { from: "notebook", to: "modelregistry" },
  "spark-subnet": { from: "spark", to: "subnet" },
  "spark-storage": { from: "spark", to: "storage" },
  "spark-bigquery": { from: "spark", to: "bigquery" },
  "spark-sql": { from: "spark", to: "sql" },
  "spark-vm": { from: "spark", to: "vm" },
  "spark-bigtable": { from: "spark", to: "bigtable" },
  "spark-kms": { from: "spark", to: "kms" },
  "airflow-subnet": { from: "airflow", to: "subnet" },
  "airflow-storage": { from: "airflow", to: "storage" },
  "airflow-bigquery": { from: "airflow", to: "bigquery" },
  "airflow-dataflow": { from: "airflow", to: "dataflow" },
  "airflow-spark": { from: "airflow", to: "spark" },
  "airflow-run": { from: "airflow", to: "run" },
  "airflow-sql": { from: "airflow", to: "sql" },
  "airflow-kms": { from: "airflow", to: "kms" },
  "pubsub-airflow": { from: "pubsub", to: "airflow" },
  "dataflow-subnet": { from: "dataflow", to: "subnet" },
  "dataflow-storage": { from: "dataflow", to: "storage" },
  "dataflow-bigquery": { from: "dataflow", to: "bigquery" },
  "dataflow-sql": { from: "dataflow", to: "sql" },
  "dataflow-firestore": { from: "dataflow", to: "firestore" },
  "dataflow-bigtable": { from: "dataflow", to: "bigtable" },
  "dataflow-pubsub": { from: "dataflow", to: "pubsub" },
  "dataflow-kms": { from: "dataflow", to: "kms" },
  "pubsub-dataflow": { from: "pubsub", to: "dataflow" },
  "bigquery-storage": { from: "bigquery", to: "storage" },
  "bigquery-dataflow": { from: "bigquery", to: "dataflow" },
  "workbench-modelregistry": { from: "workbench", to: "modelregistry" },
  "workbench-tuning": { from: "workbench", to: "tuning" },
  "notebook-tuning": { from: "notebook", to: "tuning" },
  "tuning-modelregistry": { from: "tuning", to: "modelregistry" },
  "workbench-evaluation": { from: "workbench", to: "evaluation" },
  "notebook-evaluation": { from: "notebook", to: "evaluation" },
  "evaluation-modelregistry": { from: "evaluation", to: "modelregistry" },
  "modelregistry-endpoints": { from: "modelregistry", to: "endpoints" },
  "endpoints-run": { from: "endpoints", to: "run" },
  "endpoints-gke": { from: "endpoints", to: "gke" },
  "batchinference-modelregistry": { from: "batchinference", to: "modelregistry" },
  "batchinference-storage": { from: "batchinference", to: "storage" },
  "featurestore-bigquery": { from: "featurestore", to: "bigquery" },
  "featurestore-storage": { from: "featurestore", to: "storage" },
  "workbench-experiments": { from: "workbench", to: "experiments" },
  "notebook-experiments": { from: "notebook", to: "experiments" },
  "experiments-modelregistry": { from: "experiments", to: "modelregistry" },
  "training-modelregistry": { from: "training", to: "modelregistry" },
  "pipelines-training": { from: "pipelines", to: "training" },
  "pipelines-modelregistry": { from: "pipelines", to: "modelregistry" },
  "mlmonitoring-experiments": { from: "mlmonitoring", to: "experiments" },
  "mlmonitoring-endpoints": { from: "mlmonitoring", to: "endpoints" },
  "build-modelregistry": { from: "build", to: "modelregistry" },
  "modelregistry-run": { from: "modelregistry", to: "run" },
  "modelregistry-gke": { from: "modelregistry", to: "gke" },
  "modelregistry-storage": { from: "modelregistry", to: "storage" },
  "modelregistry-kms": { from: "modelregistry", to: "kms" },
  "pubsub-eventarc": { from: "pubsub", to: "eventarc" },
  "storage-eventarc": { from: "storage", to: "eventarc" },
  "eventarc-run": { from: "eventarc", to: "run" },
  "eventarc-gke": { from: "eventarc", to: "gke" },
  "vm-kms": { from: "vm", to: "kms" },
  "gke-kms": { from: "gke", to: "kms" },
  "run-kms": { from: "run", to: "kms" },
  "storage-kms": { from: "storage", to: "kms" },
  "sql-kms": { from: "sql", to: "kms" },
  "bigquery-kms": { from: "bigquery", to: "kms" },
  "firestore-kms": { from: "firestore", to: "kms" },
  "spanner-kms": { from: "spanner", to: "kms" },
  "bigtable-kms": { from: "bigtable", to: "kms" },
  "pcuser-entra": { from: "pcuser", to: "entra" },
  "pcuser-vm": { from: "pcuser", to: "vm" },
  "pcuser-run": { from: "pcuser", to: "run" },
  "pcuser-onprem": { from: "pcuser", to: "onprem" },
  "entra-vm": { from: "entra", to: "vm" },
  "entra-run": { from: "entra", to: "run" },
  "entra-gke": { from: "entra", to: "gke" },
  "onprem-entra": { from: "onprem", to: "entra" },
  "onprem-vpn": { from: "onprem", to: "vpn" },
  "onprem-interconnect": { from: "onprem", to: "interconnect" },
  "onprem-vm": { from: "onprem", to: "vm" },
  "folder-folder": { from: "folder", to: "folder" },
  "folder-project": { from: "folder", to: "project" },
  "iam-project": { from: "iam", to: "project" },
  "iam-subnet": { from: "iam", to: "subnet" },
  "iam-kms": { from: "iam", to: "kms" },
  "iam-bigquery": { from: "iam", to: "bigquery" },
  "internet-loadbalancer": { from: "internet", to: "loadbalancer" },
  "loadbalancer-vm": { from: "loadbalancer", to: "vm" },
  "loadbalancer-gke": { from: "loadbalancer", to: "gke" },
  "loadbalancer-run": { from: "loadbalancer", to: "run" },
  "loadbalancer-vpc": { from: "loadbalancer", to: "vpc" },
  "internet-cdn": { from: "internet", to: "cdn" },
  "cdn-storage": { from: "cdn", to: "storage" },
  "cdn-loadbalancer": { from: "cdn", to: "loadbalancer" },
  "cdn-vm": { from: "cdn", to: "vm" },
  "cdn-gke": { from: "cdn", to: "gke" },
  "cdn-run": { from: "cdn", to: "run" },
  "orgpolicy-folder": { from: "orgpolicy", to: "folder" },
  "orgpolicy-project": { from: "orgpolicy", to: "project" },
  "psc-subnet": { from: "psc", to: "subnet" },
  "psc-sql": { from: "psc", to: "sql" },
  "vm-psc": { from: "vm", to: "psc" },
  "gke-psc": { from: "gke", to: "psc" },
  "run-psc": { from: "run", to: "psc" },
  "vm-secretmanager": { from: "vm", to: "secretmanager" },
  "gke-secretmanager": { from: "gke", to: "secretmanager" },
  "run-secretmanager": { from: "run", to: "secretmanager" },
  "build-secretmanager": { from: "build", to: "secretmanager" },
  "airflow-secretmanager": { from: "airflow", to: "secretmanager" },
  "secretmanager-kms": { from: "secretmanager", to: "kms" },
  "loadbalancer-certificatemanager": {
    from: "loadbalancer",
    to: "certificatemanager",
  },
  "cdn-certificatemanager": { from: "cdn", to: "certificatemanager" },
  "certificatemanager-dns": { from: "certificatemanager", to: "dns" },
  "internet-apigee": { from: "internet", to: "apigee" },
  "apigee-vm": { from: "apigee", to: "vm" },
  "apigee-gke": { from: "apigee", to: "gke" },
  "apigee-run": { from: "apigee", to: "run" },
  "apigee-vpc": { from: "apigee", to: "vpc" },
  "apigee-dns": { from: "apigee", to: "dns" },
  "memorystore-subnet": { from: "memorystore", to: "subnet" },
  "vm-memorystore": { from: "vm", to: "memorystore" },
  "gke-memorystore": { from: "gke", to: "memorystore" },
  "run-memorystore": { from: "run", to: "memorystore" },
  "memorystore-kms": { from: "memorystore", to: "kms" },
  "alloydb-subnet": { from: "alloydb", to: "subnet" },
  "vm-alloydb": { from: "vm", to: "alloydb" },
  "gke-alloydb": { from: "gke", to: "alloydb" },
  "run-alloydb": { from: "run", to: "alloydb" },
  "alloydb-kms": { from: "alloydb", to: "kms" },
  "infocard-link": { from: "infocard", to: "vpc" },
  "zone-link": { from: "vpc", to: "zone" },
} as const satisfies Record<
  DiagramEdge["kind"],
  { from: ResourceKind; to: ResourceKind }
>;
