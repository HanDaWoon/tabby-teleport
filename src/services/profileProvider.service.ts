import { Injectable } from '@angular/core'
import { ProfileProvider, NewTabParameters, ConfigService, PartialProfile } from 'tabby-core'
import { TerminalTabComponent } from 'tabby-local'
import { LocalProfile } from 'tabby-local'
import { TeleportService } from './teleport.service'

@Injectable()
export class TeleportProfileProvider extends ProfileProvider<LocalProfile> {
  id = 'teleport'
  name = 'Teleport'
  private labelCache = new Map<string, string>()
  private profileCache: PartialProfile<LocalProfile>[] | null = null
  private profileCacheTime = 0
  private profileCachePromise: Promise<PartialProfile<LocalProfile>[]> | null = null
  private static readonly CACHE_TTL = 30_000
  configDefaults = {
    options: {
      command: '',
      args: [] as string[],
      env: {},
      cwd: undefined,
      pauseAfterExit: false,
      runAsAdministrator: false,
    },
  }

  constructor (
    private config: ConfigService,
    private teleport: TeleportService,
  ) {
    super()
  }

  async getBuiltinProfiles (): Promise<PartialProfile<LocalProfile>[]> {
    const now = Date.now()
    if (this.profileCache && (now - this.profileCacheTime) < TeleportProfileProvider.CACHE_TTL) {
      return this.profileCache
    }
    if (this.profileCachePromise) {
      return this.profileCachePromise
    }
    this.profileCachePromise = this.fetchProfiles().finally(() => {
      this.profileCachePromise = null
    })
    return this.profileCachePromise
  }

  private async fetchProfiles (): Promise<PartialProfile<LocalProfile>[]> {
    try {
      const loggedIn = await this.teleport.isLoggedIn()
      const tshPath = this.config.store.teleport?.tshPath ?? 'tsh'

      const env = this.config.store.teleport?.env ?? {}
      const hasEnv = Object.keys(env).length > 0

      const loginProfile: PartialProfile<LocalProfile> = this.buildLoginProfile(tshPath, env, hasEnv)

      let result: PartialProfile<LocalProfile>[]
      if (loggedIn) {
        const nodes = await this.teleport.listAllNodes()
        result = this.buildNodeProfiles(nodes, tshPath, env, hasEnv, false)
      } else if (this.teleport.hasCachedNodes()) {
        const nodes = this.teleport.getCachedNodes()
        result = [loginProfile, ...this.buildNodeProfiles(nodes, tshPath, env, hasEnv, true)]
      } else {
        result = [loginProfile]
      }

      this.profileCache = result
      this.profileCacheTime = Date.now()
      return result
    } catch (err) {
      console.error('Teleport: failed to fetch profiles', err)
      return []
    }
  }

  private buildLoginProfile (tshPath: string, env: Record<string, string>, hasEnv: boolean): PartialProfile<LocalProfile> {
    const loginArgs = ['login']
    const proxy = this.config.store.teleport?.proxy
    const loginUser = this.config.store.teleport?.loginUser
    const authType = this.config.store.teleport?.authType
    const cluster = this.config.store.teleport?.cluster
    if (proxy) { loginArgs.push(`--proxy=${proxy}`) }
    if (loginUser) { loginArgs.push(`--user=${loginUser}`) }
    if (authType) { loginArgs.push(`--auth=${authType}`) }
    if (cluster) { loginArgs.push(cluster) }

    return {
      id: 'teleport:login',
      type: 'local',
      name: 'Teleport: Login',
      group: 'Teleport',
      icon: 'fas fa-sign-in-alt',
      options: {
        command: tshPath,
        args: loginArgs,
        pauseAfterExit: true,
        ...hasEnv && { env },
      },
      isBuiltin: true,
      isTemplate: false,
    }
  }

  private buildNodeProfiles (
    nodes: import('../types').TeleportNode[],
    tshPath: string,
    env: Record<string, string>,
    hasEnv: boolean,
    useAutoLogin: boolean,
  ): PartialProfile<LocalProfile>[] {
    this.labelCache.clear()
    return nodes.map(node => {
      const labels = node.metadata.labels ?? {}
      const labelStr = Object.entries(labels)
        .filter(([k]) => !k.startsWith('teleport.'))
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
      const group = node.cluster ? `Teleport/${node.cluster}` : 'Teleport'
      const id = `teleport:${node.cluster ? node.cluster + '/' : ''}${node.spec.hostname}`
      this.labelCache.set(id, labelStr)

      let options: any
      if (useAutoLogin) {
        const cmd = this.teleport.buildAutoLoginSshCommand(node.spec.hostname, node.cluster)
        options = {
          command: cmd.command,
          args: cmd.args,
          ...hasEnv && { env },
        }
      } else {
        options = {
          command: tshPath,
          args: this.teleport.buildSshArgs(node.spec.hostname, node.cluster),
          ...hasEnv && { env },
        }
      }

      return {
        id,
        type: 'local',
        name: `Teleport: ${node.spec.hostname}`,
        group,
        icon: 'fas fa-server',
        options,
        isBuiltin: true,
        isTemplate: false,
      }
    })
  }

  async getNewTabParameters (profile: LocalProfile): Promise<NewTabParameters<TerminalTabComponent>> {
    return {
      type: TerminalTabComponent,
      inputs: { profile },
    }
  }

  getSuggestedName (profile: PartialProfile<LocalProfile>): string {
    return profile.name
  }

  getDescription (profile: PartialProfile<LocalProfile>): string {
    const labelStr = this.labelCache.get(profile.id ?? '')
    if (labelStr) {
      return labelStr
    }
    const args = profile.options?.args ?? []
    if (args.length > 1) {
      return `tsh ssh ${args[1]}`
    }
    return 'Teleport SSH'
  }
}
