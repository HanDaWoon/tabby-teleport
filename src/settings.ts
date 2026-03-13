import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { TeleportSettingsComponent } from './components/teleportSettings.component'

@Injectable()
export class TeleportSettingsTabProvider extends SettingsTabProvider {
  id = 'teleport'
  icon = 'server'
  title = 'Teleport'

  getComponentType (): any {
    return TeleportSettingsComponent
  }
}
