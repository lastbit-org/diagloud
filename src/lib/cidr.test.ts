import { describe, expect, it } from "vitest";
import {
  cidrsOverlap,
  getUsableHostAddress,
  maxVmsForCidr,
  parseCidr,
  suggestSubnetCidr,
} from "./cidr";

describe("parseCidr", () => {
  it("normaliza CIDR válido", () => {
    expect(parseCidr("10.0.1.0/24")?.cidr).toBe("10.0.1.0/24");
  });

  it("rejeita rede fora da máscara", () => {
    expect(parseCidr("10.0.1.5/24")).toBeNull();
  });
});

describe("cidrsOverlap", () => {
  it("detecta sobreposição", () => {
    expect(cidrsOverlap("10.0.1.0/24", "10.0.1.128/25")).toBe(true);
    expect(cidrsOverlap("10.0.1.0/24", "10.0.2.0/24")).toBe(false);
  });
});

describe("GCP usable hosts", () => {
  it("primeira VM usa o 4º endereço do /24", () => {
    expect(getUsableHostAddress("10.0.1.0/24", 0)).toBe("10.0.1.4");
    expect(getUsableHostAddress("10.0.1.0/24", 1)).toBe("10.0.1.5");
  });

  it("calcula limite de VMs para /24", () => {
    expect(maxVmsForCidr("10.0.1.0/24")).toBe(251);
  });
});

describe("suggestSubnetCidr", () => {
  it("evita blocos já usados", () => {
    const next = suggestSubnetCidr(["10.0.0.0/24", "10.0.1.0/24"]);
    expect(next).toBe("10.0.2.0/24");
    expect(cidrsOverlap(next, "10.0.1.0/24")).toBe(false);
  });
});
