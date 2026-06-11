import { combineTerraformFiles } from "../model/terraform/generate";
import type { TerraformExportResult } from "../types/terraform";

export class TerraformExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TerraformExportError";
  }
}

function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadTerraformBundle(
  result: TerraformExportResult,
  moduleName: string,
): void {
  const combined = combineTerraformFiles(result.files);
  if (!combined.trim()) {
    throw new TerraformExportError("Nenhum conteúdo Terraform para exportar.");
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const slug = moduleName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "diagloud";
  downloadTextFile(combined, `${slug}-terraform-${stamp}.tf`);
}

export function downloadTerraformFile(
  result: TerraformExportResult,
  filename: string,
): void {
  const content = result.files[filename];
  if (!content) {
    throw new TerraformExportError(`Arquivo "${filename}" não encontrado.`);
  }
  downloadTextFile(content, filename);
}
