import { describe, expect, it } from "vitest";
import { reassignSubnetVmIps } from "./ipAssignment";
import type { DiagramEdge, DiagramNode } from "../types";

const subnet: DiagramNode = {
  id: "subnet-1",
  kind: "subnet",
  position: { x: 0, y: 0 },
  data: {
    name: "sub",
    region: "southamerica-east1",
    cidr: "10.0.0.0/24",
  },
};

function vm(id: string, internalIp?: string): DiagramNode {
  return {
    id,
    kind: "vm",
    position: { x: 0, y: 0 },
    data: { name: id, machineType: "e2-micro", internalIp },
  };
}

function vmSubnetEdge(vmId: string): DiagramEdge {
  return {
    id: `e-${vmId}`,
    source: vmId,
    target: subnet.id,
    kind: "vm-subnet",
  };
}

describe("reassignSubnetVmIps", () => {
  it("reutiliza o primeiro IP livre após remover VM do meio", () => {
    const vmB = vm("vm-b", "10.0.0.5");
    const vmC = vm("vm-c");

    const edgesAfterRemove: DiagramEdge[] = [vmSubnetEdge("vm-b"), vmSubnetEdge("vm-c")];
    const nodes = reassignSubnetVmIps(
      subnet.id,
      [subnet, vmB, vmC],
      edgesAfterRemove,
    );

    const ipB = nodes.find((n) => n.id === "vm-b")?.data;
    const ipC = nodes.find((n) => n.id === "vm-c")?.data;
    expect(ipB && "internalIp" in ipB && ipB.internalIp).toBe("10.0.0.4");
    expect(ipC && "internalIp" in ipC && ipC.internalIp).toBe("10.0.0.5");
    expect(ipB && "region" in ipB && ipB.region).toBe("southamerica-east1");
    expect(ipC && "region" in ipC && ipC.region).toBe("southamerica-east1");
  });

  it("reatribui IP da VM restante quando a outra foi excluída (índice 0)", () => {
    const vmB = vm("vm-b", "10.0.0.5");
    const nodes = reassignSubnetVmIps(
      subnet.id,
      [subnet, vmB],
      [vmSubnetEdge("vm-b")],
    );

    const data = nodes.find((n) => n.id === "vm-b")?.data;
    expect(data && "internalIp" in data && data.internalIp).toBe("10.0.0.4");
    expect(data && "region" in data && data.region).toBe("southamerica-east1");
  });

  it("atualiza região das VMs quando a sub-rede muda de região", () => {
    const subnetUs = { ...subnet, data: { ...subnet.data, region: "us-central1" } };
    const vmB = vm("vm-b", "10.0.0.4");
    vmB.data = { ...vmB.data, region: "southamerica-east1" };

    const nodes = reassignSubnetVmIps(
      subnetUs.id,
      [subnetUs, vmB],
      [vmSubnetEdge("vm-b")],
    );

    const data = nodes.find((n) => n.id === "vm-b")?.data;
    expect(data && "region" in data && data.region).toBe("us-central1");
  });
});
