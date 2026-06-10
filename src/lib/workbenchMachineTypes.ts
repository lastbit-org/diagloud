/** Tipos de máquina mais usados em instâncias Vertex AI Workbench. */
export const WORKBENCH_MACHINE_TYPES = [
  { value: "n1-standard-4", label: "n1-standard-4 (4 vCPU, 15 GB)" },
  { value: "e2-standard-4", label: "e2-standard-4 (4 vCPU, 16 GB)" },
  { value: "n1-highmem-8", label: "n1-highmem-8 (8 vCPU, 52 GB)" },
  { value: "n1-standard-8", label: "n1-standard-8 (8 vCPU, 30 GB)" },
  { value: "e2-highmem-4", label: "e2-highmem-4 (4 vCPU, 32 GB)" },
] as const;

export type WorkbenchMachineType =
  (typeof WORKBENCH_MACHINE_TYPES)[number]["value"];

export const DEFAULT_WORKBENCH_MACHINE_TYPE: WorkbenchMachineType =
  "n1-standard-4";

export function isWorkbenchMachineType(
  value: string,
): value is WorkbenchMachineType {
  return WORKBENCH_MACHINE_TYPES.some((option) => option.value === value);
}
