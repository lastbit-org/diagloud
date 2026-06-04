/** IDs dos handles React Flow — devem bater com `NodeHandles` e `model/connections`. */
export const HANDLE_IDS = {
  vpc: {
    in: "vpc-in",
  },
  subnet: {
    toVpc: "subnet-to-vpc",
    fromVm: "subnet-from-vm",
  },
  vm: {
    toSubnet: "vm-to-subnet",
  },
} as const;
