import { Injectable } from '@angular/core'
import { ProfileProvider, NewTabParameters, ConfigService, PartialProfile } from 'tabby-core'
import { TerminalTabComponent } from 'tabby-local'
import { LocalProfile } from 'tabby-local'
import { TeleportService } from './teleport.service'

@Injectable()
export class TeleportProfileProvider extends ProfileProvider<LocalProfile> {
  id = 'teleport'
  name = 'Teleport'

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
    try {
      const loggedIn = await this.teleport.isLoggedIn()
      const tshPath = this.config.store.teleport?.tshPath ?? 'tsh'

      const env = this.config.store.teleport?.env ?? {}
      const hasEnv = Object.keys(env).length > 0

      if (!loggedIn) {
        const loginArgs = ['login']
        const proxy = this.config.store.teleport?.proxy
        const loginUser = this.config.store.teleport?.loginUser
        const authType = this.config.store.teleport?.authType
        const cluster = this.config.store.teleport?.cluster
        if (proxy) { loginArgs.push(`--proxy=${proxy}`) }
        if (loginUser) { loginArgs.push(`--user=${loginUser}`) }
        if (authType) { loginArgs.push(`--auth=${authType}`) }
        if (cluster) { loginArgs.push(cluster) }

        return [{
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
        }]
      }

      const nodes = await this.teleport.listNodes()
      const user = this.config.store.teleport?.defaultUser ?? 'root'

      return nodes.map(node => ({
        id: `teleport:${node.spec.hostname}`,
        type: 'local',
        name: `Teleport: ${node.spec.hostname}`,
        group: 'Teleport',
        icon: 'fas fa-server',
        options: {
          command: tshPath,
          args: ['ssh', `${user}@${node.spec.hostname}`],
          ...hasEnv && { env },
        },
        isBuiltin: true,
        isTemplate: false,
      }))
    } catch {
      return []
    }
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
    const args = profile.options?.args ?? []
    return args.length > 1 ? `tsh ssh ${args[1]}` : 'Teleport SSH'
  }
}
