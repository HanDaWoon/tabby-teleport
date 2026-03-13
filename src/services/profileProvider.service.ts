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
      if (!loggedIn) {
        return []
      }

      const nodes = await this.teleport.listNodes()
      const user = this.config.store.teleport?.defaultUser ?? 'root'
      const tshPath = this.config.store.teleport?.tshPath ?? 'tsh'

      return nodes.map(node => ({
        id: `teleport:${node.spec.hostname}`,
        type: 'local',
        name: `Teleport: ${node.spec.hostname}`,
        group: 'Teleport',
        icon: 'fas fa-server',
        options: {
          command: tshPath,
          args: ['ssh', `${user}@${node.spec.hostname}`],
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
