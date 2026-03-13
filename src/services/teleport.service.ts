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

  private exec (args: string[]): Promise<string> {
    const tshPath = this.teleportConfig.tshPath || 'tsh'
    return new Promise((resolve, reject) => {
      const child = execFile(tshPath, args, { timeout: 5000 }, (error, stdout, stderr) => {
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

  async listNodes (cluster?: string): Promise<TeleportNode[]> {
    try {
      const args = ['ls', '--format=json']
      if (cluster) {
        args.push(`--cluster=${cluster}`)
      }
      const output = await this.exec(args)
      return JSON.parse(output) as TeleportNode[]
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
