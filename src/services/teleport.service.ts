import { Injectable } from '@angular/core'
import { ConfigService, NotificationsService, Platform, HostAppService } from 'tabby-core'
import { execFile } from 'child_process'
import { TeleportNode, TeleportCluster, TeleportConfig, TeleportStatus, UserOverrideRule } from '../types'

@Injectable({ providedIn: 'root' })
export class TeleportService {
  private nodeCache: TeleportNode[] = []
  private loginStatusCache: { value: boolean; time: number } | null = null
  private static readonly LOGIN_CACHE_TTL = 10_000

  constructor (
    private config: ConfigService,
    private notifications: NotificationsService,
    private hostApp: HostAppService,
  ) {}

  private get teleportConfig (): TeleportConfig {
    return this.config.store.teleport
  }

  private exec (args: string[], timeout = 5000): Promise<string> {
    const tshPath = this.teleportConfig.tshPath || 'tsh'
    const env = this.teleportConfig.env ?? {}
    const hasEnv = Object.keys(env).length > 0
    return new Promise((resolve, reject) => {
      const child = execFile(tshPath, args, {
        timeout,
        ...hasEnv && { env: { ...process.env, ...env } },
      }, (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            reject(new Error('tsh command timed out'))
          } else {
            reject(new Error(stderr || error.message))
          }
          return
        }
        resolve(stdout)
      })
    })
  }

  async isLoggedIn (skipCache = false): Promise<boolean> {
    if (!skipCache && this.loginStatusCache && (Date.now() - this.loginStatusCache.time) < TeleportService.LOGIN_CACHE_TTL) {
      return this.loginStatusCache.value
    }
    try {
      const output = await this.exec(['status', '--format=json'])
      const status = JSON.parse(output.trim()) as TeleportStatus
      let value = !!status?.active
      if (value && status.active?.valid_until) {
        value = new Date(status.active.valid_until).getTime() > Date.now()
      }
      this.loginStatusCache = { value, time: Date.now() }
      return value
    } catch {
      this.loginStatusCache = { value: false, time: Date.now() }
      return false
    }
  }

  async listNodes (cluster?: string, search?: string): Promise<TeleportNode[]> {
    try {
      const args = ['ls', '--format=json']
      if (cluster) {
        args.push(`--cluster=${cluster}`)
      }
      if (search) {
        args.push(`--search=${search}`)
      }
      const output = await this.exec(args, 10000)
      const nodes = JSON.parse(output.trim()) as TeleportNode[]
      if (cluster) {
        nodes.forEach(n => n.cluster = cluster)
      }
      return nodes
    } catch (err: any) {
      this.notifications.error(`Failed to list Teleport nodes: ${err.message}`)
      return []
    }
  }

  async listClusters (): Promise<TeleportCluster[]> {
    try {
      const output = await this.exec(['clusters', '--format=json'])
      return JSON.parse(output.trim()) as TeleportCluster[]
    } catch (err: any) {
      this.notifications.error(`Failed to list Teleport clusters: ${err.message}`)
      return []
    }
  }

  async listAllNodes (): Promise<TeleportNode[]> {
    try {
      const clusters = await this.listClusters()
      let nodes: TeleportNode[]
      if (clusters.length <= 1) {
        nodes = await this.listNodes()
      } else {
        const results = await Promise.all(
          clusters
            .filter(c => c.status === 'online')
            .map(c => this.listNodes(c.cluster_name)),
        )
        nodes = results.flat()
      }
      if (nodes.length > 0) {
        this.nodeCache = nodes
      }
      return nodes
    } catch {
      const nodes = await this.listNodes()
      if (nodes.length > 0) {
        this.nodeCache = nodes
      }
      return nodes
    }
  }

  getCachedNodes (): TeleportNode[] {
    return this.nodeCache
  }

  hasCachedNodes (): boolean {
    return this.nodeCache.length > 0
  }

  clearLoginCache (): void {
    this.loginStatusCache = null
  }

  resolveUser (nodeLabels?: Record<string, string>): string {
    const defaultUser = this.config.store.teleport?.defaultUser ?? 'root'
    const overrides: UserOverrideRule[] = this.teleportConfig.userOverrides ?? []
    if (!nodeLabels || overrides.length === 0) { return defaultUser }
    for (const rule of overrides) {
      const [key, val] = rule.label.split('=', 2)
      if (key && val && nodeLabels[key] === val) {
        return rule.user
      }
    }
    return defaultUser
  }

  buildSshArgs (hostname: string, cluster?: string, nodeLabels?: Record<string, string>): string[] {
    const user = this.resolveUser(nodeLabels)
    const args = ['ssh', `${user}@${hostname}`]
    if (cluster) { args.push(`--cluster=${cluster}`) }
    return args
  }

  buildAutoLoginSshCommand (hostname: string, cluster?: string, nodeLabels?: Record<string, string>): { command: string; args: string[] } {
    const tshPath = this.teleportConfig.tshPath || 'tsh'
    const user = this.resolveUser(nodeLabels)
    const isWindows = this.hostApp.platform === Platform.Windows
    const q = (s: string) => this.shellQuote(s, isWindows)

    const loginParts = [q(tshPath), 'login']
    const proxy = this.teleportConfig.proxy
    const loginUser = this.teleportConfig.loginUser
    const authType = this.teleportConfig.authType
    const configCluster = this.teleportConfig.cluster
    if (proxy) { loginParts.push(q(`--proxy=${proxy}`)) }
    if (loginUser) { loginParts.push(q(`--user=${loginUser}`)) }
    if (authType) { loginParts.push(q(`--auth=${authType}`)) }
    if (configCluster) { loginParts.push(q(configCluster)) }

    const sshParts = [q(tshPath), 'ssh', q(`${user}@${hostname}`)]
    if (cluster) { sshParts.push(q(`--cluster=${cluster}`)) }

    const loginCmd = loginParts.join(' ')
    const sshCmd = sshParts.join(' ')

    if (isWindows) {
      return { command: 'cmd.exe', args: ['/c', `${loginCmd} && ${sshCmd}`] }
    }
    return { command: 'bash', args: ['-c', `${loginCmd} && ${sshCmd}`] }
  }

  private shellQuote (arg: string, isWindows: boolean): string {
    if (isWindows) {
      return `"${arg.replace(/"/g, '\\"')}"`
    }
    return `'${arg.replace(/'/g, "'\\''")}'`
  }

  async getTshVersion (): Promise<string | null> {
    try {
      const output = await this.exec(['version'])
      const match = output.match(/Teleport v(\d+\.\d+\.\d+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  async checkTshCompatibility (): Promise<{ compatible: boolean; version: string | null; message?: string }> {
    const version = await this.getTshVersion()
    if (!version) {
      return { compatible: false, version: null, message: 'tsh not found or version could not be determined.' }
    }
    const [major] = version.split('.').map(Number)
    if (major < 10) {
      return { compatible: false, version, message: `tsh v${version} may not support --format=json. Please upgrade to v10+.` }
    }
    return { compatible: true, version }
  }

}
