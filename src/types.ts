export interface TeleportNode {
  metadata: { name: string }
  spec: { hostname: string; addr: string }
  kind: string
}

export interface TeleportCluster {
  cluster_name: string
  status: string
}

export interface TeleportConfig {
  tshPath: string
  defaultUser: string
  proxy: string
  loginUser: string
  authType: string
  cluster: string
  env: Record<string, string>
}
