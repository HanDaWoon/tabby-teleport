export interface TeleportNode {
  metadata: {
    name: string
    labels?: Record<string, string>
  }
  spec: { hostname: string; addr: string }
  kind: string
  cluster?: string
}

export interface TeleportCluster {
  cluster_name: string
  status: string
}

export interface TeleportStatus {
  active?: {
    valid_until: string
    [key: string]: any
  }
}

export interface UserOverrideRule {
  label: string
  user: string
}

export interface TeleportConfig {
  tshPath: string
  defaultUser: string
  proxy: string
  loginUser: string
  authType: string
  cluster: string
  env: Record<string, string>
  userOverrides: UserOverrideRule[]
}
