import {
  GkeNode,
  SqlNode,
  StorageNode,
  SubnetNode,
  VmNode,
  VpcNode,
} from "../nodes";

export const nodeTypes = {
  vpc: VpcNode,
  subnet: SubnetNode,
  vm: VmNode,
  storage: StorageNode,
  sql: SqlNode,
  gke: GkeNode,
};
