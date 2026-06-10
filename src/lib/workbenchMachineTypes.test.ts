import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKBENCH_MACHINE_TYPE,
  isWorkbenchMachineType,
  WORKBENCH_MACHINE_TYPES,
} from "./workbenchMachineTypes";

describe("workbenchMachineTypes", () => {
  it("expõe cinco opções com n1-standard-4 como padrão", () => {
    expect(WORKBENCH_MACHINE_TYPES).toHaveLength(5);
    expect(DEFAULT_WORKBENCH_MACHINE_TYPE).toBe("n1-standard-4");
  });

  it("valida tipos conhecidos", () => {
    expect(isWorkbenchMachineType("e2-highmem-4")).toBe(true);
    expect(isWorkbenchMachineType("custom-type")).toBe(false);
  });
});
