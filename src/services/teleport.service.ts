import { Injectable } from '@angular/core'
import { ConfigService, NotificationsService } from 'tabby-core'
import { execFile } from 'child_process'
import { TeleportNode, TeleportCluster, TeleportConfig } from '../types'

@Injectable({ providedIn: 'root' })
export class TeleportService {
  constructor (
    private config: ConfigService,
    private notifications: NotificationsService,
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
        if (stderr && stderr.includes('ERROR')) {
          reject(new Error(stderr))
          return
        }
        resolve(stdout)
      })
    })
  }

  async isLoggedIn (): Promise<boolean> {
    try {
      const output = await this.exec(['status', '--format=json'])
      const status = JSON.parse(output)
      return !!status?.active
    } catch {
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
      const nodes = JSON.parse(output) as TeleportNode[]
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
      return JSON.parse(output) as TeleportCluster[]
    } catch (err: any) {
      this.notifications.error(`Failed to list Teleport clusters: ${err.message}`)
      return []
    }
  }

  async listAllNodes (): Promise<TeleportNode[]> {
    try {
      const clusters = await this.listClusters()
      if (clusters.length <= 1) {
        return this.listNodes()
      }
      const results = await Promise.all(
        clusters
          .filter(c => c.status === 'online')
          .map(c => this.listNodes(c.cluster_name)),
      )
      return results.flat()
    } catch {
      return this.listNodes()
    }
  }

  notifyNotLoggedIn (): void {
    this.notifications.error(
      'Not logged in to Teleport. Please run "tsh login" first.',
    )
  }

  notifyTshNotFound (): void {
    this.notifications.error(
      'tsh not found. Please install Teleport and configure the tsh path in Settings → Teleport.',
    )
  }
}
