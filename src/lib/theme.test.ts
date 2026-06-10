import { describe, expect, it } from "vitest";
import { resolveAccentHex } from "./theme";

describe("resolveAccentHex", () => {
  it("usa tons diferentes para claro e escuro", () => {
    expect(resolveAccentHex("blue", "light")).toBe("#2563eb");
    expect(resolveAccentHex("blue", "dark")).toBe("#60a5fa");
  });
});
