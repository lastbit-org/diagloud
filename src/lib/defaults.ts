import { suggestSubnetCidr } from "./cidr";
import { generateResourceName } from "./naming";
import { getNamingConfig } from "../store/namingStore";
import type {
  DiagramNode,
  ResourceKind,
  ResourcePropsByKind,
  SubnetProps,
  VmProps,
  VpcProps,
} from "../types";

export function defaultResourceData<K extends ResourceKind>(
  kind: K,
  context?: { existingSubnetCidrs?: string[]; nodes?: DiagramNode[] },
): ResourcePropsByKind[K] {
  const nodes = context?.nodes ?? [];
  const naming = getNamingConfig();
  const name = naming.isActive
    ? generateResourceName(
        kind,
        naming.patterns,
        { area: naming.area, ambiente: naming.ambiente },
        nodes,
      )
    : legacyDefaultName(kind, nodes);

  switch (kind) {
    case "vpc":
      return { name } as VpcProps as ResourcePropsByKind[K];
    case "subnet":
      return {
        name,
        region: "southamerica-east1",
        cidr: suggestSubnetCidr(context?.existingSubnetCidrs ?? []),
      } as SubnetProps as ResourcePropsByKind[K];
    case "vm":
      return {
        name,
        machineType: "e2-micro",
      } as VmProps as ResourcePropsByKind[K];
  }
}

function legacyDefaultName(kind: ResourceKind, nodes: DiagramNode[]): string {
  const count = nodes.filter((n) => n.kind === kind).length + 1;
  switch (kind) {
    case "vpc":
      return `vpc-${count}`;
    case "subnet":
      return `subnet-${count}`;
    case "vm":
      return `vm-${count}`;
  }
}
