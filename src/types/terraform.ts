export type TerraformExportOptions = {
  /** ID do projeto GCP (ex.: meu-proj-dev). */
  projectId: string;
  /** Nome do módulo ou prefixo lógico do stack Terraform. */
  moduleName: string;
  /** Região padrão quando o nó não define região explícita. */
  defaultRegion: string;
  /** Constraint de versão do provider hashicorp/google. */
  providerVersion: string;
};

export type TerraformExportResult = {
  files: Record<string, string>;
  warnings: string[];
};

export const DEFAULT_TERRAFORM_EXPORT_OPTIONS: TerraformExportOptions = {
  projectId: "",
  moduleName: "diagloud",
  defaultRegion: "southamerica-east1",
  providerVersion: "~> 6.0",
};
