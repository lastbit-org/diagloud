/** IDs dos handles React Flow — devem bater com `NodeHandles` e `model/connections`. */
export const HANDLE_IDS = {
  vpc: {
    in: "vpc-in",
  },
  subnet: {
    toVpc: "subnet-to-vpc",
    fromVm: "subnet-from-vm",
    fromSql: "subnet-from-sql",
    fromGke: "subnet-from-gke",
  },
  vm: {
    toSubnet: "vm-to-subnet",
    toStorage: "vm-to-storage",
  },
  storage: {
    fromVm: "storage-from-vm",
  },
  sql: {
    toSubnet: "sql-to-subnet",
  },
  gke: {
    toSubnet: "gke-to-subnet",
  },
} as const;
